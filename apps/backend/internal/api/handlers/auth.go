package handlers

import (
	"net/http"
	"time"

	"clipsync/backend/internal/config"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

type AuthHandler struct {
	db *gorm.DB
}

func NewAuthHandler(db *gorm.DB) *AuthHandler {
	return &AuthHandler{db: db}
}

// Note: Signup and Login are handled by Better-Auth
// These endpoints are kept for backward compatibility but should redirect to Better-Auth

func (h *AuthHandler) Signup(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{
		"error": "Signup is handled by Better-Auth. Please use /api/auth/signup",
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{
		"error": "Login is handled by Better-Auth. Please use /api/auth/login",
	})
}

func (h *AuthHandler) Logout(c *gin.Context) {

	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

func (h *AuthHandler) Me(c *gin.Context) {
	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userIDStr := userID.(string)


	c.JSON(http.StatusOK, gin.H{
		"id": userIDStr,
		"message": "User details are managed by Better-Auth. Use /api/auth/me for full user info",
	})
}

func (h *AuthHandler) generateToken(userID string) string {
	claims := jwt.MapClaims{
		"userId": userID,
		"exp":    time.Now().Add(time.Hour * 24 * 7).Unix(), // 7 days
		"iat":    time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, _ := token.SignedString([]byte(config.Get().JWTSecret))

	return tokenString
}
