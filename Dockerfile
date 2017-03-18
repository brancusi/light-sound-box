FROM resin/raspberry-pi2-node:7.6.0


ENV APP_BASE /usr/src/app
RUN mkdir -p $APP_BASE
WORKDIR $APP_BASE

# Install image tools
RUN apt-get update && apt-get install -y \
  pulseaudio \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY package.json $APP_BASE/

RUN DEBIAN_FRONTEND=noninteractive JOBS=MAX npm install --unsafe-perm

COPY . $APP_BASE

CMD [ "node", "index.js" ]
