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

APK_PACKAGE="$2"

# extract package name from apk if not provided
if [ "$APK_PACKAGE" = "" ]; then
  APK_PACKAGE=$(aapt dump badging "$APK_INPUT" | grep package | cut -d' ' -f2 | cut -d"'" -f2)
fi

if [ "$APK_PACKAGE" = "" ]; then
  echo "Failed to extract package name from apk"
  exit 1
fi

# detect /dev/kvm
if [ ! -c /dev/kvm ]; then
    echo "Warning: /dev/kvm not found, virtualization may not work properly"
fi

mkdir -p ./target
mkdir -p ./logs
cp "$APK_INPUT" ./target/app.apk

# -e APP_PACKAGE="$APK_PACKAGE"
docker compose up -d --force-recreate emulator run-frida-server sentry
docker compose logs -f sentry
