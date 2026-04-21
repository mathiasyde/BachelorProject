FROM python:3.14-slim

ENV APP_PACKAGE="com.example.bachelorproject"

WORKDIR /sentry

COPY hooks.js /sentry/hooks.js

RUN pip install --no-cache-dir frida-tools
CMD ["frida", "-H", "emulator:5555", "-f", "$APP_PACKAGE", "-l", "/sentry/hooks.js"]
