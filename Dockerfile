FROM resin/raspberrypi3-node:slim

ENV APP_BASE /usr/src/app
RUN mkdir -p $APP_BASE
WORKDIR $APP_BASE

# Install image tools
RUN apt-get update && apt-get install -y \
  build-essential \
  bluez bluez-tools \
  alsa-utils libasound2-dev mpg321 \
  libglib2.0-dev libboost-thread-dev libbluetooth-dev \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY package.json $APP_BASE/

RUN DEBIAN_FRONTEND=noninteractive JOBS=MAX npm install --unsafe-perm

COPY . $APP_BASE

CMD [ "node", "index.js" ]
