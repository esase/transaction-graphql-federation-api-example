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
    serviceName: 'transaction-api-example',
    server: {
        port: parseInt(env('SERVER_PORT', 3001))
    },
    rabbitMqUrl: env('RABBITMQ_URL'),
    isPlaygroundEnabled: env('IS_PLAYGROUND_ENABLED', 'true') === 'true',
    mongoUrl: env('MONGO_URL_TRANSACTIONS_SERVICE'),
    logLevel: env('LOG_LEVEL', 'debug'),
    get isDev(): boolean {
        return this.env === ENV_DEVELOPMENT;
    }
})) as Config;
