# Use the official Nginx image
FROM debian:bullseye

WORKDIR /app

RUN apt-get update && apt-get install -y \
    nginx \
    openssl \
    inotify-tools \
    netcat-openbsd --no-install-recommends \
    && apt-get clean

ARG CN
ENV CN=${CN}

# Check if CN is set
RUN if [ -z "${CN}" ]; then echo "CN is empty! Please check the environment variable."; exit 1; fi

# Generate SSL certificate
RUN mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/inception.key \
    -out /etc/nginx/ssl/inception.crt \
    -subj "/CN=${CN}"



COPY ./conf/nginx.conf /etc/nginx/nginx.conf

COPY ./front_end /var/www/html
COPY ./front_game /var/www/html
EXPOSE 80 443 3000

CMD ["sh", "-c", "until nc -z -v -w30 web 8000; do echo 'Waiting for Gunicorn...'; sleep 2; done && nginx -g 'daemon off;'"]