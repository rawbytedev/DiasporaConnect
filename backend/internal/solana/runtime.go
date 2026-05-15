package solana

import (
	"Diaspora/internal/mocks"
	"sync/atomic"
)

var runtimeMode atomic.Int32

const (
	ModeMock   int32 = 0
	ModeDevnet int32 = 1
)

func SetRuntimeMode(mode string) {
	if mode == "mock" {
		runtimeMode.Store(ModeMock)
		return
	}
	runtimeMode.Store(ModeDevnet)
}

func CurrentRuntimeMode() string {
	if runtimeMode.Load() == ModeMock {
		return "mock"
	}
	return "devnet"
}

func NewRuntimeClient(real ClientInterface) ClientInterface {
	if CurrentRuntimeMode() == "mock" {
		return mocks.NewMockSolanaClient()
	}
	return real
}
