import { gql } from 'apollo-server-express';

export default gql`
    enum TransactionAssetType {
        CRYPTO
        FIAT
    }

    enum TransactionSubType {
        STAKING
        CASHBACK
        MINING
        SUBSCRIPTION
        EXCHANGE
        WITHDRAW
        BUY
        SELL
        ADD
        SUBTRACT
    }

    enum TransactionType {
        DEPOSIT
        WITHDRAW
        EXCHANGE
        FEE
        REWARD
        MANUAL
    }

    enum TransactionStatus {
        """Transaction successfully completed."""
        COMPLETED

        """Transaction is not processed yet."""
        PENDING

        """Transaction is cancelled."""
        CANCELLED

        """Transaction is failed."""
        FAILED
    }

    type User @key(fields: "id companyId") {
        id: ID!
 
        companyId: ID!
    }
 
    type Wallet @key(fields: "id") {
        id: ID!

        user: User! @shareable

        assetCode: String! @shareable
    }

    """Information about the transaction."""
    type Transaction @key(fields: "id") {
        """Transaction uniq id."""
        id: ID!

        """Transaction owner."""
        user: User!

        """Transaction wallet."""
        wallet: Wallet!

        """Transaction status."""
        status: TransactionStatus!

        """Transaction creation timestamp."""
        timestamp: DateTime!

        """Transaction asset like: BTC, ETH, TRN etc."""
        asset: String!

        """Transaction asset type like: FIAT, CRYPTO etc."""
        assetType: TransactionAssetType!

        """Transaction type."""
        type: TransactionType!

        """Transaction sub type."""
        subType: TransactionSubType
  
        """Transaction amount."""
        amount: Float!

        """Transaction amount equivalent in EUR."""
        euroAmount: Float!

        """External transaction id."""
        externalId: String!

        """Transaction fee."""
        fee: Float!

        """Transaction destination or address."""
        destination: String!

        """Transaction creation date."""
        createdAt: DateTime!

        """Transaction updating date."""
        updatedAt: DateTime!

        """Transaction comment."""
        comment: String

        """Transaction annual percentage yield %."""
        annualPercentageYield: Int

        """Transaction source address or addresses."""
        sourceAddress: String
    }

    input MyTransactionsInput {
        """Transaction timestamp."""
        timestamp: Int

        """Transaction start date."""
        startDate: Date

        """Transaction end date."""
        endDate: Date

        """Transaction type."""
        type: TransactionType

        """Transaction sub type."""
        subType: TransactionSubType
 
        """Transaction status."""
        status: TransactionStatus

        """Transaction asset like: BTC, ETH, TRN etc."""
        asset: String

        """Transaction asset type like: FIAT, CRYPTO etc."""
        assetType: TransactionAssetType

        """External transaction id."""
        externalId: String
    }

    input TransactionsInput {
        """Transaction timestamp."""
        timestamp: Int

        """Transaction start date."""
        startDate: Date

        """Transaction end date."""
        endDate: Date

        """Transaction type."""
        type: TransactionType

        """Transaction sub type."""
        subType: TransactionSubType

        """Transaction status."""
        status: TransactionStatus

        """Transaction asset like: BTC, ETH, TRN etc."""
        asset: String
        
        """Transaction asset type like: FIAT, CRYPTO etc."""
        assetType: TransactionAssetType

        """Company id."""
        companyId: ID

        """Company user id."""
        userId: ID

        """Wallet id."""
        walletId: ID

        """External transaction id."""
        externalId: String
    }

    """
    Transaction list response
    """
    type TransactionsResponse {
        """
        Slice of transactions list based on provided limit and offset (skip)
        """
        items: [Transaction!]!

        """
        Total number of transactions
        """
        totalCount: Int!
    }

    """
    My transaction list response
    """
    type MyTransactionsResponse {
        """
        Slice of transactions list based on provided limit and offset (skip)
        """
        items: [Transaction!]!

        """
        Total number of transactions
        """
        totalCount: Int!
    }

    type Query {
        """Fetch a paginated list of transactions based on a filter."""
        transactions(skip: NonNegativeInt, limit: NonNegativeInt, input: TransactionsInput): TransactionsResponse!

        """Fetch a specific transaction."""
        transactionById(id: ID!): Transaction

        """Fetch a user specific paginated list of transactions based on a filter."""
        myTransactions(skip: NonNegativeInt, limit: NonNegativeInt, input: MyTransactionsInput): MyTransactionsResponse!

        """Fetch a user specific transaction."""
        myTransactionById(id: ID!): Transaction
    }

    type DeletedTransaction {
        """Transaction uniq id."""
        id: ID!
    }

    """Delete transaction response."""
    type DeleteTransactionResponse {
        transaction: DeletedTransaction!
    }

    """Create transaction response."""
    type CreateTransactionResponse {
        transaction: Transaction!
    }

    input CreateTransactionInput {
        """Company id."""
        companyId: ID!

        """Company user id."""
        userId: ID!

        """Wallet id."""
        walletId: ID!

        """Transaction status."""
        status: TransactionStatus!

        """Transaction creation timestamp."""
        timestamp: DateTime!

        """Transaction asset like: BTC, ETH, TRN etc."""
        asset: String!

        """Transaction asset type like: FIAT, CRYPTO etc."""
        assetType: TransactionAssetType!

        """Transaction status."""
        type: TransactionType!

        """Transaction sub type."""
        subType: TransactionSubType
 
        """Transaction amount."""
        amount: Float!

        """Transaction amount equivalent in EUR."""
        euroAmount: Float!

        """External transaction id."""
        externalId: String!

        """Transaction fee."""
        fee: Float!

        """Transaction destination or address."""
        destination: String!

        """Transaction comment."""
        comment: String

        """Transaction annual percentage yield %."""
        annualPercentageYield: Int

        """Transaction source address or addresses."""
        sourceAddress: String
    }

    """Update transaction response."""
    type UpdateTransactionResponse {
        transaction: Transaction!
    }

    input UpdateTransactionInput {
        """Company id."""
        companyId: ID

        """Company user id."""
        userId: ID

        """Wallet id."""
        walletId: ID!

        """Transaction status."""
        status: TransactionStatus

        """Transaction creation timestamp."""
        timestamp: DateTime

        """Transaction asset like: BTC, ETH, TRN etc."""
        asset: String

        """Transaction asset type like: FIAT, CRYPTO etc."""
        assetType: TransactionAssetType

        """Transaction status."""
        type: TransactionType

        """Transaction sub type."""
        subType: TransactionSubType
 
        """Transaction amount."""
        amount: Float

        """Transaction amount equivalent in EUR."""
        euroAmount: Float

        """External transaction id."""
        externalId: String

        """Transaction fee."""
        fee: Float

        """Transaction destination or address."""
        destination: String

        """Transaction comment."""
        comment: String

        """Transaction annual percentage yield %."""
        annualPercentageYield: Int

        """Transaction source address or addresses."""
        sourceAddress: String
    }

    type Mutation {
        """Create a new transaction."""
        createTransaction(input: CreateTransactionInput!): CreateTransactionResponse!

        """Update an existing transaction."""
        updateTransaction(id: ID!, input: UpdateTransactionInput!): UpdateTransactionResponse!

        """Delete a specific transaction."""
        deleteTransaction(id: ID!): DeleteTransactionResponse!
    }
`;
