import log from '@mycointainer.ou/services-common/log';
export { Logger } from '@mycointainer.ou/services-common/log';
import config from '../config';

const logger = log.child(
    { service: config.serviceName },
    { level: config.logLevel }
);

export default logger;
