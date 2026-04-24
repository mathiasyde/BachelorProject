#!/bin/sh

adb connect "${ADB_HOST}:${ADB_PORT}"

if [ "${ADB_ROOT:-false}" = "true" ]; then
  adb root
fi

adb shell "${FRIDA_SERVER} &"
