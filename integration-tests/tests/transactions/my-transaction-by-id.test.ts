import getGraphQLClient from '@mycointainer.ou/gql-common/client';
import { purifyDb } from '../../shared/db';
import { createTransaction, transactionData } from '../../shared/transaction';
import { connectDb } from '../../../src/shared/db';
import { MongoClient } from 'mongodb';
import { gql } from 'apollo-server';
import integrationConfig from '../../config';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('Fetch my transaction by id', function () {
    const fakeTransactionId = 'test-id';

    let mongoClient: MongoClient;

    const query = gql`
        query fetchMyTransactionById($id: ID!) {
            myTransactionById(id: $id) {
                id
            }
        }
    `;

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
            await graphQLClient.request(query, {
                id: fakeTransactionId
            });
        }
        catch (error: any) {
            expect(error.toString()).toContain('Not Authorised');

            return;
        }

        throw new Error('did not throw');
    });

    test('should throw auth error if a user is not transaction owner', async () => {
        const graphQLClient = getGraphQLClient({
            url: `http://localhost:${integrationConfig.server.port}`,
            callerId: 'transactions',
            callerType: 'service',
            headers: {'x-user': JSON.stringify({ userId: transactionData.userId, companyId: transactionData.companyId, role: 'admin' })}
        });

        // create a test transaction by an admin before fetching
        const createResult = await createTransaction(graphQLClient);
        const transactionId = createResult.createTransaction.transaction.id;

        const userGraphQLClient = getGraphQLClient({
            url: `http://localhost:${integrationConfig.server.port}`,
            callerId: 'transactions',
            callerType: 'service',
            headers: {'x-user': JSON.stringify({ userId: 'fake-user-id', companyId: 'fake-company-id', role: 'admin' })}
        });

        try {
            await userGraphQLClient.request(query, {
                id: transactionId
            });
        }
        catch (error: any) {
            expect(error.toString()).toContain('Not Authorised');

            return;
        }

        throw new Error('did not throw');
    });

    test('should fetch a transaction by its id', async () => {
        const graphQLClient = getGraphQLClient({
            url: `http://localhost:${integrationConfig.server.port}`,
            callerId: 'transactions',
            callerType: 'service',
            headers: {'x-user': JSON.stringify({ userId: transactionData.userId, companyId: transactionData.companyId, role: 'admin' })}
        });

        // create a test transaction before fetching
        const createResult = await createTransaction(graphQLClient);
        const transactionId = createResult.createTransaction.transaction.id;

        const result = await graphQLClient.request(query, {
            id: transactionId
        });

        expect(transactionId).toStrictEqual(result.myTransactionById.id);
    });
});
