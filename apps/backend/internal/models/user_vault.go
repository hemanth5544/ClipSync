package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// UserVault stores the salt for key derivation. The master password is never stored.
// Client derives encryption key from: PBKDF2(masterPassword, salt)
// Salt is stored as base64-encoded random bytes.
type UserVault struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID    string    `gorm:"type:varchar(255);not null;uniqueIndex" json:"userId"`
	Salt      string    `gorm:"type:varchar(88);not null" json:"salt"` // Base64-encoded salt for PBKDF2
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

func (UserVault) TableName() string {
	return "user_vaults"
}

func (v *UserVault) BeforeCreate(tx *gorm.DB) error {
	if v.ID == uuid.Nil {
		v.ID = uuid.New()
	}
	return nil
}
