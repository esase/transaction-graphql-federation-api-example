import config from '@mycointainer.ou/services-common/config';

const ENV_DEVELOPMENT = 'development';

export interface Config {
    env: string;
    serviceName: string;
    server: {
        port: number;
    },
    isPlaygroundEnabled: boolean;
    rabbitMqUrl: string;
    mongoUrl: string;
    logLevel: string;
    isDev: boolean;
}

export default config(env => Object.freeze({
    env: env('NODE_ENV', ENV_DEVELOPMENT),
    serviceName: 'myc2-transaction-api',
    server: {
        port: parseInt(env('SERVER_PORT', 3001))
    },
    rabbitMqUrl: env('RABBITMQ_URL', 'amqp://localhost'),
    isPlaygroundEnabled: env('IS_PLAYGROUND_ENABLED', 'true') === 'true',
    mongoUrl: env('MONGO_URL_TRANSACTIONS_SERVICE', 'mongodb+srv://v2_cluster_tx:TmwsGGwcK73fE8p1@transactions.zqnp7.mongodb.net/transactions'),
    logLevel: env('LOG_LEVEL', 'debug'),
    get isDev(): boolean {
        return this.env === ENV_DEVELOPMENT;
    }
})) as Config;
