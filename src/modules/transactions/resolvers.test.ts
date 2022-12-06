
import { GraphQLResolveInfo } from 'graphql';
import resolvers from './resolvers';
import { TransactionModel } from './data-source';
import {
    MutationCreateTransactionArgs,
    MutationDeleteTransactionArgs,
    MutationUpdateTransactionArgs,
    QueryMyTransactionByIdArgs,
    QueryMyTransactionsArgs,
    QueryTransactionByIdArgs,
    QueryTransactionsArgs,
    TransactionsInput,
    TransactionStatus,
    TransactionType,
    MyTransactionsInput,
    CreateTransactionInput,
    UpdateTransactionInput,
    TransactionAssetType
} from '../../types/generated-types';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('modules/transactions/resolvers', () => {
    const id = 'test-id';
    const companyId = '1';
    const userId = '2';
    const walletId = '3';
    const asset = 'USDT';

    const transaction = {
        _id: id,
        companyId,
        userId,
        walletId,
        asset
    } as unknown as TransactionModel;

    let rootContext: any;

    beforeEach(function () {
        rootContext = {
            user: {
                companyId,
                userId
            },
            dataSources: {
                transactions: {
                    getTransactions: jest.fn().mockResolvedValue({
                        totalCount: 0,
                        items: []
                    }),
                    findOneById: jest.fn().mockResolvedValue({}),
                    createTransaction: jest.fn().mockResolvedValue(transaction),
                    updateTransaction: jest.fn().mockResolvedValue(transaction),
                    deleteTransaction: jest.fn().mockResolvedValue(transaction)
                }
            }
        };
    });

    describe('Query', function () {
        const limit = 1;
        const skip = 2;

        describe('transactions()', function () {
            it('should call the `getTransactions` method with appropriate args', async function () {
                const input: TransactionsInput = {
                    asset: 'USD',
                    assetType: TransactionAssetType.Fiat,
                    companyId: '1',
                    userId: '2',
                    startDate: new Date(),
                    endDate: new Date(),
                    status: TransactionStatus.Completed,
                    type: TransactionType.Exchange,
                    externalId: '9b8bd515561015a4a1025fbcbaf32d4ae91ba8bc6a0463be27068970e1a97e80'
                };

                const args: QueryTransactionsArgs = {
                    input,
                    limit,
                    skip
                };

                await resolvers.Query?.transactions?.({}, args, rootContext, {} as GraphQLResolveInfo);

                expect(rootContext.dataSources.transactions.getTransactions).toHaveBeenLastCalledWith(
                    input,
                    skip,
                    limit
                );
            });
        });

        describe('transactionById()', function () {
            it('should call the `findOneById` method with appropriate args', async function () {
                const args: QueryTransactionByIdArgs = {
                    id
                };

                await resolvers.Query?.transactionById?.({}, args, rootContext, {} as GraphQLResolveInfo);

                expect(rootContext.dataSources.transactions.findOneById).toHaveBeenLastCalledWith(id);
            });
        });

        describe('myTransactions()', function () {
            it('should call the `getTransactions` method with appropriate args', async function () {
                const input: MyTransactionsInput = {
                    asset: 'USD',
                    assetType: TransactionAssetType.Fiat,
                    startDate: new Date(),
                    endDate: new Date(),
                    status: TransactionStatus.Cancelled,
                    type: TransactionType.Deposit,
                    externalId: '9b8bd515561015a4a1025fbcbaf32d4ae91ba8bc6a0463be27068970e1a97e80'
                };

                const args: QueryMyTransactionsArgs = {
                    input,
                    limit,
                    skip
                };

                await resolvers.Query?.myTransactions?.({}, args, rootContext, {} as GraphQLResolveInfo);

                expect(rootContext.dataSources.transactions.getTransactions).toHaveBeenLastCalledWith(
                    {
                        ...input,
                        companyId,
                        userId
                    },
                    skip,
                    limit
                );
            });
        });

        describe('myTransactionById()', function () {
            it('should call the `findOneById` method with appropriate args', async function () {
                const args: QueryMyTransactionByIdArgs = {
                    id
                };

                await resolvers.Query?.myTransactionById?.({}, args, rootContext, {} as GraphQLResolveInfo);

                expect(rootContext.dataSources.transactions.findOneById).toHaveBeenLastCalledWith(id);
            });
        });
    });

    describe('Mutation', function () {
        describe('createTransaction()', function () {
            it('should call the `createTransaction` method with appropriate args', async function () {
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
                    userId: '22'
                };

                const args: MutationCreateTransactionArgs = {
                    input
                };

                const result = await resolvers.Mutation?.createTransaction?.({}, args, rootContext, {} as GraphQLResolveInfo);

                expect(rootContext.dataSources.transactions.createTransaction).toHaveBeenLastCalledWith(input);
                expect(result).toStrictEqual({
                    transaction
                });
            });
        });

        describe('updateTransaction()', function () {
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
                userId: '22'
            };

            it('should trigger an exception when transaction is missing', async function () {
                const customRootContext = {
                    ...rootContext,
                    dataSources: {
                        transactions: {
                            ...rootContext.dataSources.transactions,
                            findOneById: jest.fn().mockResolvedValue(null)
                        }
                    }
                };

                const args: MutationUpdateTransactionArgs = {
                    id,
                    input
                };

                try {
                    await resolvers.Mutation?.updateTransaction?.({}, args, customRootContext, {} as GraphQLResolveInfo);
                }
                catch (err: any) {
                    expect(err.name).toStrictEqual('Error');
                    expect(err.message).toStrictEqual('Transaction is missing');

                    return;
                }

                throw new Error('did not throw');
            });

            it('should call the `updateTransaction` method with appropriate args', async function () {
                const args: MutationUpdateTransactionArgs = {
                    id,
                    input
                };

                const result = await resolvers.Mutation?.updateTransaction?.({}, args, rootContext, {} as GraphQLResolveInfo);

                expect(rootContext.dataSources.transactions.updateTransaction).toHaveBeenLastCalledWith(id, input);
                expect(result).toStrictEqual({
                    transaction
                });
            });
        });

        describe('deleteTransaction()', function () {
            it('should trigger an exception when transaction is missing', async function () {
                const customRootContext = {
                    ...rootContext,
                    dataSources: {
                        transactions: {
                            ...rootContext.dataSources.transactions,
                            findOneById: jest.fn().mockResolvedValue(null)
                        }
                    }
                };

                const args: MutationDeleteTransactionArgs = {
                    id
                };

                try {
                    await resolvers.Mutation?.deleteTransaction?.({}, args, customRootContext, {} as GraphQLResolveInfo);
                }
                catch (err: any) {
                    expect(err.name).toStrictEqual('Error');
                    expect(err.message).toStrictEqual('Transaction is missing');

                    return;
                }

                throw new Error('did not throw');
            });

            it('should call the `deleteTransaction` method with appropriate args', async function () {
                const args: MutationDeleteTransactionArgs = {
                    id
                };

                const result = await resolvers.Mutation?.deleteTransaction?.({}, args, rootContext, {} as GraphQLResolveInfo);

                expect(rootContext.dataSources.transactions.deleteTransaction).toHaveBeenLastCalledWith(id);
                expect(result).toStrictEqual({
                    transaction: {
                        id
                    }
                });
            });
        });
    });

    describe('Transaction', function () {
        it('should return `_id` as `id`', function () {
            const result = resolvers.Transaction?.id?.(
                transaction,
                {},
                rootContext,
                {} as GraphQLResolveInfo
            );

            expect(result).toStrictEqual(id);
        });

        it('should return `user` data', async function () {
            const result = await resolvers.Transaction?.user?.(
                transaction,
                {},
                rootContext,
                {} as GraphQLResolveInfo
            );

            expect(result).toStrictEqual({
                id: userId,
                companyId
            });
        });

        it('should return `wallet` data', async function () {
            const result = await resolvers.Transaction?.wallet?.(
                transaction,
                {},
                rootContext,
                {} as GraphQLResolveInfo
            );

            expect(result).toStrictEqual({
                id: walletId,
                user: {
                    companyId,
                    id: userId
                },
                assetCode: asset
            });
        });
    });
});
