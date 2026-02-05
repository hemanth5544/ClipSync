package handlers

import (
	"net/http"
	"time"

	"clipsync/backend/internal/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type MessagesHandler struct {
	db *gorm.DB
}

func NewMessagesHandler(db *gorm.DB) *MessagesHandler {
	return &MessagesHandler{db: db}
}

// SyncMessageItem is a single message from the mobile app.
type SyncMessageItem struct {
	Body       string    `json:"body" binding:"required"`
	Sender     string    `json:"sender"`
	Address    string    `json:"address"`
	ReceivedAt time.Time `json:"receivedAt"`
}

// PushMessagesRequest is the request body for syncing messages from mobile.
type PushMessagesRequest struct {
	Messages []SyncMessageItem `json:"messages" binding:"required"`
	DeviceID string            `json:"deviceId" binding:"required"`
}

const maxMessagesPageSize = 100

// List returns paginated synced messages for the user. Capped at last 100 messages.
func (h *MessagesHandler) List(c *gin.Context) {
	userID, _ := c.Get("userId")
	userIDStr := userID.(string)

	page := c.DefaultQuery("page", "1")
	pageSize := c.DefaultQuery("pageSize", "50")
	since := c.Query("since") // ISO timestamp for "new since" (desktop polling)

	limit := parseInt(pageSize)
	if limit <= 0 {
		limit = 50
	}
	if limit > maxMessagesPageSize {
		limit = maxMessagesPageSize
	}

	query := h.db.Where("user_id = ?", userIDStr)

	if since != "" {
		if t, err := time.Parse(time.RFC3339, since); err == nil {
			query = query.Where("created_at > ?", t)
		}
	}

	query = query.Order("received_at DESC, created_at DESC")

	var messages []models.SyncedMessage
	var total int64
	query.Model(&models.SyncedMessage{}).Count(&total)

	offset := (parseInt(page) - 1) * limit
	if err := query.Offset(offset).Limit(limit).Find(&messages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch messages"})
		return
	}

	totalPages := (int(total) + limit - 1) / limit

	c.JSON(http.StatusOK, gin.H{
		"data":       messages,
		"total":      total,
		"page":       parseInt(page),
		"pageSize":   limit,
		"totalPages": totalPages,
	})
}

// Delete removes a synced message for the user.
func (h *MessagesHandler) Delete(c *gin.Context) {
	userID, _ := c.Get("userId")
	userIDStr := userID.(string)
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "message id required"})
		return
	}

	var msg models.SyncedMessage
	if err := h.db.Where("id = ? AND user_id = ?", id, userIDStr).First(&msg).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Message not found"})
		return
	}
	if err := h.db.Delete(&msg).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete message"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}

// NewSince returns messages created after the given timestamp (for desktop push notification polling).
func (h *MessagesHandler) NewSince(c *gin.Context) {
	userID, _ := c.Get("userId")
	userIDStr := userID.(string)
	since := c.Query("since")
	if since == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "since query param required (RFC3339)"})
		return
	}
	t, err := time.Parse(time.RFC3339, since)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid since format"})
		return
	}

	var messages []models.SyncedMessage
	if err := h.db.Where("user_id = ? AND created_at > ?", userIDStr, t).
		Order("created_at ASC").Find(&messages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch messages"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"messages": messages})
}

// Push creates synced messages from the mobile app (bulk).
func (h *MessagesHandler) Push(c *gin.Context) {
	userID, _ := c.Get("userId")
	userIDStr := userID.(string)

	var req PushMessagesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var created []models.SyncedMessage
	for _, m := range req.Messages {
		msg := models.SyncedMessage{
			UserID:     userIDStr,
			Body:       m.Body,
			Sender:     m.Sender,
			Address:    m.Address,
			ReceivedAt: m.ReceivedAt,
			DeviceID:   req.DeviceID,
			CreatedAt:  time.Now(),
		}
		if err := h.db.Create(&msg).Error; err == nil {
			created = append(created, msg)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"synced":  len(created),
		"message": "Messages synced successfully",
	})
}

func (h *MessagesHandler) ClearAll(c *gin.Context) {
	userID, _ := c.Get("userId")
	userIDStr := userID.(string)

	result := h.db.Where("user_id = ?", userIDStr).Delete(&models.SyncedMessage{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear messages"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "All messages cleared", "deleted": result.RowsAffected})
}
