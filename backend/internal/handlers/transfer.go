package handlers

import (
	"Diaspora/internal/middleware"
	"Diaspora/internal/models"
	"Diaspora/internal/repository"
	"Diaspora/internal/solana"
	"encoding/json"
	"net/http"
	"time"
)

const (
	// KYCThreshold is the minimum transfer amount (USDT) that requires KYC verification.
	KYCThreshold = 1000.0
	// ConfirmThreshold is the minimum transfer amount that triggers the extra confirmation step (frontend only).
	ConfirmThreshold = 500.0
)

// TransferRequest is the JSON body for POST /api/transfer.
type TransferRequest struct {
	RecipientPhone string  `json:"recipient_phone"`
	AmountUSDT     float64 `json:"amount_usdt"`
	Note           string  `json:"note"`
}

// SendTransfer initiates a USDT escrow transfer on the Solana blockchain.
//
//	POST /api/transfer
//	Authorization: Bearer <token>
//	Content-Type: application/json
func SendTransfer(userRepo *repository.UserRepo, transferRepo *repository.TransferRepo, solClient solana.ClientInterface) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := middleware.UserIDFromContext(r.Context())
		if !ok {
			middleware.JSONError(w, http.StatusUnauthorized, "missing user context")
			return
		}

		var req TransferRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			middleware.JSONError(w, http.StatusBadRequest, "invalid JSON body")
			return
		}
		if req.RecipientPhone == "" {
			middleware.JSONError(w, http.StatusBadRequest, "recipient_phone is required")
			return
		}
		if req.AmountUSDT <= 0 {
			middleware.JSONError(w, http.StatusBadRequest, "amount_usdt must be positive")
			return
		}

		sender, err := userRepo.GetUserByID(r.Context(), userID)
		if err != nil {
			middleware.JSONError(w, http.StatusNotFound, "sender not found")
			return
		}

		// Enforce KYC for large transfers.
		if req.AmountUSDT >= KYCThreshold && !sender.KYCVerified {
			middleware.JSONError(w, http.StatusForbidden, "kyc_required: transfers of 1000 USDT or more require identity verification")
			return
		}

		recipient, err := userRepo.GetUserByPhone(r.Context(), req.RecipientPhone)
		if err != nil {
			middleware.JSONError(w, http.StatusNotFound, "recipient not found")
			return
		}
		if recipient.ID == userID {
			middleware.JSONError(w, http.StatusBadRequest, "cannot transfer to yourself")
			return
		}

		fees := req.AmountUSDT * 0.01
		netAmount := req.AmountUSDT - fees

		txHash, nonce, err := solClient.InitiateTransfer(userID, recipient.ID, netAmount, fees)
		if err != nil {
			middleware.JSONError(w, http.StatusInternalServerError, "blockchain error: "+err.Error())
			return
		}

		note := req.Note
		if len(note) > 200 {
			note = note[:200]
		}

		transfer := &models.Transfer{
			SenderID:     userID,
			RecipientID:  recipient.ID,
			AmountUSDT:   netAmount,
			FeesUSDT:     fees,
			SolanaTxHash: txHash,
			EscrowNonce:  nonce,
			Note:         note,
			Status:       "pending",
			ExpiresAt:    time.Now().Add(7 * 24 * time.Hour),
		}
		if err := transferRepo.CreateTransfer(r.Context(), transfer); err != nil {
			middleware.JSONError(w, http.StatusInternalServerError, "failed to save transfer record")
			return
		}

		_ = userRepo.UpdateStateVersion(userID)
		_ = userRepo.UpdateStateVersion(recipient.ID)
		_ = transferRepo.InvalidateTransferCaches(userID, recipient.ID, userRepo)

		middleware.JSONResponse(w, http.StatusCreated, map[string]interface{}{
			"transfer_id":     transfer.ID,
			"tx_hash":         txHash,
			"amount_usdt":     netAmount,
			"fees_usdt":       fees,
			"recipient_phone": req.RecipientPhone,
			"note":            note,
			"status":          "pending",
			"expires_at":      transfer.ExpiresAt,
		})
	}
}
