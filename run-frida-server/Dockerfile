FROM alpine:latest

ENV ADB_HOST=emulator
ENV ADB_PORT=5555
ENV FRIDA_SERVER=/data/local/tmp/frida-server
ENV FRIDA_URL=https://github.com/frida/frida/releases/download/17.9.1/frida-server-17.9.1-android-x86_64.xz
ENV TARGET_APK=/target/app.apk
ENV ADB_ROOT="true"

COPY run.sh /run.sh

RUN apk add --no-cache android-tools curl xz
RUN curl -sSL $FRIDA_URL | xz -d > frida-server

CMD ["sh", "run.sh"]
