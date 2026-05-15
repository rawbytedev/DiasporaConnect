#!/bin/bash
set -e

echo "==> Installing Node dependencies..."
pnpm install --frozen-lockfile

echo "==> Building frontend..."
pnpm --filter @workspace/diaspora-connect-site run build

echo "==> Building Go backend..."
cd backend
go build -buildvcs=false -o bin/api ./cmd/api/
cd ..

echo "==> Build complete."
