package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"strings"
	"time"

	"clipsync/backend/internal/config"
	"clipsync/backend/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

type PairingHandler struct {
	db *gorm.DB
}

func NewPairingHandler(db *gorm.DB) *PairingHandler {
	return &PairingHandler{db: db}
}

func (h *PairingHandler) GeneratePairingCode(c *gin.Context) {
	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userIDStr := userID.(string)

	bytes := make([]byte, 3)
	if _, err := rand.Read(bytes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate code"})
		return
	}
	code := strings.ToUpper(hex.EncodeToString(bytes))

	var existing models.PairingCode
	for h.db.Where("UPPER(code) = ?", code).First(&existing).Error == nil {
		// Regenerate if exists
		rand.Read(bytes)
		code = strings.ToUpper(hex.EncodeToString(bytes))
	}

	pairingCode := models.PairingCode{
		Code:      code,
		UserID:    userIDStr,
		ExpiresAt: time.Now().Add(5 * time.Minute),
		Used:      false,
	}

	if err := h.db.Create(&pairingCode).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create pairing code"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":      code,
		"expiresAt": pairingCode.ExpiresAt,
		"qrData":    fmt.Sprintf("clipsync://pair/%s", code),
	})
}

func (h *PairingHandler) VerifyPairingCode(c *gin.Context) {
	var req struct {
		Code string `json:"code" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Code is required"})
		return
	}

	code := strings.ToUpper(strings.TrimSpace(req.Code))
	if len(code) != 6 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid code format"})
		return
	}

	var pairingCode models.PairingCode
	if err := h.db.Where("UPPER(code) = ?", code).First(&pairingCode).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Invalid pairing code"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify code"})
		return
	}

	// Check if code is valid
	if !pairingCode.IsValid() {
		if pairingCode.Used {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Pairing code already used"})
			return
		}
		if pairingCode.IsExpired() {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Pairing code expired"})
			return
		}
	}

	// Mark code as used
	pairingCode.Used = true
	if err := h.db.Save(&pairingCode).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to use pairing code"})
		return
	}

	// Generate JWT token for the user
	token := h.generateToken(pairingCode.UserID)

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"userId": pairingCode.UserID,
		"message": "Pairing successful",
	})
}

func (h *PairingHandler) generateToken(userID string) string {
	claims := jwt.MapClaims{
		"userId": userID,
		"exp":    time.Now().Add(time.Hour * 24 * 7).Unix(), // 7 days
		"iat":    time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, _ := token.SignedString([]byte(config.Get().JWTSecret))

	return tokenString
}
