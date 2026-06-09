#!/usr/bin/env bash

set -euo pipefail

APP_DIR="/opt/growth_os"
ENV_FILE="$APP_DIR/.env.production"
COMPOSE_FILE="$APP_DIR/deploy/growthos.compose.yml"
BRANCH="${1:-main}"

cd "$APP_DIR"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --build
