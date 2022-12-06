import connectRabbit, { RabbitMQ } from '@mycointainer.ou/services-common/rabbit';
import getGraphQLClient from '@mycointainer.ou/gql-common/client';
import { purifyDb } from '../../shared/db';
import { createTransaction, transactionData } from '../../shared/transaction';
import { connectDb } from '../../../src/shared/db';
import { MongoClient } from 'mongodb';
import { gql } from 'apollo-server';
import integrationConfig from '../../config';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('Delete transaction', function () {
    const fakeTransactionId = 'test-id';

    let rabbitMq: RabbitMQ;
    let mongoClient: MongoClient;

    const mutation = gql`
        mutation DeleteTransaction($id: ID!) {
            deleteTransaction(id: $id) {
                transaction {
                    id
                }
            }
        }
    `;

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
            await graphQLClient.request(mutation, {
                id: fakeTransactionId
            });
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
            await graphQLClient.request(mutation, {
                id: fakeTransactionId
            });
        }
        catch (error: any) {
            expect(error.toString()).toContain('Not Authorised');

            return;
        }

        throw new Error('did not throw');
    });

    test('should delete transaction and trigger event', async () => {
        const graphQLClient = getGraphQLClient({
            url: `http://localhost:${integrationConfig.server.port}`,
            callerId: 'transactions',
            callerType: 'service',
            headers: {'x-user': JSON.stringify({ userId: '1', companyId: '1', role: 'service' })}
        });

        // create a test transaction before deleting
        const createResult = await createTransaction(graphQLClient);
        const transactionId = createResult.createTransaction.transaction.id;

        let rabbitEventPromiseResolver = (data: any) => data;
        const rabbitEventPromise = new Promise((_resolve) => {
            rabbitEventPromiseResolver = _resolve;
        });

        // listen the rabbitmq event and resolve the promise
        await rabbitMq.consume({
            queueName: 'transaction_api_transaction_deleted_test',
            routingKey: 'transaction-api.transaction.deleted',
            queueOptions: {
                durable: false,
                autoDelete: true
            },
            handler: rabbitEventPromiseResolver
        });

        // delete the transaction
        const result = await graphQLClient.request(mutation, {
            id: transactionId
        });

        // check the mutation's result
        expect(result.deleteTransaction.transaction).toStrictEqual({
            id: transactionId
        });

        // waiting for the rabbit response
        const rabbitEventPayload = await rabbitEventPromise as any;

        // the rabbit's payload should contain all the transaction data
        expect(rabbitEventPayload).toEqual(
            expect.objectContaining(transactionData)
        );
    });
});
