import baseTypeDefs from './base/typeDefs';
import baseResolvers from './base/resolvers';
import transactionsTypeDefs from './transactions/typeDefs';
import transactionsResolvers from './transactions/resolvers';
import transactionsAuth from './transactions/auth';

// collect modules  schemas
export const subgraphSchema = [
    { typeDefs: baseTypeDefs, resolvers: baseResolvers},
    { typeDefs: transactionsTypeDefs, resolvers: transactionsResolvers}
];

// collect modules auth
export const auth = {
    Query: {
        ...transactionsAuth.Query
    },
    Mutation: {
        ...transactionsAuth.Mutation
    }
};

export * from './transactions/data-source';
