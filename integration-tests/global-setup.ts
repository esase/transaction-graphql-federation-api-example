import integrationConfig from './config';
import { waitUntil } from 'async-wait-until';
import startApp from '../src/app';
import connectRabbit from '@mycointainer.ou/services-common/rabbit';
import { connectDb } from '../src/shared/db';

export default async function() {
    try {
        // waiting until the `docker-compose` command is run
        await waitUntil(async () => {
            try {
                await connectRabbit(integrationConfig.rabbitMqUrl);
                await connectDb(integrationConfig.mongoUrl);
            }
            catch(error) {
                return false;
            }
            return true;
        });

        await startApp(integrationConfig);
    }
    catch (error) {
        console.error(error);
        process.exit(1);
    }
}
