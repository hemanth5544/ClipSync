package db

import (
	"fmt"
	"log"

	"clipsync/backend/internal/config"
	"clipsync/backend/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Initialize() (*gorm.DB, error) {
	cfg := config.Get()
	fmt.Println("Connecting to database:", cfg.DatabaseURL)

	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, err
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}
	if err := sqlDB.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}
	fmt.Println("Database connection successful!")

	DB = db
	return db, nil
}

func RunMigrations(db *gorm.DB) error {
	log.Println("Running database migrations...")
	log.Println("Migrating Clip table...")
	if err := db.AutoMigrate(&models.Clip{}); err != nil {
		log.Printf("Error migrating Clip: %v", err)
		return err
	}
	log.Println("Clip table migrated successfully")
	
	log.Println("Migrating SyncSession table...")
	if err := db.AutoMigrate(&models.SyncSession{}); err != nil {
		log.Printf("Error migrating SyncSession: %v", err)
		return err
	}
	log.Println("SyncSession table migrated successfully")
	
	log.Println("Migrating PairingCode table...")
	if err := db.AutoMigrate(&models.PairingCode{}); err != nil {
		log.Printf("Error migrating PairingCode: %v", err)
		return err
	}
	log.Println("PairingCode table migrated successfully")
	
	log.Println("All migrations completed successfully!")
	return nil
}
