package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SyncedMessage stores SMS/messages synced from the user's phone (Android only).
type SyncedMessage struct {
	ID         uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID     string    `gorm:"type:varchar(255);not null;index" json:"userId"`
	Body       string    `gorm:"type:text;not null" json:"body"`
	Sender     string    `gorm:"type:varchar(255)" json:"sender"`      // phone number or name
	Address    string    `gorm:"type:varchar(255);index" json:"address"` // canonical address (e.g. phone)
	ReceivedAt time.Time `gorm:"not null;index" json:"receivedAt"`     // when message was received on device
	DeviceID   string    `gorm:"type:varchar(255)" json:"deviceId"`
	CreatedAt  time.Time `json:"createdAt"`
}

func (SyncedMessage) TableName() string {
	return "synced_messages"
}

func (m *SyncedMessage) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}
