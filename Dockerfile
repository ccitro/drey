FROM node:18-alpine
RUN mkdir /app
WORKDIR /app

# install node_modules before the app is added, to allow caching of this layer
COPY package.json /app/
COPY yarn.lock /app/
RUN NODE_ENV=production yarn install --production=false --frozen-lockfile && \
    rm -rf /usr/local/share/.cache /root/.cache

ADD . /app

# run the build and remove some extra files
RUN yarn run postinstall && \
    yarn run build && \
    node esbuild.mjs && \
    rm -rf src .next/cache /usr/local/share/.cache /root/.cache

CMD [ "yarn", "run", "start" ]
