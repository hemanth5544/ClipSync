package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PairingCode struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Code      string    `gorm:"type:varchar(6);unique;not null;index" json:"code"`
	UserID    string    `gorm:"type:varchar(255);not null;index" json:"userId"`
	ExpiresAt time.Time `gorm:"not null;index" json:"expiresAt"`
	Used      bool      `gorm:"default:false;index" json:"used"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

func (PairingCode) TableName() string {
	return "pairing_codes"
}

func (p *PairingCode) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

func (p *PairingCode) IsExpired() bool {
	return time.Now().After(p.ExpiresAt)
}

func (p *PairingCode) IsValid() bool {
	return !p.Used && !p.IsExpired()
}
