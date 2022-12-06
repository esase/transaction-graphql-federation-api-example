import { MongoClient } from 'mongodb';

export const purifyDb = async (client: MongoClient, collections: string[]) => {
    for (const collection of collections) {
        await client.db().collection(collection).deleteMany({});
    }
};
