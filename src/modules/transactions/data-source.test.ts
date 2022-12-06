import { ObjectId } from 'mongodb';
import { getTransactionCollection, Transactions } from './data-source';
import {
    TransactionStatus,
    TransactionType,
    MyTransactionsInput,
    TransactionsInput,
    CreateTransactionInput,
    UpdateTransactionInput,
    TransactionSubType,
    TransactionAssetType
} from '../../types/generated-types';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('modules/transactions/data-source', () => {
    const id = '627ba17f0cdcae7ccdb6c90c';

    describe('getTransactionCollection', function () {
        it('should create a client and db indexes', async function () {
            const clientMock = {
                db: jest.fn().mockReturnThis(),
                collection: jest.fn().mockReturnThis(),
                createIndex: jest.fn().mockReturnThis()
            } as any;

            getTransactionCollection(clientMock);

            expect(clientMock.db).toHaveBeenCalled();
            expect(clientMock.collection).toHaveBeenCalledWith('transactions');
            expect(clientMock.createIndex).toHaveBeenCalledWith({
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
        });
    });

    describe('Transactions', function () {
        const transactionId = 1;

        let collectionMock: any;
        let rabbitMqMock: any;
        let loggerMock: any;
        let transaction: any;

        beforeEach(() => {
            collectionMock = {
                find: jest.fn().mockReturnThis(),
                countDocuments: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                toArray: jest.fn().mockResolvedValue([])
            } as any;

            rabbitMqMock = {
                publish: jest.fn()
            } as any;

            loggerMock = {
                info: jest.fn()
            } as any;

            transaction = {
                _id: transactionId
            };
        });

        describe('getTransactions()', function () {
            it('should get transactions with all filters', async function () {
                const skip = 1;
                const limit = 2;

                const input: TransactionsInput = {
                    asset: 'USD',
                    assetType: TransactionAssetType.Fiat,
                    companyId: '1',
                    userId: '2',
                    walletId: '3',
                    status: TransactionStatus.Failed,
                    type: TransactionType.Fee,
                    subType: TransactionSubType.Cashback,
                    externalId: '0d94878f473f336c803a54d7d6af49423f59e375a5459f74da02c32b54297af0',
                    timestamp: 1667602415,
                    startDate: new Date('2022-05-22'),
                    endDate: new Date('2022-05-23')
                };

                const dataSource = new Transactions(collectionMock, rabbitMqMock, loggerMock);

                await dataSource.getTransactions(input, skip, limit);

                expect(collectionMock.find).toHaveBeenLastCalledWith({
                    asset: input.asset,
                    assetType: input.assetType,
                    companyId: input.companyId,
                    userId: input.userId,
                    walletId: input.walletId,
                    status: input.status,
                    type: input.type,
                    subType: input.subType,
                    externalId: input.externalId,
                    timestamp: {
                        '$eq': new Date((input.timestamp || 0) * 1000),
                        '$gte': input.startDate,
                        '$lte': input.endDate
                    }
                });
                expect(collectionMock.sort).toHaveBeenLastCalledWith({
                    timestamp: -1
                });
                expect(collectionMock.limit).toHaveBeenLastCalledWith(limit);
                expect(collectionMock.skip).toHaveBeenLastCalledWith(skip);
                expect(collectionMock.toArray).toHaveBeenCalled();

                expect(collectionMock.countDocuments).toHaveBeenLastCalledWith({
                    asset: input.asset,
                    assetType: input.assetType,
                    companyId: input.companyId,
                    userId: input.userId,
                    walletId: input.walletId,
                    status: input.status,
                    type: input.type,
                    subType: input.subType,
                    externalId: input.externalId,
                    timestamp: {
                        '$eq': new Date((input.timestamp || 0) * 1000),
                        '$gte': input.startDate,
                        '$lte': input.endDate
                    }
                });
            });

            it('should get transactions without filters', async function () {
                const dataSource = new Transactions(collectionMock, rabbitMqMock, loggerMock);

                await dataSource.getTransactions();

                expect(collectionMock.find).toHaveBeenLastCalledWith({});
                expect(collectionMock.countDocuments).toHaveBeenLastCalledWith({});
            });

            it('should get transactions using only `timestamp`', async function () {
                const dataSource = new Transactions(collectionMock, rabbitMqMock, loggerMock);

                const input: MyTransactionsInput = {
                    timestamp: 1667602415
                };

                await dataSource.getTransactions(input);

                expect(collectionMock.find).toHaveBeenLastCalledWith({
                    timestamp: {
                        '$eq': new Date((input.timestamp || 0) * 1000)
                    }
                });

                expect(collectionMock.countDocuments).toHaveBeenLastCalledWith({
                    timestamp: {
                        '$eq': new Date((input.timestamp || 0) * 1000)
                    }
                });
            });

            it('should get transactions using only `startDate`', async function () {
                const dataSource = new Transactions(collectionMock, rabbitMqMock, loggerMock);

                const input: MyTransactionsInput = {
                    startDate: new Date('2022-05-22')
                };

                await dataSource.getTransactions(input);

                expect(collectionMock.find).toHaveBeenLastCalledWith({
                    timestamp: {
                        '$gte': input.startDate
                    }
                });

                expect(collectionMock.countDocuments).toHaveBeenLastCalledWith({
                    timestamp: {
                        '$gte': input.startDate
                    }
                });
            });

            it('should get transactions using only `endDate`', async function () {
                const dataSource = new Transactions(collectionMock, rabbitMqMock, loggerMock);

                const input: MyTransactionsInput = {
                    endDate: new Date('2022-05-23')
                };

                await dataSource.getTransactions(input);

                expect(collectionMock.find).toHaveBeenLastCalledWith({
                    timestamp: {
                        '$lte': input.endDate
                    }
                });

                expect(collectionMock.countDocuments).toHaveBeenLastCalledWith({
                    timestamp: {
                        '$lte': input.endDate
                    }
                });
            });

            it('should get transactions using default limit', async function () {
                const dataSource = new Transactions(collectionMock, rabbitMqMock, loggerMock);
                await dataSource.getTransactions();

                expect(collectionMock.limit).toHaveBeenLastCalledWith(1000);
            });
        });

        describe('deleteTransaction()', function () {
            it('should delete a transaction', async function () {
                const customCollectionMock = {
                    deleteOne: jest.fn().mockResolvedValue(null)
                } as any;

                const dataSource = new Transactions(customCollectionMock, rabbitMqMock, loggerMock);
                dataSource.findOneById = jest.fn().mockReturnValue(transaction);

                await dataSource.deleteTransaction(id);

                expect(customCollectionMock.deleteOne).toHaveBeenLastCalledWith({
                    '_id': new ObjectId(id).valueOf()
                });

                expect(rabbitMqMock.publish).toHaveBeenLastCalledWith({
                    routingKey: 'transaction-api.transaction.deleted',
                    payload: transaction
                });

                expect(loggerMock.info).toHaveBeenLastCalledWith(
                    { transaction },
                    'transaction deleted'
                );
            });
        });

        describe('createTransaction()', function () {
            it('should create a transaction', async function () {
                const insertedId = 1;
                const customCollectionMock = {
                    insertOne: jest.fn().mockResolvedValue({
                        insertedId
                    })
                } as any;

                const dataSource = new Transactions(customCollectionMock, rabbitMqMock, loggerMock);
                dataSource.findOneById = jest.fn().mockReturnValue(transaction);

                const input: CreateTransactionInput = {
                    amount: 100,
                    annualPercentageYield: 1,
                    asset: 'USD',
                    assetType: TransactionAssetType.Fiat,
                    companyId: '1',
                    walletId: '3',
                    comment: 'test-comment',
                    destination: 'test-destination',
                    euroAmount: 12.3,
                    fee: 2.1,
                    status: TransactionStatus.Cancelled,
                    timestamp: new Date(),
                    externalId: '111',
                    type: TransactionType.Deposit,
                    subType: TransactionSubType.Mining,
                    userId: '22'
                };

                await dataSource.createTransaction(input);

                const insertOptions = customCollectionMock.insertOne.mock.calls[0][0];

                expect(insertOptions._id).not.toBeUndefined();
                expect(insertOptions.createdAt).not.toBeUndefined();
                expect(insertOptions.updatedAt).not.toBeUndefined();

                delete insertOptions._id;
                delete insertOptions.createdAt;
                delete insertOptions.updatedAt;

                expect(insertOptions).toStrictEqual(input);

                expect(dataSource.findOneById).toHaveBeenLastCalledWith(insertedId);

                expect(rabbitMqMock.publish).toHaveBeenLastCalledWith({
                    routingKey: 'transaction-api.transaction.created',
                    payload: transaction
                });

                expect(loggerMock.info).toHaveBeenLastCalledWith(
                    { transaction },
                    'transaction created'
                );
            });
        });

        describe('updateTransaction()', function () {
            it('should update a transaction', async function () {
                const customCollectionMock = {
                    updateOne: jest.fn().mockResolvedValue(null)
                } as any;

                const dataSource = new Transactions(customCollectionMock, rabbitMqMock, loggerMock);
                dataSource.deleteFromCacheById = jest.fn();
                dataSource.findOneById = jest.fn().mockReturnValue(transaction);

                const input: UpdateTransactionInput = {
                    amount: 100,
                    annualPercentageYield: 1,
                    asset: 'USD',
                    assetType: TransactionAssetType.Fiat,
                    companyId: '1',
                    walletId: '3',
                    comment: 'test-comment',
                    destination: 'test-destination',
                    euroAmount: 12.3,
                    fee: 2.1,
                    status: TransactionStatus.Cancelled,
                    timestamp: new Date(),
                    externalId: '111',
                    type: TransactionType.Deposit,
                    subType: TransactionSubType.Mining,
                    userId: '22'
                };

                await dataSource.updateTransaction(id, input);

                const updateOptions1 = customCollectionMock.updateOne.mock.calls[0][0];

                expect(updateOptions1).toStrictEqual({
                    _id: new ObjectId(id).valueOf()
                });

                const updateOptions2 = customCollectionMock.updateOne.mock.calls[0][1];

                expect(updateOptions2.$set.updatedAt).not.toBeUndefined();

                delete updateOptions2.$set.updatedAt;

                expect(updateOptions2.$set).toStrictEqual(input);

                expect(dataSource.deleteFromCacheById).toHaveBeenLastCalledWith(id);
                expect(dataSource.findOneById).toHaveBeenLastCalledWith(id);

                expect(rabbitMqMock.publish).toHaveBeenLastCalledWith({
                    routingKey: 'transaction-api.transaction.updated',
                    payload: transaction
                });

                expect(loggerMock.info).toHaveBeenLastCalledWith(
                    { transaction },
                    'transaction updated'
                );
            });
        });
    });
});
