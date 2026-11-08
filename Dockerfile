ARG NGINX_IMAGE=docker.1panel.live/library/nginx:stable-alpine
FROM ${NGINX_IMAGE}
COPY deploy/site.conf /etc/nginx/conf.d/default.conf
COPY index.html styles.css game.js /usr/share/nginx/html/
COPY assets /usr/share/nginx/html/assets
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
