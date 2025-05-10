
# Build Stage
FROM node:18 AS build
WORKDIR /src
COPY package*.json ./
RUN npm install
COPY . .
# Add Node.js memory limit flags
RUN NODE_OPTIONS="--max-old-space-size=2048" npm run build
# Debug - list directories to see build output location
RUN ls -la && find . -type d -name "build" -o -name "dist" -o -name "public"

# Production Stage
FROM nginx:alpine
COPY --from=build /src/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
