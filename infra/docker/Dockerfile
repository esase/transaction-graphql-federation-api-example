FROM node:lts-alpine

WORKDIR /app

COPY ./src ./src
COPY ./.yarn/ ./.yarn/
COPY ./.pnp.cjs .
COPY ./package.json .
COPY ./.yarnrc.yml .
COPY ./yarn.lock .
COPY ./tsconfig.json .
COPY ./codegen.yaml .

RUN yarn
RUN yarn build
CMD yarn start
