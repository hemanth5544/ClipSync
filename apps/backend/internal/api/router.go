package api

import (
	"clipsync/backend/internal/api/handlers"
	"clipsync/backend/internal/api/middleware"
	"gorm.io/gorm"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func InitializeRouter(db *gorm.DB) *gin.Engine {
	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:3001", "http://192.168.1.7:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	authHandler := handlers.NewAuthHandler(db)
	clipHandler := handlers.NewClipHandler(db)
	syncHandler := handlers.NewSyncHandler(db)
	pairingHandler := handlers.NewPairingHandler(db)

	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API routes
	api := router.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/signup", authHandler.Signup)
			auth.POST("/login", authHandler.Login)
			auth.POST("/logout", middleware.AuthMiddleware(), authHandler.Logout)
			auth.GET("/me", middleware.AuthMiddleware(), authHandler.Me)
		}

		pairing := api.Group("/pairing")
		{
			pairing.GET("/code", middleware.AuthMiddleware(), pairingHandler.GeneratePairingCode)
			pairing.POST("/verify", pairingHandler.VerifyPairingCode)
		}

		clips := api.Group("/clips")
		clips.Use(middleware.AuthMiddleware())
		{
			clips.GET("", clipHandler.GetClips)
			clips.POST("", clipHandler.CreateClip)
			clips.GET("/:id", clipHandler.GetClip)
			clips.DELETE("/:id", clipHandler.DeleteClip)
			clips.PUT("/:id/favorite", clipHandler.ToggleFavorite)
			clips.POST("/sync", clipHandler.SyncClips)
		}

		sync := api.Group("/sync")
		sync.Use(middleware.AuthMiddleware())
		{
			sync.GET("/status", syncHandler.GetStatus)
			sync.POST("/pull", syncHandler.Pull)
			sync.POST("/push", syncHandler.Push)
		}
	}

	return router
}
