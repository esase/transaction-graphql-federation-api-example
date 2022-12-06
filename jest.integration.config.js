/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
const config = {
    resolver: require.resolve('jest-pnp-resolver'),
    preset: 'ts-jest',
    testEnvironment: 'node',
    verbose: true,
    bail: true,
    rootDir:  './integration-tests',
    globalSetup: '<rootDir>/global-setup.ts',
    globalTeardown: '<rootDir>/global-teardown.ts'
};

module.exports = config;
