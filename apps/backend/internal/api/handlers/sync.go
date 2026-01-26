package handlers

import (
	"net/http"
	"time"

	"clipsync/backend/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SyncHandler struct {
	db *gorm.DB
}

func NewSyncHandler(db *gorm.DB) *SyncHandler {
	return &SyncHandler{db: db}
}

func (h *SyncHandler) GetStatus(c *gin.Context) {
	userID, _ := c.Get("userId")
	userIDStr := userID.(string)
	deviceID := c.Query("deviceId")

	var syncSession models.SyncSession
	if deviceID != "" {
		h.db.Where("user_id = ? AND device_id = ?", userIDStr, deviceID).First(&syncSession)
	}

	var totalClips int64
	h.db.Model(&models.Clip{}).Where("user_id = ?", userIDStr).Count(&totalClips)

	var unsyncedClips int64
	h.db.Model(&models.Clip{}).Where("user_id = ? AND synced = ?", userIDStr, false).Count(&unsyncedClips)

	c.JSON(http.StatusOK, gin.H{
		"lastSync":     syncSession.LastSync,
		"totalClips":   totalClips,
		"unsyncedClips": unsyncedClips,
		"deviceId":     deviceID,
	})
}

func (h *SyncHandler) Pull(c *gin.Context) {
	userID, _ := c.Get("userId")
	userIDStr := userID.(string)

	var req struct {
		DeviceID string    `json:"deviceId" binding:"required"`
		LastSync time.Time `json:"lastSync"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var clips []models.Clip
	query := h.db.Where("user_id = ?", userIDStr)
	
	if !req.LastSync.IsZero() {
		query = query.Where("created_at > ? OR updated_at > ?", req.LastSync, req.LastSync)
	}

	if err := query.Order("created_at DESC").Find(&clips).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch clips"})
		return
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
		"clips": clips,
		"lastSync": time.Now(),
	})
}

func (h *SyncHandler) Push(c *gin.Context) {
	userID, _ := c.Get("userId")
	userIDStr := userID.(string)

	var req struct {
		Clips    []struct {
			Content    string   `json:"content" binding:"required"`
			DeviceName string   `json:"deviceName"`
			Tags       []string `json:"tags"`
			CopiedAt   time.Time `json:"copiedAt"`
		} `json:"clips" binding:"required"`
		DeviceID string `json:"deviceId" binding:"required"`
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
			CopiedAt:      clipReq.CopiedAt,
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
		"synced": synced,
		"lastSync": time.Now(),
	})
}
