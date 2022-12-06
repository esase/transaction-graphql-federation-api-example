import { GraphQLResolveInfo } from 'graphql';
import { and, or } from 'graphql-shield';
import { isAdmin, isAuthenticated, isService } from '@mycointainer.ou/gql-common/auth';

import defaultAuth, {
    isTransactionOwner,
    isTransactionOwnerHandler
} from './auth';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('modules/transactions/auth', () => {
    const id = 'id';
    const transaction = {
        userId: '1',
        companyId: '1'
    };

    describe('isTransactionOwnerHandler()', () => {
        test('should return `false` if a user context is missing', async () => {
            const mockContext = {
                dataSources: {
                    transactions: {
                        findOneById: jest.fn().mockResolvedValue(transaction)
                    }
                },
                user: null
            };

            const result = await isTransactionOwnerHandler(undefined, {
                id
            }, mockContext, {} as GraphQLResolveInfo);

            expect(result).toBeFalsy();
        });

        test('should return `false` if a user is not transaction owner', async () => {
            const mockContext = {
                dataSources: {
                    transactions: {
                        findOneById: jest.fn().mockResolvedValue(transaction)
                    }
                },
                user: {
                    userId: '2',
                    companyId: '2'
                }
            };

            const result = await isTransactionOwnerHandler(undefined, {
                id
            }, mockContext, {} as GraphQLResolveInfo);

            expect(mockContext.dataSources.transactions.findOneById).toHaveBeenLastCalledWith(id);
            expect(result).toBeFalsy();
        });

        test('should return `true` if a user is transaction owner', async () => {
            const mockContext = {
                dataSources: {
                    transactions: {
                        findOneById: jest.fn().mockResolvedValue(transaction)
                    }
                },
                user: {
                    userId: '1',
                    companyId: '1'
                }
            };

            const result = await isTransactionOwnerHandler(undefined, {
                id
            }, mockContext, {} as GraphQLResolveInfo);

            expect(result).toBeTruthy();
        });

        test('should return `false` if a transaction is missing', async () => {
            const mockContext = {
                dataSources: {
                    transactions: {
                        findOneById: jest.fn().mockResolvedValue(null)
                    }
                },
                user: {
                    userId: '1',
                    companyId: '1'
                }
            };

            const result = await isTransactionOwnerHandler(undefined, {
                id
            }, mockContext, {} as GraphQLResolveInfo);

            expect(result).toBeFalsy();
        });

    });

    describe('defaultAuth', () => {
        test('should contain all the auth rules', async () => {
            expect(defaultAuth).toStrictEqual({
                Query: {
                    transactions: and(isAuthenticated, or(isAdmin, isService)),
                    transactionById: and(isAuthenticated, or(isAdmin, isService)),
                    myTransactions: isAuthenticated,
                    myTransactionById: and(isAuthenticated, isTransactionOwner)
                },
                Mutation: {
                    createTransaction: and(isAuthenticated, or(isAdmin, isService)),
                    updateTransaction: and(isAuthenticated, or(isAdmin, isService)),
                    deleteTransaction: and(isAuthenticated, or(isAdmin, isService))
                }
            });
        });
    });
});
