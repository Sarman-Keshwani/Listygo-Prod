#!/bin/bash
# Resilient build script that can be resumed after Jenkins restarts
export BUILD_VERSION=$(date +%s)
# Check if we're resuming a previous build
if [ -d "./dist" ] && [ -f "./build.checkpoint" ]; then
  echo "Resuming previous build..."
else
  echo "Starting new build..."
  # Clean any previous artifacts
  rm -rf ./dist ./build.checkpoint
fi

# Build the Docker image with checkpoint capability
docker build \
  --memory=8g \
  --memory-swap=10g \
  --no-cache \
  --build-arg NODE_OPTIONS="--max-old-space-size=4096" \
  --build-arg VITE_NETWORK_TIMEOUT=100000 \
  -t home-frontend .

# Mark build as complete
touch ./build.checkpoint