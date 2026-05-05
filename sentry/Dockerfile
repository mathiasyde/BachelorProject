FROM python:3.14-slim

ENV APP_PACKAGE="com.example.bachelorproject"

WORKDIR /sentry

COPY hooks/ /sentry/hooks/
COPY run.sh /sentry/run.sh

RUN apt-get update && apt-get install -y --no-install-recommends adb
RUN pip install --no-cache-dir frida-tools
# CMD ["frida", "-H", "emulator:5555", "-f", "${APP_PACKAGE}", "-l", "/sentry/hooks.js"]
# CMD frida -H "emulator:5555" -f "$APP_PACKAGE" -l /sentry/hooks.js
# CMD frida -U -f "$APP_PACKAGE" -l /sentry/hooks.js

CMD ["sh", "/sentry/run.sh"]
