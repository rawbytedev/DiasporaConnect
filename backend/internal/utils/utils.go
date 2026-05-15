package utils

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"strconv"

	"github.com/gagliardetto/solana-go"
)

// GenerateOTP returns a cryptographically random 6-digit numeric string.
func GenerateOTP() string {
	digits := make([]byte, 6)
	for i := range digits {
		n, err := rand.Int(rand.Reader, big.NewInt(10))
		if err != nil {
			digits[i] = '0'
		} else {
			digits[i] = byte('0') + byte(n.Int64())
		}
	}
	return string(digits)
}

// FormatOTPMessage returns a human-readable string for the OTP code.
func FormatOTPMessage(otp string) string {
	return fmt.Sprintf("Votre code de vérification DiasporaConnect : %s", otp)
}

// NewSolanaAddress generates a fresh Ed25519 keypair and returns the base58
// public key together with the raw 64-byte private key.
func NewSolanaAddress() (string, solana.PrivateKey, error) {
	wallet := solana.NewWallet()
	return wallet.PublicKey().String(), wallet.PrivateKey, nil
}

// ParseAmount converts a decimal string to a float64, returning 0 on error.
func ParseAmount(amount string) float64 {
	val, err := strconv.ParseFloat(amount, 64)
	if err != nil {
		return 0
	}
	return val
}
