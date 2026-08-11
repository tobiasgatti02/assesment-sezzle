// Package webapp composes the API with an optional production frontend.
package webapp

import "net/http"

// New returns the API unchanged when staticDir is empty. When configured, it
// serves the frontend at / while preserving the API and health endpoints.
func New(api http.Handler, staticDir string) http.Handler {
	if staticDir == "" {
		return api
	}

	mux := http.NewServeMux()
	mux.Handle("/api/", api)
	mux.Handle("/health", api)
	mux.Handle("/", http.FileServer(http.Dir(staticDir)))
	return mux
}
