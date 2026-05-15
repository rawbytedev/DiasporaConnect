package handlers

import (
	"Diaspora/internal/middleware"
	"Diaspora/internal/repository"
	"net/http"
)

// LookupUser returns the name of a registered user by phone number.
// This lets the sender verify they are sending to the right person.
//
//	GET /api/user/lookup?phone=<phone>
//	Authorization: Bearer <token>
func LookupUser(userRepo *repository.UserRepo) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		phone := r.URL.Query().Get("phone")
		if phone == "" {
			middleware.JSONError(w, http.StatusBadRequest, "phone query parameter is required")
			return
		}

		user, err := userRepo.GetUserByPhone(r.Context(), phone)
		if err != nil {
			middleware.JSONError(w, http.StatusNotFound, "user not found")
			return
		}

		middleware.JSONResponse(w, http.StatusOK, map[string]interface{}{
			"name":         user.Name,
			"phone_number": user.PhoneNumber,
		})
	}
}
