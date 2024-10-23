.PHONY: help deps build

help:
	@echo "make help"
	@echo "  Display this message"
	@echo
	@echo "make deps"
	@echo "  Download dependencies and build frontend compiler container"
	@echo
	@echo "make build"
	@echo "  Compile the front-end and start the backend on localhost"


deps:
	./tools/vite-runner/build.sh
	docker run --rm --user $(shell id -u):$(shell id -g) -w /app/frontend -v $(CURDIR):/app vite-runner yarn


build:
	@if [ ! -f .env ]; then \
		echo "No .env found in $$PWD; copy example.env to .env and edit it"; \
		exit 1; \
	fi
	@. ./.env; sudo mkdir -p $$WEB_ROOT/files/ $$WEB_ROOT/thumbnails/
	docker run --rm --user $(shell id -u):$(shell id -g) -w /app/frontend -v $(CURDIR):/app vite-runner yarn run vite build
	@. ./.env; sudo rm -rf $$WEB_ROOT/assets
	@. ./.env; sudo cp -r frontend/dist/* $$WEB_ROOT/
	@rm -rf frontend/dist
	docker compose down
	docker compose build
	docker compose up -d
	@. ./.env; echo "[!] API running on: http://127.0.0.1:$$HTTP_PORT"
