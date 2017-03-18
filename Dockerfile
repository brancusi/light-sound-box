FROM resin/raspberry-pi2-node:7.6.0


ENV APP_BASE /usr/src/app
RUN mkdir -p $APP_BASE
WORKDIR $APP_BASE

COPY package.json $APP_BASE/

RUN DEBIAN_FRONTEND=noninteractive JOBS=MAX npm install --unsafe-perm

COPY . $APP_BASE

CMD [ "node", "$APP_BASE/index.js" ]
