#!/bin/sh
set -eu

sleep 20 # FIXME: race condition fix
echo "Connecting to ADB (${ADB_HOST}:${ADB_PORT})"
adb connect "${ADB_HOST}:${ADB_PORT}"

echo "Waiting for boot completion..."
until [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do
  sleep 2
done

if [ "${ADB_ROOT:-false}" = "true" ]; then
  adb root
fi

# echo "Waiting for package service..."
# until adb shell cmd package help >/dev/null 2>&1; do
#   sleep 2
# done

# install apk to emulator
echo "Installing APK..."
adb install -r "$TARGET_APK"

# push frida-server to emulator
echo "Pushing frida-server..."
adb push frida-server "$FRIDA_SERVER"
adb shell "chmod 755 ${FRIDA_SERVER}"

# start frida-server
echo "Starting frida-server..."
adb shell "${FRIDA_SERVER} &"
