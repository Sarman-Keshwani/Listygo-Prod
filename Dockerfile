#--------------------------------------
# Final image: just serve your built SPA
#--------------------------------------
FROM nginx:alpine

# Copy your already-built static site
COPY dist /usr/share/nginx/html

# Your SPA routing + proxy config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Optional healthcheck
HEALTHCHECK --interval=30s --timeout=5s \
    CMD wget --spider http://localhost/ || exit 1
