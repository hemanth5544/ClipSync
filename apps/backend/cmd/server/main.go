package main

import (
	"log"
	"os"

	"clipsync/backend/internal/api"
	"clipsync/backend/internal/config"
	"clipsync/backend/internal/db"
)

func main() {
	if err := config.Load(); err != nil {
		log.Fatal("Failed to load config:", err)
	}

	database, err := db.Initialize()
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}

	if len(os.Args) > 1 && os.Args[1] == "migrate" {
		if err := db.RunMigrations(database); err != nil {
			log.Fatal("Failed to run migrations:", err)
		}
		log.Println("Migrations completed successfully")
		return
	}

	router := api.InitializeRouter(database)

	// Start server
	port := config.Get().Port
	log.Printf("Server starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
