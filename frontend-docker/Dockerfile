# Nginx-based frontend container

FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx/nginx.conf /etc/nginx/conf.d/

# Copy static files
COPY ../index.html /usr/share/nginx/html/
COPY ../gutscheine.html /usr/share/nginx/html/
COPY ../karte.html /usr/share/nginx/html/
COPY ../admin.html /usr/share/nginx/html/
COPY ../partner-qrcodes.html /usr/share/nginx/html/
COPY ../countdown.html /usr/share/nginx/html/
COPY ../code.html /usr/share/nginx/html/
COPY ../styles.css /usr/share/nginx/html/
COPY ../js /usr/share/nginx/html/js/
COPY ../data /usr/share/nginx/html/data/
COPY ../images /usr/share/nginx/html/images/
COPY ../api /usr/share/nginx/html/api/

# Create non-root user
RUN addgroup -g 101 -S nginx-custom && \
    adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx-custom -g nginx-custom nginx-custom

# Nginx config
RUN chown -R nginx-custom:nginx-custom /usr/share/nginx/html && \
    chown -R nginx-custom:nginx-custom /var/cache/nginx && \
    chown -R nginx-custom:nginx-custom /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx-custom:nginx-custom /var/run/nginx.pid

USER nginx-custom

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
