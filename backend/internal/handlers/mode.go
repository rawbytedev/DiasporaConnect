package handlers

import (
	"Diaspora/internal/middleware"
	"Diaspora/internal/solana"
	"encoding/json"
	"net/http"
)

type ModeRequest struct {
	Mode string `json:"mode"`
}

func SetRuntimeMode() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req ModeRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			middleware.JSONError(w, http.StatusBadRequest, "invalid JSON body")
			return
		}
		if req.Mode != "mock" && req.Mode != "devnet" {
			middleware.JSONError(w, http.StatusBadRequest, "mode must be mock or devnet")
			return
		}
		solana.SetRuntimeMode(req.Mode)
		middleware.JSONResponse(w, http.StatusOK, map[string]string{"mode": solana.CurrentRuntimeMode()})
	}
}
