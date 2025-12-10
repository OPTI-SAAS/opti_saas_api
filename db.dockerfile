FROM postgres:16-alpine

COPY ./scripts/init.sh /docker-entrypoint-initdb.d/
RUN chmod +x /docker-entrypoint-initdb.d/init.sh