package config

import (
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                string
	DatabaseURL         string
	JWTSecret           string
	AllowedOrigins      []string
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

	// Parse allowed origins from environment variable (comma-separated)
	// Default includes localhost and common development URLs
	originsEnv := getEnv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001,http://192.168.1.7:3000,http://locahost:8081")
	origins := []string{}
	for _, origin := range splitString(originsEnv, ",") {
		if trimmed := strings.TrimSpace(origin); trimmed != "" {
			origins = append(origins, trimmed)
		}
	}

	cfg = &Config{
		Port:                getEnv("PORT", getEnv("BACKEND_PORT", "8080")), // Railway uses PORT, fallback to BACKEND_PORT
		DatabaseURL:         getEnv("DATABASE_URL", "postgres://postgres:Datopic123@localhost:5432/clipsync?sslmode=disable"),
		JWTSecret:           getEnv("JWT_SECRET", "change-me-in-production"),
		AllowedOrigins:      origins,
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

func splitString(s, sep string) []string {
	if s == "" {
		return []string{}
	}
	return strings.Split(s, sep)
}
