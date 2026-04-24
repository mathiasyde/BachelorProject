FROM alpine:latest

ENV ADB_HOST=emulator
ENV ADB_PORT=5555
ENV FRIDA_SERVER=/data/local/tmp/frida-server
ENV ADB_ROOT="true"

COPY run.sh /run.sh

RUN apk add --no-cache android-tools

CMD ["sh", "run.sh"]
