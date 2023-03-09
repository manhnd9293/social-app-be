FROM node:lts-alpine3.17 AS deps
WORKDIR /usr/src/app

COPY package.json yarn.lock ./
RUN yarn install --production


FROM node:lts-alpine3.17
WORKDIR /app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY src ./src
CMD ["node", "src/index.js"]