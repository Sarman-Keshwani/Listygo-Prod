# Dockerfile

# Build stage
FROM node:20.11.1-slim AS build
WORKDIR /app

# Accept build arguments for NODE_OPTIONS
ARG NODE_OPTIONS
ENV NODE_OPTIONS=${NODE_OPTIONS}

# Add network timeout argument
ARG VITE_NETWORK_TIMEOUT=60000
ENV VITE_NETWORK_TIMEOUT=${VITE_NETWORK_TIMEOUT}

# Install dependencies with higher network timeout
COPY package*.json ./
RUN npm config set fetch-timeout ${VITE_NETWORK_TIMEOUT} && \
    npm ci --prefer-offline

# Copy source files
COPY . .

# Set production mode and disable source maps for smaller build
ENV NODE_ENV=production

# Install terser for minification
RUN npm install --no-save terser

# Split the build command for better layer caching
RUN npm run build || (echo "Build failed, retrying with additional diagnostics" && \
    export NODE_OPTIONS="$NODE_OPTIONS --trace-gc" && \
    npm run build)

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://localhost:80/ || exit 1
