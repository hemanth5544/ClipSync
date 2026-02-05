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

	// Allow all origins (for dev / flexible clients; tighten in production if needed)
	router.Use(cors.New(cors.Config{
		AllowOriginFunc: func(origin string) bool {
			return true
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "Accept", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           12 * 3600, // 12 hours
	}))

	authHandler := handlers.NewAuthHandler(db)
	clipHandler := handlers.NewClipHandler(db)
	syncHandler := handlers.NewSyncHandler(db)
	pairingHandler := handlers.NewPairingHandler(db)
	secureHandler := handlers.NewSecureHandler(db)
	messagesHandler := handlers.NewMessagesHandler(db)

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
			clips.DELETE("/all", clipHandler.DeleteAll)
			clips.GET("/:id", clipHandler.GetClip)
			clips.DELETE("/:id", clipHandler.DeleteClip)
			clips.PUT("/:id/favorite", clipHandler.ToggleFavorite)
			clips.PUT("/:id/pin", clipHandler.TogglePin)
			clips.POST("/sync", clipHandler.SyncClips)
		}

		sync := api.Group("/sync")
		sync.Use(middleware.AuthMiddleware())
		{
			sync.GET("/status", syncHandler.GetStatus)
			sync.POST("/pull", syncHandler.Pull)
			sync.POST("/push", syncHandler.Push)
		}

		secure := api.Group("/secure")
		secure.Use(middleware.AuthMiddleware())
		{
			secure.GET("/vault", secureHandler.GetVaultStatus)
			secure.POST("/vault", secureHandler.CreateVault)
			secure.GET("/clips", secureHandler.GetSecureClips)
			secure.POST("/clips", secureHandler.CreateSecureClip)
			secure.PUT("/clips/:id", secureHandler.UpdateSecureClip)
			secure.DELETE("/clips/:id", secureHandler.DeleteSecureClip)
		}

		messages := api.Group("/messages")
		messages.Use(middleware.AuthMiddleware())
		{
			messages.GET("", messagesHandler.List)
			messages.GET("/new-since", messagesHandler.NewSince)
			messages.POST("/push", messagesHandler.Push)
			messages.POST("/clear", messagesHandler.ClearAll)
			messages.DELETE("/:id", messagesHandler.Delete)
		}
	}

	return router
}
