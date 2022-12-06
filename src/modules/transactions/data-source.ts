import { RabbitMQ } from '@mycointainer.ou/services-common/rabbit';
import { Collection, MongoDataSource } from 'apollo-datasource-mongodb';
import { MongoClient, ObjectId } from 'mongodb';
import { ServiceContext } from '../../types/context';
import { Logger } from '../../shared/logger';
import {
    TransactionStatus,
    TransactionType,
    TransactionAssetType,
    TransactionSubType,
    MyTransactionsInput,
    TransactionsInput,
    CreateTransactionInput,
    UpdateTransactionInput
} from '../../types/generated-types';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface TransactionModel {
    _id: ObjectId;
    companyId: string;
    userId: string;
    walletId: string;
    status: TransactionStatus;
    timestamp: Date;
    asset: string;
    assetType: TransactionAssetType;
    type: TransactionType;
    subType?: TransactionSubType;
    amount: number;
    euroAmount: number;
    externalId: string;
    fee: number;
    destination: string;
    comment?: string;
    annualPercentageYield?: number;
    sourceAddress?: string;
    createdAt: Date;
    updatedAt: Date;
}

export const getTransactionCollection = (client: MongoClient) => {
    const collection = client.db().collection<TransactionModel>('transactions');

    collection.createIndex({
        companyId: 1,
        userId: 1,
        walletId: 1,
        status: 1,
        asset: 1,
        assetType: 1,
        type: 1,
        subType: 1,
        externalId: 1,
        timestamp: 1
    }, {
        unique: true
    });

    return collection;
};

export class Transactions extends MongoDataSource<TransactionModel, ServiceContext> {
    private rabbitMQ: RabbitMQ;
    private logger: Logger;

    constructor(collection: Collection<TransactionModel>, rabbitMQ: RabbitMQ, logger: Logger) {
        super(collection);

        this.rabbitMQ = rabbitMQ;
        this.logger = logger;
    }

    private maxTransactionsLimit = 1000;

    async getTransactions(
        input?: MyTransactionsInput | TransactionsInput,
        skip?: number | string,
        limit?: number | string
    ) {
        // we always should restrict the number of entities
        if (!limit) {
            limit = this.maxTransactionsLimit;
        }

        const filter = {} as any;

        if (input) {
            if (input.type) {
                filter.type = input.type;
            }

            if (input.subType) {
                filter.subType = input.subType;
            }

            if (input.status) {
                filter.status = input.status;
            }

            if (input.asset) {
                filter.asset = input.asset;
            }

            if (input.assetType) {
                filter.assetType = input.assetType;
            }

            if (input.externalId) {
                filter.externalId = input.externalId;
            }

            if (input.startDate || input.endDate || input.timestamp) {
                filter.timestamp = {};
            }

            if (input.timestamp) {
                filter.timestamp.$eq = new Date(input.timestamp * 1000);
            }

            if (input.startDate) {
                filter.timestamp.$gte = new Date(input.startDate);
            }

            if (input.endDate) {
                filter.timestamp.$lte = new Date(input.endDate);
            }

            if ('companyId' in input) {
                filter.companyId = input.companyId;
            }

            if ('userId' in input) {
                filter['userId'] = input.userId;
            }

            if ('walletId' in input) {
                filter['walletId'] = input.walletId;
            }
        }

        const transactions = this.collection.find(filter)
            .sort({
                timestamp: -1
            })
            .limit(Math.min(parseInt(limit.toString()), this.maxTransactionsLimit))
            .skip(skip ? parseInt(skip.toString()) : 0);

        const [totalCount, items] = await Promise.all([
            this.collection.countDocuments(filter) as unknown as number,
            transactions.toArray()
        ]);

        return {
            totalCount,
            items
        };
    }

    async createTransaction(input: CreateTransactionInput) {
        const result =  await this.collection.insertOne({
            ...input,
            _id: new ObjectId(),
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const transaction = await this.findOneById(result.insertedId) as unknown as Promise<TransactionModel>;

        await this.rabbitMQ.publish({
            routingKey: 'transaction-api.transaction.created',
            payload: transaction
        });

        this.logger.info({
            transaction
        }, 'transaction created');

        return transaction;
    }

    async updateTransaction(id: string, input: UpdateTransactionInput) {
        await this.collection.updateOne({
            _id: new ObjectId(id).valueOf()
        }, {
            $set: {
                ...input,
                updatedAt: new Date()
            }
        });

        this.deleteFromCacheById(id);

        const transaction = await this.findOneById(id) as unknown as Promise<TransactionModel>;

        await this.rabbitMQ.publish({
            routingKey: 'transaction-api.transaction.updated',
            payload: transaction
        });

        this.logger.info({
            transaction
        }, 'transaction updated');

        return transaction;
    }

    async deleteTransaction(id: string) {
        const transaction = await this.findOneById(id) as unknown as Promise<TransactionModel>;

        await this.collection.deleteOne({
            '_id': new ObjectId(id).valueOf()
        });

        await this.rabbitMQ.publish({
            routingKey: 'transaction-api.transaction.deleted',
            payload: transaction
        });

        this.logger.info({
            transaction
        }, 'transaction deleted');
    }
}
