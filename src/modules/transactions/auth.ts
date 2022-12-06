import { and, or, rule } from 'graphql-shield';
import { IRuleFunction } from 'graphql-shield/dist/types';
import { ServiceContext } from '../../types/context';
import { isAdmin, isAuthenticated, isService } from '@mycointainer.ou/gql-common/auth';

export const isTransactionOwnerHandler: IRuleFunction =
    async (parent, args, context: ServiceContext) => {
        if (!context.user || !args.id) {
            return false;
        }

        const { companyId, userId } = context.user;
        const transaction = await context.dataSources.transactions.findOneById(args.id);

        if (transaction) {
            return transaction.userId === userId && transaction.companyId === companyId;
        }

        return false;
    };

export const isTransactionOwner = rule()(
    isTransactionOwnerHandler
);

export default {
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
};
