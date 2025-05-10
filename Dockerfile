# Dockerfile

# Build stage
FROM node:20.11.1-slim AS build
WORKDIR /app

# Accept build arguments for NODE_OPTIONS
ARG NODE_OPTIONS
ENV NODE_OPTIONS=${NODE_OPTIONS}

COPY package*.json ./
RUN npm ci
COPY . .

# Set production mode and disable source maps for smaller build
ENV NODE_ENV=production
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
