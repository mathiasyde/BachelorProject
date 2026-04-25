#!/bin/sh

# make sure the apk is provided
if [ "$1" = "" ]; then
    echo "Usage: $0 <apk>"
    exit 1
fi

APK_INPUT="$1"
if [ ! -f "$APK_INPUT" ]; then
    echo "File not found: $APK_INPUT"
    exit 1
fi

mkdir -p ./target
cp "$APK_INPUT" ./target/app.apk


docker compose up -d emulator
docker compose up -d install-frida-server run-frida-server sentry

docker compose logs -f sentry
