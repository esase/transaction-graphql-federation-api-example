import logger from './shared/logger';
import { Config } from './config';
import GQLServer from '@mycointainer.ou/gql-common/server';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { applyMiddleware } from 'graphql-middleware';
import { auth, getTransactionCollection, subgraphSchema, Transactions } from './modules';
import connectRabbit from '@mycointainer.ou/services-common/rabbit';
import { connectDb } from './shared/db';
import { shield } from 'graphql-shield';
import {
    ApolloServerPluginLandingPageGraphQLPlayground,
    ApolloServerPluginLandingPageProductionDefault
} from 'apollo-server-core';

export default async function startApp (config: Config) {
    const rabbit = await connectRabbit(config.rabbitMqUrl);
    const appDBClient = await connectDb(config.mongoUrl);

    const transactionCollection = getTransactionCollection(appDBClient);

    const plugins = [
        config.isPlaygroundEnabled ?
            ApolloServerPluginLandingPageGraphQLPlayground({
                settings: {
                    'schema.polling.enable': true
                }
            }) :
            ApolloServerPluginLandingPageProductionDefault({
                footer: false
            })
    ];

    const server = new GQLServer({
        schema: applyMiddleware(
            buildSubgraphSchema(subgraphSchema),
            shield(auth, {
                allowExternalErrors: true
            })
        ),
        debug: config.isDev,
        plugins,
        csrfPrevention: true,
        logger,
        dataSources: () => ({
            transactions: new Transactions(transactionCollection, rabbit, logger)
        })
    });

    const httpServer =  await server.start(config.server.port);

    logger.info(`Server started at ${httpServer.url}`);
}
