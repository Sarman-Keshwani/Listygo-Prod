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

# Ensure devDependencies are installed for build (unset NODE_ENV)
ENV NODE_ENV=

# Install dependencies (both dependencies and devDependencies)
COPY package.json package-lock.json ./
RUN npm config set fetch-timeout $VITE_NETWORK_TIMEOUT \
    && npm ci --prefer-offline

# Copy source code and build
COPY . ./
RUN npm run build

########################
#  Production Stage    #
########################
FROM nginx:stable-alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Healthcheck for container
HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget -q -O /dev/null http://localhost/ || exit 1
