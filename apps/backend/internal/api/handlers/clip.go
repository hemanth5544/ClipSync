package handlers

import (
	"net/http"
	"time"

	"clipsync/backend/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ClipHandler struct {
	db *gorm.DB
}

func NewClipHandler(db *gorm.DB) *ClipHandler {
	return &ClipHandler{db: db}
}

type CreateClipRequest struct {
	Content    string   `json:"content" binding:"required"`
	DeviceName string   `json:"deviceName"`
	Tags       []string `json:"tags"`
}

type UpdateClipRequest struct {
	Content    *string   `json:"content"`
	IsFavorite *bool     `json:"isFavorite"`
	IsPinned   *bool     `json:"isPinned"`
	Tags       *[]string `json:"tags"`
}

func (h *ClipHandler) GetClips(c *gin.Context) {
	userID, _ := c.Get("userId")
	userIDStr := userID.(string)

	page := c.DefaultQuery("page", "1")
	pageSize := c.DefaultQuery("pageSize", "20")
	search := c.Query("search")
	favorite := c.Query("favorite")

	query := h.db.Where("user_id = ?", userIDStr)

	if search != "" {
		query = query.Where("content ILIKE ? OR content_preview ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	if favorite == "true" {
		query = query.Where("is_favorite = ?", true)
	}

	// Order by pinned first, then by copied_at desc
	query = query.Order("is_pinned DESC, copied_at DESC")

	var clips []models.Clip
	var total int64

	query.Model(&models.Clip{}).Count(&total)

	offset := (parseInt(page) - 1) * parseInt(pageSize)
	if err := query.Order("is_pinned DESC, copied_at DESC").Offset(offset).Limit(parseInt(pageSize)).Find(&clips).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch clips"})
		return
	}

	totalPages := (int(total) + parseInt(pageSize) - 1) / parseInt(pageSize)

	c.JSON(http.StatusOK, gin.H{
		"data":       clips,
		"total":      total,
		"page":       parseInt(page),
		"pageSize":   parseInt(pageSize),
		"totalPages": totalPages,
	})
}

func (h *ClipHandler) GetClip(c *gin.Context) {
	userID, _ := c.Get("userId")
	clipID := c.Param("id")

	var clip models.Clip
	if err := h.db.Where("id = ? AND user_id = ?", clipID, userID).First(&clip).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Clip not found"})
		return
	}

	c.JSON(http.StatusOK, clip)
}

func (h *ClipHandler) CreateClip(c *gin.Context) {
	userID, _ := c.Get("userId")
	userIDStr := userID.(string)

	var req CreateClipRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	preview := req.Content
	if len(preview) > 200 {
		preview = preview[:200]
	}

	clip := models.Clip{
		ID:            uuid.New(),
		UserID:        userIDStr,
		Content:       req.Content,
		ContentPreview: preview,
		CopiedAt:      time.Now(),
		IsFavorite:    false,
		Tags:          req.Tags,
		DeviceName:    &req.DeviceName,
		Synced:        true,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if err := h.db.Create(&clip).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create clip"})
		return
	}

	c.JSON(http.StatusCreated, clip)
}

func (h *ClipHandler) DeleteClip(c *gin.Context) {
	userID, _ := c.Get("userId")
	clipID := c.Param("id")

	if err := h.db.Where("id = ? AND user_id = ?", clipID, userID).Delete(&models.Clip{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete clip"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Clip deleted successfully"})
}

func (h *ClipHandler) ToggleFavorite(c *gin.Context) {
	userID, _ := c.Get("userId")
	clipID := c.Param("id")

	var clip models.Clip
	if err := h.db.Where("id = ? AND user_id = ?", clipID, userID).First(&clip).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Clip not found"})
		return
	}

	clip.IsFavorite = !clip.IsFavorite
	clip.UpdatedAt = time.Now()

	if err := h.db.Save(&clip).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update clip"})
		return
	}

	c.JSON(http.StatusOK, clip)
}

func (h *ClipHandler) TogglePin(c *gin.Context) {
	userID, _ := c.Get("userId")
	userIDStr := userID.(string)
	clipID := c.Param("id")

	var clip models.Clip
	if err := h.db.Where("id = ? AND user_id = ?", clipID, userIDStr).First(&clip).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Clip not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find clip"})
		return
	}

	clip.IsPinned = !clip.IsPinned
	clip.UpdatedAt = time.Now()

	if err := h.db.Save(&clip).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update pin"})
		return
	}

	c.JSON(http.StatusOK, clip)
}

func (h *ClipHandler) SyncClips(c *gin.Context) {
	userID, _ := c.Get("userId")
	userIDStr := userID.(string)

	var req struct {
		Clips    []CreateClipRequest `json:"clips" binding:"required"`
		DeviceID string              `json:"deviceId" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var synced int
	for _, clipReq := range req.Clips {
		preview := clipReq.Content
		if len(preview) > 200 {
			preview = preview[:200]
		}

		clip := models.Clip{
			ID:            uuid.New(),
			UserID:        userIDStr,
			Content:       clipReq.Content,
			ContentPreview: preview,
			CopiedAt:      time.Now(),
			IsFavorite:    false,
			Tags:          clipReq.Tags,
			DeviceName:    &clipReq.DeviceName,
			Synced:        true,
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}

		if err := h.db.Create(&clip).Error; err == nil {
			synced++
		}
	}

	// Update sync session
	var syncSession models.SyncSession
	h.db.Where("user_id = ? AND device_id = ?", userIDStr, req.DeviceID).FirstOrCreate(&syncSession, models.SyncSession{
		UserID:   userIDStr,
		DeviceID: req.DeviceID,
		LastSync: time.Now(),
	})
	syncSession.LastSync = time.Now()
	h.db.Save(&syncSession)

	c.JSON(http.StatusOK, gin.H{
		"synced":   synced,
		"conflicts": []models.Clip{},
	})
}

func parseInt(s string) int {
	var result int
	for _, char := range s {
		if char >= '0' && char <= '9' {
			result = result*10 + int(char-'0')
		} else {
			return 1
		}
	}
	if result == 0 {
		return 1
	}
	return result
}
