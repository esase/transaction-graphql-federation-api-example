/* eslint-disable @typescript-eslint/no-explicit-any */
import { gql } from 'apollo-server';
import { GraphQLClient } from '@mycointainer.ou/gql-common/client';

export const transactionData = {
    companyId: 'test-company-id',
    userId: 'test-user-id',
    walletId: 'test-wallet-id',
    status: 'COMPLETED',
    timestamp: '2022-01-01T00:00:00.000Z',
    asset: 'USDT',
    assetType: 'CRYPTO',
    type: 'DEPOSIT',
    subType: 'MINING',
    amount: 100,
    euroAmount: 22,
    externalId: 'test-external-transaction',
    fee: 0.5,
    destination: 'test-destination-address',
    comment: 'test-comment',
    annualPercentageYield: 200,
    sourceAddress: 'test-source-address'
};

export const createTransaction = async (graphQLClient: GraphQLClient, customTransactionData: any = {}) => {
    const mutation = gql`
        mutation CreateTransaction(
            $companyId: ID!
            $userId: ID!
            $walletId: ID!
            $status: TransactionStatus!
            $timestamp: DateTime!
            $asset: String!
            $assetType: TransactionAssetType!
            $type: TransactionType!
            $subType: TransactionSubType
            $amount: Float!
            $euroAmount: Float!
            $externalId: String!
            $fee: Float!
            $destination: String!
            $comment: String
            $annualPercentageYield: Int
            $sourceAddress: String
        ) {
            createTransaction(input: { 
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

    return graphQLClient.request(mutation, {
        ...transactionData,
        timestamp: new Date(transactionData.timestamp).toISOString(),
        ...customTransactionData
    });
};
