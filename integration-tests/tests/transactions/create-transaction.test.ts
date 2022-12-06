import connectRabbit, { RabbitMQ } from '@mycointainer.ou/services-common/rabbit';
import getGraphQLClient from '@mycointainer.ou/gql-common/client';
import { purifyDb } from '../../shared/db';
import { createTransaction, transactionData } from '../../shared/transaction';
import { connectDb } from '../../../src/shared/db';
import { MongoClient } from 'mongodb';
import integrationConfig from '../../config';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('Create transaction', function () {
    let rabbitMq: RabbitMQ;
    let mongoClient: MongoClient;

    beforeAll(async () => {
        rabbitMq = await connectRabbit(integrationConfig.rabbitMqUrl);
        mongoClient = await connectDb(integrationConfig.mongoUrl);
    });

    afterAll(async () => {
        await rabbitMq.channel?.close();
        await mongoClient.close();
    });

    afterEach(async () => {
        await purifyDb(mongoClient, [
            'transactions'
        ]);
    });

    test('should throw auth error if a user is not authenticated', async () => {
        const graphQLClient = getGraphQLClient({
            url: `http://localhost:${integrationConfig.server.port}`,
            callerId: 'transactions',
            callerType: 'service'
        });

        try {
            await createTransaction(graphQLClient);
        }
        catch (error: any) {
            expect(error.toString()).toContain('Not Authorised');

            return;
        }

        throw new Error('did not throw');
    });

    test('should throw auth error if a user neither admin nor service', async () => {
        const graphQLClient = getGraphQLClient({
            url: `http://localhost:${integrationConfig.server.port}`,
            callerId: 'transactions',
            callerType: 'service',
            headers: {'x-user': JSON.stringify({ userId: '1', companyId: '1', role: 'user' })}
        });

        try {
            await createTransaction(graphQLClient);
        }
        catch (error: any) {
            expect(error.toString()).toContain('Not Authorised');

            return;
        }

        throw new Error('did not throw');
    });

    test('should create transaction and trigger event', async () => {
        const graphQLClient = getGraphQLClient({
            url: `http://localhost:${integrationConfig.server.port}`,
            callerId: 'transactions',
            callerType: 'service',
            headers: {'x-user': JSON.stringify({ userId: '1', companyId: '1', role: 'service' })}
        });

        let rabbitEventPromiseResolver = (data: any) => data;
        const rabbitEventPromise = new Promise((_resolve) => {
            rabbitEventPromiseResolver = _resolve;
        });

        // listen the rabbitmq event and resolve the promise
        await rabbitMq.consume({
            queueName: 'transaction_api_transaction_created_test',
            routingKey: 'transaction-api.transaction.created',
            queueOptions: {
                durable: false,
                autoDelete: true
            },
            handler: rabbitEventPromiseResolver
        });

        // create the transaction
        const result = await createTransaction(graphQLClient);

        const expectedTransaction = {
            ...transactionData,
            user: {
                companyId: transactionData.companyId,
                id: transactionData.userId
            },
            wallet: {
                id: transactionData.walletId
            }
        } as any;

        delete expectedTransaction.userId;
        delete expectedTransaction.companyId;
        delete expectedTransaction.walletId;

        // check the mutation's result
        expect(result.createTransaction.transaction).toEqual(
            expect.objectContaining(expectedTransaction)
        );

        // waiting for the rabbit response
        const rabbitEventPayload = await rabbitEventPromise as any;

        // the rabbit's payload should contain all the transaction data
        expect(rabbitEventPayload).toEqual(
            expect.objectContaining(transactionData)
        );
    });
});
