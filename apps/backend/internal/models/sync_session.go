package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SyncSession struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID    string    `gorm:"type:varchar(255);not null;index" json:"userId"` // Better-Auth user ID (string)
	DeviceID  string    `gorm:"not null" json:"deviceId"`
	LastSync  time.Time `gorm:"not null" json:"lastSync"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

func (SyncSession) TableName() string {
	return "sync_sessions"
}

func (s *SyncSession) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}
