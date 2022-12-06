import { Resolvers } from '../../types/generated-types';

const resolvers: Resolvers = {
    Query: {
        transactions: async (parent, args, context) =>
            context.dataSources.transactions.getTransactions(args.input, args.skip, args.limit),

        transactionById: async (parent, args, context) =>
            context.dataSources.transactions.findOneById(args.id),

        myTransactions: async (parent, args, context) =>
            context.dataSources.transactions.getTransactions({
                ...args.input,
                companyId: context.user!.companyId,
                userId: context.user!.userId
            }, args.skip, args.limit),

        myTransactionById: async (parent, args, context) =>
            context.dataSources.transactions.findOneById(args.id)
    },

    Mutation: {
        createTransaction: async (parent, args, context) => {
            return {
                transaction: await context.dataSources.transactions.createTransaction(args.input)
            };
        },

        updateTransaction: async (parent, args, context) => {
            const transaction = await context.dataSources.transactions.findOneById(args.id);

            if (!transaction) {
                throw new Error('Transaction is missing');
            }

            const updatedTransaction = await context.dataSources.transactions.updateTransaction(args.id, args.input);

            return {
                transaction: updatedTransaction
            };
        },

        deleteTransaction: async (parent, args, context) => {
            const transaction = await context.dataSources.transactions.findOneById(args.id);

            if (!transaction) {
                throw new Error('Transaction is missing');
            }

            await context.dataSources.transactions.deleteTransaction(args.id);

            return {
                transaction: {
                    id: args.id
                }
            };
        }
    },

    Transaction: {
        id: parent => parent._id.toString(),
        user: async (parent) => {
            return {
                id: parent.userId,
                companyId: parent.companyId
            };
        },
        wallet: async (parent) => {
            return {
                id: parent.walletId,
                user : {
                    id: parent.userId,
                    companyId: parent.companyId
                },
                assetCode: parent.asset
            };
        }
    }

};

export default resolvers;