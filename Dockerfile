# Dockerfile
# (no Node stages any more — dist is already built by Jenkins)

FROM nginx:alpine

# 1) Copy your static build output
COPY dist /usr/share/nginx/html

# 2) Your custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
