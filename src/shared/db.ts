import { MongoClient } from 'mongodb';

export const connectDb = async (mongoUrl: string) => {
    const client = new MongoClient(mongoUrl);
    await client.connect();

    return client;
};
