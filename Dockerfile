# syntax = docker/dockerfile:1.4

########################
#  Builder Stage       #
########################
FROM node:20-slim AS builder
WORKDIR /app

# 1) Allow a bigger V8 heap (4 GB)
ARG NODE_OPTIONS="--max-old-space-size=4096"
ENV NODE_OPTIONS=${NODE_OPTIONS}

# 2) Cache‐busting build version (optional)
ARG VITE_BUILD_VERSION
ENV VITE_BUILD_VERSION=${VITE_BUILD_VERSION}

# 3) Increase npm network timeout if you hit fetch issues
ARG VITE_NETWORK_TIMEOUT=60000
ENV VITE_NETWORK_TIMEOUT=${VITE_NETWORK_TIMEOUT}

# 4) Install all dependencies (including devDeps needed by Vite)
COPY package.json package-lock.json ./
RUN npm config set fetch-timeout $VITE_NETWORK_TIMEOUT \
    && npm ci --prefer-offline

# 5) Copy your source and run the Vite build
COPY . ./
RUN npm run build

########################
#  Production Stage    #
########################
FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html

# 6) Copy the static output
COPY --from=builder /app/dist ./

# 7) Custom nginx config (if you have one)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# 8) Simple healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget -q -O /dev/null http://localhost/ || exit 1
