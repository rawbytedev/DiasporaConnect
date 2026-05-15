package handlers

import (
	"Diaspora/internal/middleware"
	"Diaspora/internal/repository"
	"net/http"
)

// KYCStatus returns whether the authenticated user has completed KYC verification.
//
//	GET /api/kyc/status
//	Authorization: Bearer <token>
func KYCStatus(userRepo *repository.UserRepo) http.HandlerFunc {
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
			"kyc_verified":    user.KYCVerified,
			"transfer_limit":  transferLimitForUser(user.KYCVerified),
			"confirm_threshold": 500.0,
		})
	}
}

// KYCSubmit simulates a KYC verification submission. In production this would
// trigger a real identity-verification workflow. Here it marks the user as
// verified after accepting the submitted details.
//
//	POST /api/kyc/submit
//	Authorization: Bearer <token>
func KYCSubmit(userRepo *repository.UserRepo) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := middleware.UserIDFromContext(r.Context())
		if !ok {
			middleware.JSONError(w, http.StatusUnauthorized, "missing user context")
			return
		}

		if err := userRepo.SetKYCVerified(r.Context(), userID); err != nil {
			middleware.JSONError(w, http.StatusInternalServerError, "failed to update KYC status")
			return
		}

		middleware.JSONResponse(w, http.StatusOK, map[string]interface{}{
			"kyc_verified":   true,
			"transfer_limit": transferLimitForUser(true),
			"message":        "KYC verification approved",
		})
	}
}

// transferLimitForUser returns the per-transfer USDT limit based on KYC status.
func transferLimitForUser(kycVerified bool) float64 {
	if kycVerified {
		return 10000.0
	}
	return 999.99
}
