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

	//TODO: Improve env file loading logic --- IGNORE ---
	envPaths := []string{
		".env",
		"../.env",
		"../../.env",
	}
	
	for _, path := range envPaths {
		if err := godotenv.Load(path); err == nil {
			break
		}
	}

	cfg = &Config{
		Port:                getEnv("BACKEND_PORT", "8080"),
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
