import connectRabbit, { RabbitMQ } from '@mycointainer.ou/services-common/rabbit';
import getGraphQLClient from '@mycointainer.ou/gql-common/client';
import { purifyDb } from '../../shared/db';
import { createTransaction, transactionData } from '../../shared/transaction';
import { connectDb } from '../../../src/shared/db';
import { MongoClient } from 'mongodb';
import { gql } from 'apollo-server';
import integrationConfig from '../../config';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('Update transaction', function () {
    const fakeTransactionId = 'test-id';

    let rabbitMq: RabbitMQ;
    let mongoClient: MongoClient;

    const mutation = gql`
        mutation UpdateTransaction(
            $id: ID!
            $companyId: ID!
            $userId: ID!
            $walletId: ID!
            $status: TransactionStatus!
            $timestamp: DateTime!
            $asset: String!
            $assetType: TransactionAssetType!
            $type: TransactionType!
            $subType: TransactionSubType!
            $amount: Float!
            $euroAmount: Float!
            $externalId: String!
            $fee: Float!
            $destination: String!
            $comment: String
            $annualPercentageYield: Int
            $sourceAddress: String
        ) {
            updateTransaction(id: $id input: { 
                companyId: $companyId
                userId: $userId
                walletId: $walletId
                status: $status
                timestamp: $timestamp
                asset: $asset
                assetType: $assetType
                type: $type
                subType: $subType
                amount: $amount
                euroAmount: $euroAmount
                externalId: $externalId
                fee: $fee
                destination: $destination
                comment: $comment
                annualPercentageYield: $annualPercentageYield
                sourceAddress: $sourceAddress
            }) {
                transaction {
                    id
                    user {
                        companyId
                        id
                    }
                    wallet {
                        id
                    }
                    type
                    subType
                    status
                    timestamp
                    asset
                    assetType
                    amount
                    euroAmount
                    externalId
                    fee
                    destination
                    comment
                    annualPercentageYield
                    sourceAddress
                    createdAt
                    updatedAt
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
                id: fakeTransactionId,
                ...transactionData,
                timestamp: new Date(transactionData.timestamp).toISOString()
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
                id: fakeTransactionId,
                ...transactionData,
                timestamp: new Date(transactionData.timestamp).toISOString()
            });
        }
        catch (error: any) {
            expect(error.toString()).toContain('Not Authorised');

            return;
        }

        throw new Error('did not throw');
    });

    test('should update transaction and trigger event', async () => {
        const graphQLClient = getGraphQLClient({
            url: `http://localhost:${integrationConfig.server.port}`,
            callerId: 'transactions',
            callerType: 'service',
            headers: {'x-user': JSON.stringify({ userId: '1', companyId: '1', role: 'service' })}
        });

        // create a test transaction before updating
        const createResult = await createTransaction(graphQLClient);
        const transactionId = createResult.createTransaction.transaction.id;
        const transactionUpdatedAt = createResult.createTransaction.transaction.updatedAt;

        let rabbitEventPromiseResolver = (data: any) => data;
        const rabbitEventPromise = new Promise((_resolve) => {
            rabbitEventPromiseResolver = _resolve;
        });

        // listen the rabbitmq event and resolve the promise
        await rabbitMq.consume({
            queueName: 'transaction_api_transaction_updated_test',
            routingKey: 'transaction-api.transaction.updated',
            queueOptions: {
                durable: false,
                autoDelete: true
            },
            handler: rabbitEventPromiseResolver
        });

        // update the transaction
        const result = await graphQLClient.request(mutation, {
            id: transactionId,
            ...transactionData
        });

        // the transaction's updated date should be different from the initial state
        expect(transactionUpdatedAt).not.toStrictEqual(result.updateTransaction.transaction.updatedAt);

        // waiting for the rabbit response
        const rabbitEventPayload = await rabbitEventPromise as any;

        // the rabbit's payload should contain all the transaction data
        expect(rabbitEventPayload).toEqual(
            expect.objectContaining(transactionData)
        );
    });
});
