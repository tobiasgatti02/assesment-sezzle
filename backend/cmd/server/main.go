package main

import (
	"errors"
	"log/slog"
	"net/http"
	"os"
	"time"

	"sezzle-calculator/backend/internal/calculator"
	"sezzle-calculator/backend/internal/httpapi"
)

func main() {
	address := os.Getenv("ADDRESS")
	if address == "" {
		address = ":8080"
	}

	server := &http.Server{
		Addr:              address,
		Handler:           httpapi.NewHandler(calculator.NewService()).Routes(),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	slog.Info("calculator API listening", "address", address)
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		slog.Error("calculator API stopped", "error", err)
		os.Exit(1)
	}
}
