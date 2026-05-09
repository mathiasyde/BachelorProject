#!/bin/sh

echo "Sentry - version alpha"
echo ""

function check_missing_commands() {
  missing=0

  for cmd in "$@"; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
      echo "Error: $cmd is not installed"
      missing=$((missing + 1))
    fi
  done

  if [ "$missing" -gt 0 ]; then
    exit 1
  fi
}

check_missing_commands aapt docker

# make sure the apk is provided
APK_INPUT="$1"
if [ "$APK_INPUT" = "" ]; then
    echo "Usage: $0 <apk>"
    exit 1
fi

if [ ! -f "$APK_INPUT" ]; then
    echo "File not found: $APK_INPUT"
    exit 1
fi

APP_PACKAGE="$2"

# extract package name from apk if not provided
if [ "$APP_PACKAGE" = "" ]; then
  APP_PACKAGE=$(aapt dump badging "$APK_INPUT" | grep package | cut -d' ' -f2 | cut -d"'" -f2)
fi

if [ "$APP_PACKAGE" = "" ]; then
  echo "Failed to extract package name from apk"
  exit 1
fi

# detect /dev/kvm
if [ ! -c /dev/kvm ]; then
    echo "Warning: /dev/kvm not found, virtualization may not work properly"
fi

# detect docker compose file
if [ ! -f docker-compose.yml ]; then
    echo "Error: docker-compose.yml not found"
    exit 1
fi

mkdir -p ./target
mkdir -p ./logs
cp "$APK_INPUT" ./target/app.apk
touch ./target/output.log
echo "APP_PACKAGE=$APP_PACKAGE" > ./target/.env


# docker compose up -d emulator
docker compose down
docker compose up -d emulator run-frida-server sentry

# docker compose logs -f sentry
docker compose logs sentry > ./target/output.log
