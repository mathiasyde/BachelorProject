# Sentry
> Security Analysis of Hybrid Android apps

This project aims to evaluate the security implications of hybrid Android apps using dynamic analysis with [Frida](https://frida.re/). The Sentry defines FRIDA hooks that intercept into the app's WebView-related components, also intercepting into JavaScript of the WebView contents.

# Quick Start

This project is only supported on Linux distributions, and so far only tested on Fedora 43. You need to have Docker and Docker Compose installed on your system, along with `aapt` from the Android SDK if you don't provide the APK package name.

```bash
chmod +x ./analyse.sh
./analyse.sh <APK-FILE> [<APK-PACKAGE>]
```

This outputs a log file in the `/logs` directory which can be used to produce a human-readable report.

# WebView Demonstration

This project contains a demonstration web-application in the `/web` folder and an Android app in the `/android` folder. A Docker Compose configuration is provided to run the neccessary components locally, this will build the Android app into an APK, run the web server, start the emulator, push the APK to the emulator, push `frida-server` to the emulator and run it.

Enjoy a cup of nice tea or coffee on initial launch.

```bash
docker compose up
```

The default port for the emulator VNC is `6080`. Visit `localhost:6080` in your browser to view the emulator.

# Setup for Local Development

This project is developed on **Fedora 43** with **x86_64** architecture, so any other configuration is not guaranteed to work.

You'll need the following dependencies installed on your system and be available on your PATH: `git`, `curl`, `unxz`, `python`, `pip`, `adb`, `sdkmanager`, `avdmanager`, `emulator`, `java` (JDK) and `npm`.

## Clone repository

```bash
git clone https://github.com/mathiasyde/bachelorproject
cd bachelorproject
```

Each step from now on assumes your current working directory is in the repository root.

## Build Android APK

```bash
cd android
./gradlew assembleDebug
./gradlew copyApkToTarget
```

This produces an APK file located at `android/target/app.apk`.

## Install Android emulator

Use either Android Studio or use the following bash

```bash
sdkmanager "system-images;android-36;google_apis;x86_64"
avdmanager create avd \
  -n android \
  -k "system-images;android-36;google_apis;x86_64" \
  -d "pixel_6"
```

You can use whatever name or device, but keep the API version recent.

## Install FRIDA on emulator

Firstly install FRIDA tools locally

```bash
pip install frida-tools
```

Then install FRIDA server, this downloads from g

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

Install the APK file from the prior step

```bash
adb install -r android/target/app.apk
```

## Start app on emulator with FRIDA

```bash
frida -U -f com.example.bachelorproject -l sentry/hooks.js
```

You should see output from the FRIDA hooks about WebView activity.
