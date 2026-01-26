package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Clip struct {
	ID            uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID        string    `gorm:"type:varchar(255);not null;index" json:"userId"` // Better-Auth user ID (string)
	Content       string    `gorm:"type:text;not null" json:"content"`
	ContentPreview string   `gorm:"type:varchar(200)" json:"contentPreview"`
	CopiedAt      time.Time `gorm:"not null" json:"copiedAt"`
	IsFavorite    bool      `gorm:"default:false" json:"isFavorite"`
	IsPinned      bool      `gorm:"default:false;index" json:"isPinned"`
	Tags          []string  `gorm:"type:text[]" json:"tags"`
	DeviceName    *string   `json:"deviceName"`
	Synced        bool      `gorm:"default:false" json:"synced"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

func (Clip) TableName() string {
	return "clips"
}

func (c *Clip) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	if c.ContentPreview == "" && len(c.Content) > 200 {
		c.ContentPreview = c.Content[:200]
	} else if c.ContentPreview == "" {
		c.ContentPreview = c.Content
	}
	return nil
}
