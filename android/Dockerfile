FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV ANDROID_HOME=/opt/android-sdk
ENV PATH="${PATH}:${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin:${ANDROID_SDK_ROOT}/platform-tools"

RUN apt-get update && apt-get install -y --no-install-recommends \
  openjdk-17-jdk \
  wget \
  unzip \
  git \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN mkdir -p ${ANDROID_SDK_ROOT}/cmdline-tools /tmp/android \
  && wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O /tmp/android/cmdline-tools.zip \
  && unzip -q /tmp/android/cmdline-tools.zip -d /tmp/android \
  && mv /tmp/android/cmdline-tools ${ANDROID_SDK_ROOT}/cmdline-tools/latest \
  && rm -rf /tmp/android

RUN yes | sdkmanager --licenses > /dev/null \
  && sdkmanager --update \
  && sdkmanager \
    "platform-tools" \
    "platforms;android-34" \
    "build-tools;34.0.0"

WORKDIR /app

COPY . /app

RUN chmod +x ./gradlew || true

CMD ["./gradlew", "assembleDebug"]
