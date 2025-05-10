# Build Stage
FROM node:18 AS build
WORKDIR /src
COPY package*.json ./
RUN npm install
COPY . .
RUN NODE_OPTIONS="--max-old-space-size=2048" npm run build

# Production Stage
FROM nginx:alpine
COPY --from=build /src/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
