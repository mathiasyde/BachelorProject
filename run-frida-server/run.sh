#!/bin/sh
set -eu

echo "Connecting to ADB (${ADB_HOST}:${ADB_PORT})"
adb connect "${ADB_HOST}:${ADB_PORT}"
# adb wait-for-device

if [ "${ADB_ROOT:-false}" = "true" ]; then
  adb root
fi

# install apk to emulator
adb install -r "$TARGET_APK"

# push frida-server to emulator
adb push frida-server "$FRIDA_SERVER"
adb shell "chmod 755 ${FRIDA_SERVER}"

# start frida-server
adb shell "${FRIDA_SERVER} &"
