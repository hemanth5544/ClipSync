package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SecureClip stores encrypted password/secret data. Decryption happens client-side only.
type SecureClip struct {
	ID               uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID           string    `gorm:"type:varchar(255);not null;index" json:"userId"`
	EncryptedPayload string    `gorm:"type:text;not null" json:"encryptedPayload"` // Base64 AES-GCM ciphertext
	Nonce            string    `gorm:"type:varchar(32);not null" json:"nonce"`     // Base64 96-bit nonce
	CreatedAt        time.Time `json:"createdAt"`
	UpdatedAt        time.Time `json:"updatedAt"`
}

func (SecureClip) TableName() string {
	return "secure_clips"
}

func (s *SecureClip) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}
