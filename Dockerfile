# syntax = docker/dockerfile:1.4

########################
#  Builder Stage       #
########################
FROM node:20-slim AS builder
WORKDIR /app

# Build arguments for cache-busting and network timeout
ARG BUILD_VERSION
ENV VITE_BUILD_VERSION=${BUILD_VERSION}
ARG VITE_NETWORK_TIMEOUT=60000
ENV VITE_NETWORK_TIMEOUT=${VITE_NETWORK_TIMEOUT}

# Install all dependencies (including devDependencies) to ensure build plugins are present
COPY package.json package-lock.json ./
RUN npm config set fetch-timeout ${VITE_NETWORK_TIMEOUT} \
    && npm install

# Copy application source and build
COPY . ./
RUN npm run build

########################
#  Production Stage    #
########################
FROM nginx:stable-alpine

# Copy built assets into nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Use custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Healthcheck for container
HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget -q -O /dev/null http://localhost/ || exit 1
