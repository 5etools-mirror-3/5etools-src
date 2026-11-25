ARG IMAGE_ID_IMG=ghcr.io/5etools-mirror-3/5etools-img
ARG IMAGE_VERSION=latest

FROM ${IMAGE_ID_IMG}:${IMAGE_VERSION}

COPY . /var/www/localhost/htdocs/
