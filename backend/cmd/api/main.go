// DiasporaConnect API – entry point.
//
// The server registers all HTTP routes, wires up the PostgreSQL and BadgerDB
// connections, and starts listening.  Configuration is loaded entirely from
// environment variables; see internal/config for the full list.
package main

import (
	"Diaspora/internal/cache"
	"Diaspora/internal/config"
	"Diaspora/internal/db"
	"Diaspora/internal/handlers"
	"Diaspora/internal/middleware"
	"Diaspora/internal/mobilemoney"
	"Diaspora/internal/repository"
	"Diaspora/internal/solana"
	"log"
	"net/http"
)

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func main() {
	cfg := config.NewConfig()

	dbPost, err := db.NewPostgresDB(cfg.PostgresDSN)
	if err != nil {
		log.Fatalf("postgres connect: %v", err)
	}

	cacheDB, err := cache.NewCache(cfg.CacheDir, nil)
	if err != nil {
		log.Fatalf("badger open: %v", err)
	}
	defer cacheDB.Close()

	realSolClient, err := solana.NewClient(
		cfg.SolanaRPCURL,
		dbPost,
		cfg.AdminPrivateKey,
		cfg.SolanaProgramID,
		cfg.USDCMintAddress,
		cfg.TreasuryPublicKey,
	)
	if err != nil {
		log.Fatalf("solana client: %v", err)
	}

	solClient := solana.NewRuntimeClient(realSolClient)
	userRepo := repository.NewUserRepo(cacheDB, dbPost, solClient)
	transferRepo := repository.NewTransferRepo(cacheDB, dbPost)
	mmClient := mobilemoney.NewClient(cfg.MobileMoneyAPIURL, cfg.MobileMoneyAPIKey, cfg.MobileMoneyAPISecret)

	mux := http.NewServeMux()
	mux.HandleFunc("/api/register", handlers.Register(userRepo))
	mux.HandleFunc("/api/login", handlers.Login(userRepo))
	mux.HandleFunc("/api/verify-otp", handlers.VerifyOTP(userRepo))
	mux.HandleFunc("/api/mode", handlers.SetRuntimeMode())
	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		middleware.JSONResponse(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	mux.HandleFunc("/api/account", middleware.AuthMiddleware(handlers.GetAccount(userRepo)))
	mux.HandleFunc("/api/balance", middleware.AuthMiddleware(handlers.GetBalance(userRepo, solClient)))
	mux.HandleFunc("/api/transfers", middleware.AuthMiddleware(handlers.GetTransfers(transferRepo)))
	mux.HandleFunc("/api/transfers/detail", middleware.AuthMiddleware(handlers.GetTransfer(transferRepo)))
	mux.HandleFunc("/api/transfer", middleware.AuthMiddleware(handlers.SendTransfer(userRepo, transferRepo, solClient)))
	mux.HandleFunc("/api/claim", middleware.AuthMiddleware(handlers.ClaimTransfer(transferRepo, userRepo, solClient, dbPost)))
	mux.HandleFunc("/api/refund", middleware.AuthMiddleware(handlers.RefundTransfer(transferRepo, userRepo, solClient, dbPost)))
	mux.HandleFunc("/api/withdraw", middleware.AuthMiddleware(handlers.Withdraw(userRepo, mmClient)))

	handler := corsMiddleware(middleware.LoggingMiddleware(mux))
	addr := ":" + cfg.Port
	log.Printf("DiasporaConnect API listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, handler))
}
