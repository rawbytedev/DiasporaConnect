package handlers

import (
        "Diaspora/internal/middleware"
        "Diaspora/internal/repository"
        "net/http"
)

// GetAccount returns the authenticated user's profile information.
//
//      GET /api/account
//      Authorization: Bearer <token>
func GetAccount(userRepo *repository.UserRepo) http.HandlerFunc {
        return func(w http.ResponseWriter, r *http.Request) {
                userID, ok := middleware.UserIDFromContext(r.Context())
                if !ok {
                        middleware.JSONError(w, http.StatusUnauthorized, "missing user context")
                        return
                }

                user, err := userRepo.GetUserByID(r.Context(), userID)
                if err != nil {
                        middleware.JSONError(w, http.StatusNotFound, "user not found")
                        return
                }

                middleware.JSONResponse(w, http.StatusOK, map[string]interface{}{
                        "id":             user.ID,
                        "name":           user.Name,
                        "phone_number":   user.PhoneNumber,
                        "solana_pubkey":  user.SolanaPubkey,
                        "kyc_verified":   user.KYCVerified,
                        "transfer_limit": transferLimitForUser(user.KYCVerified),
                        "created_at":     user.CreatedAt,
                })
        }
}

// GetBalance returns the authenticated user's real-time USDT balance, computed
// from their full transfer history (initial grant of 1 000 USDT minus sent
// transfers, plus claimed received transfers).
//
//      GET /api/balance
//      Authorization: Bearer <token>
func GetBalance(userRepo *repository.UserRepo, transferRepo *repository.TransferRepo) http.HandlerFunc {
        return func(w http.ResponseWriter, r *http.Request) {
                userID, ok := middleware.UserIDFromContext(r.Context())
                if !ok {
                        middleware.JSONError(w, http.StatusUnauthorized, "missing user context")
                        return
                }

                user, err := userRepo.GetUserByID(r.Context(), userID)
                if err != nil {
                        middleware.JSONError(w, http.StatusNotFound, "user not found")
                        return
                }

                balance, err := transferRepo.ComputeBalance(r.Context(), userID)
                if err != nil {
                        middleware.JSONResponse(w, http.StatusOK, map[string]interface{}{
                                "solana_pubkey": user.SolanaPubkey,
                                "balance_usdt":  0.0,
                                "warning":       "could not compute balance: " + err.Error(),
                        })
                        return
                }

                middleware.JSONResponse(w, http.StatusOK, map[string]interface{}{
                        "solana_pubkey": user.SolanaPubkey,
                        "balance_usdt":  balance,
                })
        }
}
