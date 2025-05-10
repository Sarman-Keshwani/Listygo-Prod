# Dockerfile
# (dist/ is built by Jenkins, not inside Docker)

FROM nginx:alpine

# 1) Copy the already-built static site
COPY dist /usr/share/nginx/html

# 2) Your SPA + proxy config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# optional healthcheck
# HEALTHCHECK --interval=30s --timeout=5s \
#   CMD wget --spider http://localhost/ || exit 1
