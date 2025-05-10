#--------------------------------------
# 1) Install dependencies (cached)
#--------------------------------------
FROM node:18 AS deps

WORKDIR /src

# Copy only package files to leverage cache
COPY package*.json ./

# Use npm ci for fast, clean installs
RUN npm ci

#--------------------------------------
# 2) Build your app
#--------------------------------------
FROM node:18 AS build

WORKDIR /src

# Copy cached node_modules from deps stage
COPY --from=deps /src/node_modules ./node_modules

# Copy the rest of your source
COPY . .

# Build with increased memory if needed
RUN NODE_OPTIONS="--max-old-space-size=2048" npm run build

# (Optional) inspect where the build output landed
RUN echo "Build output:" && ls -l ./dist

#--------------------------------------
# 3) Build final image for nginx
#--------------------------------------
FROM nginx:alpine

# 1) Serve your built files
COPY --from=build /src/dist /usr/share/nginx/html

# 2) Your custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 3) (If you use proxy_params, copy it here too)
# COPY proxy_params /etc/nginx/proxy_params

EXPOSE 80

# If you want a quick healthcheck (optional)
HEALTHCHECK --interval=30s --timeout=5s \
    CMD wget --spider http://localhost/ || exit 1
