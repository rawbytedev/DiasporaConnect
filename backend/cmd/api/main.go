// DiasporaConnect API – entry point.
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
        "context"
        "log"
        "net/http"
        "os"
        "path/filepath"
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

// runMigrations applies additive schema changes that are safe to re-run.
func runMigrations(database *db.PostgresDB) {
        pool := database.GetPool()
        ctx := context.Background()

        migrations := []string{
                // Add KYC column to users if it doesn't exist yet.
                `ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_verified BOOLEAN NOT NULL DEFAULT FALSE`,
                // Add note column to transfers if it doesn't exist yet.
                `ALTER TABLE transfers ADD COLUMN IF NOT EXISTS note TEXT NOT NULL DEFAULT ''`,
        }

        for _, stmt := range migrations {
                if _, err := pool.Exec(ctx, stmt); err != nil {
                        log.Printf("migration warning: %v", err)
                }
        }
        log.Println("DB migrations applied")
}

func main() {
        cfg := config.NewConfig()

        dbPost, err := db.NewPostgresDB(cfg.PostgresDSN)
        if err != nil {
                log.Fatalf("postgres connect: %v", err)
        }

        runMigrations(dbPost)

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
        mux.HandleFunc("/api/user/lookup", middleware.AuthMiddleware(handlers.LookupUser(userRepo)))
        mux.HandleFunc("/api/kyc/status", middleware.AuthMiddleware(handlers.KYCStatus(userRepo)))
        mux.HandleFunc("/api/kyc/submit", middleware.AuthMiddleware(handlers.KYCSubmit(userRepo)))

        // Serve the built React SPA for all non-API routes.
        if cfg.StaticDir != "" {
                fs := http.FileServer(http.Dir(cfg.StaticDir))
                mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
                        path := filepath.Join(cfg.StaticDir, filepath.Clean(r.URL.Path))
                        if _, err := os.Stat(path); os.IsNotExist(err) {
                                // SPA fallback: serve index.html for unknown paths.
                                http.ServeFile(w, r, filepath.Join(cfg.StaticDir, "index.html"))
                                return
                        }
                        fs.ServeHTTP(w, r)
                })
                log.Printf("Serving static files from %s", cfg.StaticDir)
        }

        handler := corsMiddleware(middleware.LoggingMiddleware(mux))
        addr := ":" + cfg.Port
        log.Printf("DiasporaConnect API listening on %s", addr)
        log.Fatal(http.ListenAndServe(addr, handler))
}
