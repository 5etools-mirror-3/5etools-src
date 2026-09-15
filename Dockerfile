FROM 5etools-img:arm64

COPY . /var/www/localhost/htdocs/

RUN chmod -R a+rX /var/www/localhost/htdocs
