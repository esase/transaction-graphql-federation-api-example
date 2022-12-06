FROM node:lts-alpine

WORKDIR /app

COPY ./.yarn/ ./.yarn/
COPY ./.pnp.cjs .
COPY ./package.json .
COPY ./.yarnrc.yml .
COPY ./yarn.lock .
COPY ./tsconfig.json .
COPY ./jest.config.js .
COPY ./codegen.yaml .
COPY ./nodemon.json .

RUN yarn
RUN yarn generate-gql-types
CMD yarn dev
