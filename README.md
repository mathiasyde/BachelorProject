# Sentry
> Security Analysis of Hybrid Android apps

# Run custom APKs

Run the following bash section if you don't have already

```bash
pip install frida-tools 

emulator @android

# install frida server on emulator
curl -L -o frida-server.xz https://github.com/frida/frida/releases/download/17.9.1/frida-server-17.9.1-android-x86_64.xz
unxz frida-server.xz
adb root
adb push frida-server /data/local/tmp/
adb shell "chmod 755 /data/local/tmp/frida-server"
```

To install the APK file and run it with FRIDA, use the following:

```bash
adb install -r <MY-APK-FILE>
frida -U -f <MY-APK-PACKAGE> -l sentry/hooks.js
```

After that, just use the `frida` command to run the app again.

# Setup with Docker Compose (WIP)

```bash
docker compose up
```

This will most likely take a long time for initial launch. Personally, after initial launch it takes 5-6 minutes to start completely.

The `android` container will take a while without terminal output, but it is running.

# Setup for Local Development

The following setion assumes that you already have `git`, `curl`, `unxz`, `python`, `pip`, `adb`, `sdkmanager`, `avdmanager`, `emulator`, `java` (JDK) and `npm` installed and on your PATH.
This project is developed on **Fedora 43** with **x86_64** architecture, so any other configuration is not guaranteed to work.

Each step after the first one assumes your current working directory is in the repository root.

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
