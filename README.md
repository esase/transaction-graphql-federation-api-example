## General rules
1. Service should be implemented in typescript
2. Config-related `process.env` and globals stuff should be resolved (encapsulated) in `src/config.ts`.

## Top-level directory structure
1. Source code should be located under `src` directory. (Additional devops/etc script should be located elsewhere e.g. `migration-scripts`)
2. Infrastructure-related configs (dockerfiles, k8s configs) should be located under `infra` folder.

## "src" directory structure
```text
src/interfaces      - keeps global interfaces of the project
src/index.ts        - service entry point
src/config.ts       - service config
src/modules/        - keeps domain related modules stuff (auth, data source, resolvers, etc.)
```

## "infra" directory structure
```text
infra/docker/                         - dockerfiles and related scripts
infra/k8s/                            - k8s configs and related scripts
infra/docker/dev.Dockerfile           - without copy of `src` and other files under watch
infra/docker/Dockerfile               - for production
infra/k8s/service-deployment.tpl.yaml - k8s deployment config template
```

## How to deploy my service to test/staging cluster (env vars via secrets approach)
1. Change `SERVICE_NAME` in `bitbucket-pipelines.yml`; The name should start with `myc2-` prefix
2. If your service requires env vars, create secrets template at `infra/k8s/secrets.sample.yaml` (with empty values)
3. Configure deployment to extract env vars from secrets `infra/k8s/service-deployment.tpl.yaml`
4. Deploy secrets to test/staging cluster manually or ask someone. (do not commit secrets values to git)
5. Activate pipelines for service repo
6. Push `develop` branch to deploy to test env

See [account-service](https://bitbucket.org/myc-team/account-service/src/master/k8s/) for example.

## k8s deployment env vars
These vars are set in `bitbucket-pipelines.yaml`

```
SERVICE_NAME
PORT
IMAGE_NAME
```

## Unit testing
1. `jest` + `ts-jest` is used for tests | [docs](https://jestjs.io/docs/using-matchers)
2. Create test files next to the files being tested: `cache.ts` and next to it `cache.test.ts`
3. `yarn test` - build & run tests
4. `yarn test-watch` - run tests in watch mode
5. `yarn test-watch -t 'Invalid echo payload'` - run / watch only specific test

## Integration testing

Call the `yarn integration-test` command from the project's root dir to launch integration tests.

PS: All the integration tests are launched automatically in the bitbucket pipelines you don't need to run them manually.

## Shared codebase

To share code parts across services [services-common](https://bitbucket.org/myc-team/services-common/src/master/) is used. It's distributed as private npm package.

### Modify "services-common" imports locally

Imagine you need to reconfigure some `services-common/log` for your needs:

1. Create `src/shared/log.ts`
2. Import `services-common/log` at `src/shared/log.ts`
3. Configure and export modified instance
4. Use `src/shared/log.ts` instead of `services-common/log` in scope of service

Check `src/shared/log.ts` for example.

If it doesn't work, consider contributing to [services-common](https://bitbucket.org/myc-team/services-common/src/master/) directly.


## Commands
```text
yarn build              - build typescript to `./dist` directory
yarn start              - start application (built at `./dist`)
yarn dev                - start application in dev mode
yarn test               - run unit tests
yarn test-watch         - run unit tests in watch mode
yarn integration        - run integration tests
yarn lint               - run linter
yarn generate-gql-types - build type script interfaces based on the the graphql schemas (which is used in resolvers)
```

## Useful DEV tips

### Test/watch specific .test file

If you want `test-watch` single file `register.route.test.ts` and ignore everything else, add line to `jest.config.js`:
```
{
	...
	testRegex: 'register.route.test'
	...
}
```

### Auth request

The most graphql's queries/mutations require a user json object, which looks like:

```
{
  "x-user": "{\"companyId\": \"1\", \"userId\": \"1\", \"role\": \"admin\" }"
}
```

All subgraphs trust to this auth object, and don't validate it (because the auth is made in the root graph), so you are free to change it as you want.
 
### Fully typed graphql resolvers

To have a fully typed resolvers based on graphql schemas we should somehow build that schema into typescript interfaces For that purposes we use extra libraries which do the job:

```
    "@graphql-codegen/cli": "^2.6.2",
    "@graphql-codegen/typescript": "^2.5.0",
    "@graphql-codegen/typescript-resolvers": "^2.6.5",
```

Using the command:

```
yarn generate-gql-types
```

we generate an output here: `src/types/generated-types.ts`, which is used in resolvers like this: 

```
Mutation: {
    createTransaction: async (parent, args, context) => {
        const transaction = await context.dataSources.transactions.createTransaction(args.input);

        return {
            transaction
        };
    },
```