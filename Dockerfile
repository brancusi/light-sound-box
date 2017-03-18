# Getting from this base so we can override some of the build steps
FROM resin/raspberrypi2-node:onbuild

# Setup base app dir
ENV APP_BASE /usr/src/app
RUN mkdir -p $APP_BASE
WORKDIR $APP_BASE

# Run npm install here to cache this later for future builds
COPY package.json $APP_BASE/

# Copy over app source
COPY . $APP_BASE

# Start up the app
CMD [ "node", "$APP_BASE/index.js" ]
