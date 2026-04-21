# Sentry
> Security Analysis of Hybrid Android apps

# Setup for local development

The following setion assumes that you already have `git`, `curl`, `unxz`, `python`, `pip`, `adb`, `sdkmanager`, `avdmanager`, `emulator`, `java` (JDK) and `npm` installed and on your PATH.
This project is developed on **Fedora 43** with **x86_64** architecture, so any other configuration is not guaranteed to work.

## Clone repository

```bash
git clone https://github.com/mathiasyde/bachelorproject
cd bachelorproject
```

## Build Android APK

```bash
cd android
./gradlew assembleDebug
./gradlew copyApkToTarget
```

## Install Android emulator

Use either Android Studio or use the following bash

```bash
sdkmanager "system-images;android-36;google_apis;x86_64"
avdmanager create avd \
  -n android \
  -k "system-images;android-36;google_apis;x86_64" \
  -d "pixel_6"
```

## Install FRIDA on emulator

Firstly install FRIDA tools locally

```bash
pip install frida-tools
```

Then install FRIDA server

```bash
# the current version of FRIDA is 17.9.1
curl -L -o frida-server.xz https://github.com/frida/frida/releases/download/17.9.1/frida-server-17.9.1-android-x86_64.xz
unxz frida-server.xz
adb root
adb push frida-server /data/local/tmp/
adb shell "chmod 755 /data/local/tmp/frida-server"
```

## Start web server

Run this in another terminal.

```bash
cd web
npm install
npm run dev
```

## Run Frida

Run this in another terminal.

```bash
adb root
adb reverse tcp:5173 tcp:5173 # open for web server
adb shell "/data/local/tmp/frida-server &"
```

## Start emulator

Run this in another terminal.

```bash
emulator @android
```

## Install APK on emulator

```bash
adb install -r android/target/app.apk
```

## Start app on emulator with FRIDA

```bash
frida -U -f com.example.bachelorproject -l sentry/hooks.js
```

# Fedora fixes

sudo setsebool -P selinuxuser_execheap 1
