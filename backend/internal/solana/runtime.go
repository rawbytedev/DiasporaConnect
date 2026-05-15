package solana

import (
	"Diaspora/internal/handlers"
	"Diaspora/internal/mocks"
)

func NewRuntimeClient(real ClientInterface) ClientInterface {
	if handlers.CurrentRuntimeMode() == "mock" {
		return mocks.NewMockSolanaClient()
	}
	return real
}
