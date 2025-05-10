#--------------------------------------
# Stage 1: Install dependencies (cached)
#--------------------------------------
FROM node:18 AS deps

WORKDIR /app

# Copy only package manifests to maximize cache reuse
COPY package*.json ./

# Use npm ci for fast, reproducible installs
RUN npm ci



#--------------------------------------
# Stage 2: Build your app
#--------------------------------------
FROM node:18 AS build

WORKDIR /app

# Pull in cached node_modules from deps
COPY --from=deps /app/node_modules ./node_modules

# Copy the rest of your source code
COPY . .

# Build with extra heap if needed
RUN NODE_OPTIONS="--max-old-space-size=2048" npm run build



#--------------------------------------
# Stage 3: Serve with nginx
#--------------------------------------
FROM nginx:alpine AS production

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Copy your custom nginx config (make sure nginx.conf is alongside this Dockerfile)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# (Optional) healthcheck if desired:
# HEALTHCHECK --interval=30s --timeout=5s CMD [ "wget", "--spider", "http://localhost/" ] || exit 1
