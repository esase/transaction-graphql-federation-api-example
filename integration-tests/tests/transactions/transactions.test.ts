import getGraphQLClient from '@mycointainer.ou/gql-common/client';
import { purifyDb } from '../../shared/db';
import { createTransaction, transactionData } from '../../shared/transaction';
import { connectDb } from '../../../src/shared/db';
import { MongoClient } from 'mongodb';
import { gql } from 'apollo-server';
import integrationConfig from '../../config';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('Fetch transaction list', function () {
    let mongoClient: MongoClient;

    const query = gql`
        query fetchTransactions(
            $skip: NonNegativeInt 
            $limit: NonNegativeInt
            $timestamp: Int
            $startDate: Date
            $endDate: Date
            $type: TransactionType
            $subType: TransactionSubType
            $status: TransactionStatus
            $asset: String
            $assetType: TransactionAssetType
            $companyId: ID
            $userId: ID
            $walletId: ID
            $externalId: String
        ) {
            transactions(skip: $skip limit: $limit input: {
                timestamp: $timestamp
                startDate: $startDate
                endDate: $endDate
                type: $type
                subType: $subType
                status: $status
                asset: $asset
                assetType: $assetType
                companyId: $companyId
                userId: $userId
                walletId: $walletId
                externalId: $externalId
            }) {
                totalCount
                items {
                    id
                }
            }
        }
    `;

    const queryParams = {
        skip: 1,
        limit: 1,
        timestamp: null,
        startDate: new Date(transactionData.timestamp).toISOString().split('T')[0],
        endDate: new Date('2022-01-02T00:00:00.000Z').toISOString().split('T')[0],
        type: transactionData.type,
        subType: transactionData.subType,
        status: transactionData.status,
        asset: transactionData.asset,
        assetType: transactionData.assetType,
        companyId: transactionData.companyId,
        userId: transactionData.userId,
        walletId: transactionData.walletId,
        externalId: transactionData.externalId
    };

    beforeAll(async () => {
        mongoClient = await connectDb(integrationConfig.mongoUrl);
    });

    afterAll(async () => {
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
            await graphQLClient.request(query, queryParams);
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
            await graphQLClient.request(query, queryParams);
        }
        catch (error: any) {
            expect(error.toString()).toContain('Not Authorised');

            return;
        }

        throw new Error('did not throw');
    });

    test('should fetch a single transaction from a set of two using most filters and pagination offset', async () => {
        const graphQLClient = getGraphQLClient({
            url: `http://localhost:${integrationConfig.server.port}`,
            callerId: 'transactions',
            callerType: 'service',
            headers: {'x-user': JSON.stringify({ userId: '1', companyId: '1', role: 'service' })}
        });

        // create a couple of test transactions before fetching
        await createTransaction(graphQLClient, {
            timestamp: '2022-01-02T00:00:00.000Z'
        });

        const createResult = await createTransaction(graphQLClient);
        const transactionId = createResult.createTransaction.transaction.id;

        const result = await graphQLClient.request(query, queryParams);

        // check the query's result
        expect(result.transactions.totalCount).toStrictEqual(2);
        expect(result.transactions.items.length).toStrictEqual(1);
        expect(result.transactions.items[0].id).toStrictEqual(transactionId);
    });

    test('should fetch a single transaction using most filters and the creation timestamp', async () => {
        const graphQLClient = getGraphQLClient({
            url: `http://localhost:${integrationConfig.server.port}`,
            callerId: 'transactions',
            callerType: 'service',
            headers: {'x-user': JSON.stringify({ userId: '1', companyId: '1', role: 'service' })}
        });

        const customQueryParams = {
            ...queryParams,
            skip: 0,
            limit: 1,
            timestamp: 1640995200,
            startDate: null,
            endDate: null
        };

        const createResult = await createTransaction(graphQLClient);
        const transactionId = createResult.createTransaction.transaction.id;


        const result = await graphQLClient.request(query, customQueryParams);

        // check the query's result
        expect(result.transactions.totalCount).toStrictEqual(1);
        expect(result.transactions.items.length).toStrictEqual(1);
        expect(result.transactions.items[0].id).toStrictEqual(transactionId);
    });
});
