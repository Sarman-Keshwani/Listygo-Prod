#!/bin/bash
# filepath: /root/home/Listygo-Prod/build.sh
export BUILD_VERSION=$(date +%s)
echo "Building with version: $BUILD_VERSION"

# Clean any previous artifacts
rm -rf ./dist ./build.checkpoint

# Build the Docker image with proper memory settings
docker build \
  --memory=8g \
  --memory-swap=10g \
  --no-cache \
  --build-arg NODE_OPTIONS="--max-old-space-size=4096" \
  --build-arg BUILD_VERSION="$BUILD_VERSION" \
  --build-arg VITE_NETWORK_TIMEOUT=100000 \
  -t home-frontend .

# Mark build as complete
touch ./build.checkpoint