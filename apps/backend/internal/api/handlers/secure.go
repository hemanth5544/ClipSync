package handlers

import (
	"crypto/rand"
	"encoding/base64"
	"net/http"

	"clipsync/backend/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type SecureHandler struct {
	db *gorm.DB
}

func NewSecureHandler(db *gorm.DB) *SecureHandler {
	return &SecureHandler{db: db}
}

// GetVaultStatus returns whether the user has a vault and the salt for key derivation
func (h *SecureHandler) GetVaultStatus(c *gin.Context) {
	userID, _ := c.Get("userId")
	userIDStr := userID.(string)

	var vault models.UserVault
	if err := h.db.Where("user_id = ?", userIDStr).First(&vault).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusOK, gin.H{"exists": false})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get vault"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"exists": true,
		"salt":   vault.Salt,
		"createdAt": vault.CreatedAt,
	})
}

// CreateVault creates a new vault with a random salt. Client uses salt + master password for key derivation.
func (h *SecureHandler) CreateVault(c *gin.Context) {
	userID, _ := c.Get("userId")
	userIDStr := userID.(string)

	// Check if vault already exists
	var existing models.UserVault
	if err := h.db.Where("user_id = ?", userIDStr).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Vault already exists"})
		return
	}

	// Generate random 32-byte salt
	salt := make([]byte, 32)
	if _, err := rand.Read(salt); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate salt"})
		return
	}
	saltB64 := base64.StdEncoding.EncodeToString(salt)

	vault := models.UserVault{
		UserID: userIDStr,
		Salt:   saltB64,
	}
	if err := h.db.Create(&vault).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create vault"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"salt": vault.Salt,
		"createdAt": vault.CreatedAt,
	})
}

type CreateSecureClipRequest struct {
	EncryptedPayload string `json:"encryptedPayload" binding:"required"`
	Nonce            string `json:"nonce" binding:"required"`
}

// CreateSecureClip stores an encrypted clip (client encrypts before sending)
func (h *SecureHandler) CreateSecureClip(c *gin.Context) {
	userID, _ := c.Get("userId")
	userIDStr := userID.(string)

	var req CreateSecureClipRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Ensure user has a vault
	var vault models.UserVault
	if err := h.db.Where("user_id = ?", userIDStr).First(&vault).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Vault not set up"})
		return
	}

	clip := models.SecureClip{
		UserID:           userIDStr,
		EncryptedPayload: req.EncryptedPayload,
		Nonce:            req.Nonce,
	}
	if err := h.db.Create(&clip).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save secure clip"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":        clip.ID,
		"createdAt": clip.CreatedAt,
	})
}

// GetSecureClips returns all encrypted clips for the user (client decrypts)
func (h *SecureHandler) GetSecureClips(c *gin.Context) {
	userID, _ := c.Get("userId")
	userIDStr := userID.(string)

	var clips []models.SecureClip
	if err := h.db.Where("user_id = ?", userIDStr).Order("created_at DESC").Find(&clips).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch secure clips"})
		return
	}

	c.JSON(http.StatusOK, clips)
}

type UpdateSecureClipRequest struct {
	EncryptedPayload string `json:"encryptedPayload" binding:"required"`
	Nonce            string `json:"nonce" binding:"required"`
}

// UpdateSecureClip updates an encrypted clip
func (h *SecureHandler) UpdateSecureClip(c *gin.Context) {
	userID, _ := c.Get("userId")
	userIDStr := userID.(string)
	clipID := c.Param("id")

	var req UpdateSecureClipRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var clip models.SecureClip
	if err := h.db.Where("id = ? AND user_id = ?", clipID, userIDStr).First(&clip).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Secure clip not found"})
		return
	}

	clip.EncryptedPayload = req.EncryptedPayload
	clip.Nonce = req.Nonce
	if err := h.db.Save(&clip).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update"})
		return
	}

	c.JSON(http.StatusOK, clip)
}

// DeleteSecureClip deletes a secure clip
func (h *SecureHandler) DeleteSecureClip(c *gin.Context) {
	userID, _ := c.Get("userId")
	userIDStr := userID.(string)
	clipID := c.Param("id")

	result := h.db.Where("id = ? AND user_id = ?", clipID, userIDStr).Delete(&models.SecureClip{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Secure clip not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}
