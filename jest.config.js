/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    resolver: require.resolve('jest-pnp-resolver'),
    preset: 'ts-jest',
    testEnvironment: 'node',
    verbose: true,
    rootDir:  './src',
    coverageThreshold: {
        global: {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100
        }
    }
};
