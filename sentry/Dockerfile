FROM python:3.14-slim

WORKDIR /sentry

COPY hooks/ /sentry/hooks/
COPY run.sh /sentry/run.sh

RUN apt-get update && apt-get install -y --no-install-recommends adb
RUN pip install --no-cache-dir frida-tools

CMD ["sh", "/sentry/run.sh"]
