import { Resolvers } from '../../types/generated-types';
import { DateResolver, DateTimeResolver, NonNegativeIntResolver, JSONObjectResolver } from 'graphql-scalars';

const resolvers: Resolvers = {
    Date: DateResolver,
    DateTime: DateTimeResolver,
    NonNegativeInt: NonNegativeIntResolver,
    JSONObject: JSONObjectResolver
};

export default resolvers;