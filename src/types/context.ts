import { Context } from '@mycointainer.ou/gql-common/types';
import { Transactions } from '../modules';

export interface ServiceContext extends Context {
    dataSources: {
        transactions: Transactions;
    }
}
