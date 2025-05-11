# Dockerfile

# Build stage
FROM node:20.11.1-slim AS build
WORKDIR /app

# Accept build arguments for NODE_OPTIONS
ARG NODE_OPTIONS
ENV NODE_OPTIONS=${NODE_OPTIONS}

# Add build version argument for cache busting
ARG BUILD_VERSION
ENV VITE_BUILD_VERSION=${BUILD_VERSION}

# Add network timeout argument
ARG VITE_NETWORK_TIMEOUT=60000
ENV VITE_NETWORK_TIMEOUT=${VITE_NETWORK_TIMEOUT}

# Install dependencies with higher network timeout
COPY package*.json ./
RUN npm config set fetch-timeout ${VITE_NETWORK_TIMEOUT} && \
    npm ci --prefer-offline

# Install missing dev dependencies explicitly
RUN npm install --no-save @vitejs/plugin-react tailwindcss postcss autoprefixer

# Copy source files
COPY . .

# Set production mode and disable source maps for smaller build
ENV NODE_ENV=production

# Install terser for minification
RUN npm install --no-save terser

# Build with proper error handling
RUN npm run build || (echo "Build failed with error $?" && exit 1)

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://localhost:80/ || exit 1
