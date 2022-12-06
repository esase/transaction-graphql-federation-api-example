import { gql } from 'apollo-server-express';

export default gql`
    extend schema
        @link(url: "https://specs.apollo.dev/federation/v2.0",
        import: ["@key", "@shareable"])

    scalar DateTime
    scalar Date
    scalar NonNegativeInt
    scalar JSONObject
`;
