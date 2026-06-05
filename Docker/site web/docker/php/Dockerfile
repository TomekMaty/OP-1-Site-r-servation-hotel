FROM php:8.2-fpm

# Extensions PDO + MySQL
RUN docker-php-ext-install pdo pdo_mysql

# Dossier de travail
WORKDIR /var/www

# Copier le backend
COPY ../../backend ./backend

EXPOSE 9000
CMD ["php-fpm"]
