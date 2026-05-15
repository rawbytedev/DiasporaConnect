package handlers

import (
	"Diaspora/internal/middleware"
	"encoding/json"
	"net/http"
	"sync/atomic"
)

var runtimeMode atomic.Int32

const (
	ModeMock   int32 = 0
	ModeDevnet int32 = 1
)

func init() {
	runtimeMode.Store(ModeDevnet)
}

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

		switch req.Mode {
		case "mock":
			runtimeMode.Store(ModeMock)
		case "devnet":
			runtimeMode.Store(ModeDevnet)
		default:
			middleware.JSONError(w, http.StatusBadRequest, "mode must be mock or devnet")
			return
		}

		middleware.JSONResponse(w, http.StatusOK, map[string]string{"mode": req.Mode})
	}
}

func CurrentRuntimeMode() string {
	if runtimeMode.Load() == ModeMock {
		return "mock"
	}
	return "devnet"
}
