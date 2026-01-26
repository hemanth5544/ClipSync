package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                string
	DatabaseURL         string
	JWTSecret           string
}

var cfg *Config

func Load() error {
	// Load .env from project root (../../.env from apps/backend/)
	// This ensures all apps use the same root .env file
	envPaths := []string{
		"../../.env", // Root .env (preferred)
		"../.env",    // Fallback
		".env",       // Last resort (for backward compatibility)
	}
	
	for _, path := range envPaths {
		if err := godotenv.Load(path); err == nil {
			break
		}
	}

	cfg = &Config{
		Port:                getEnv("PORT", getEnv("BACKEND_PORT", "8080")), // Railway uses PORT, fallback to BACKEND_PORT
		DatabaseURL:         getEnv("DATABASE_URL", "postgres://postgres:Datopic123@localhost:5432/clipsync?sslmode=disable"),
		JWTSecret:           getEnv("JWT_SECRET", "change-me-in-production"),
	}

	return nil
}

func Get() *Config {
	if cfg == nil {
		Load()
	}
	return cfg
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
