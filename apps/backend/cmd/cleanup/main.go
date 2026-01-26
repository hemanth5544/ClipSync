package main

import (
	"log"

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

	log.Println("Dropping old tables...")
	
	if err := database.Exec("DROP TABLE IF EXISTS clips CASCADE").Error; err != nil {
		log.Printf("Error dropping clips: %v", err)
	} else {
		log.Println("Dropped clips table")
	}
	
	if err := database.Exec("DROP TABLE IF EXISTS sync_sessions CASCADE").Error; err != nil {
		log.Printf("Error dropping sync_sessions: %v", err)
	} else {
		log.Println("Dropped sync_sessions table")
	}
	
	if err := database.Exec("DROP TABLE IF EXISTS users CASCADE").Error; err != nil {
		log.Printf("Error dropping users: %v", err)
	} else {
		log.Println("Dropped users table (Better-Auth manages user table)")
	}

	log.Println("Cleanup completed! Now run migrations again.")
}
