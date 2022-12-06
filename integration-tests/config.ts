import config from '../src/config';

export default {
    ...config,
    rabbitMqUrl: 'amqp://localhost',
    mongoUrl: 'mongodb://localhost:27017/transactions'
};
