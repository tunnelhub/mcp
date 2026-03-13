// DynamoDB entity types based on the provided schema

export type DynamoDBEntityType = 
  | 'TENANT'
  | 'USER'
  | 'ENVIRONMENT'
  | 'INTEGRATION'
  | 'INTEGRATION_VERSION'
  | 'INTEGRATION_EXECUTION'
  | 'INTEGRATION_EXECUTION_LOG'
  | 'INTEGRATION_DELTA'
  | 'AUTOMATION_ACTION_LOG'
  | 'APIGATEWAY'
  | 'APIGATEWAY_LOG'
  | 'API_CLIENT'
  | 'PACKAGE'
  | 'SYSTEM'
  | 'DATASTORE'
  | 'DATASTORE_ITEM'
  | 'SEQUENCE'
  | 'BACKGROUND_PROCESSING'
  | 'WSCONNECTION'
  | 'USER_GOOGLE_CREDENTIALS'
  | 'INTEGRATION_TRANSPORT'
  | 'INTEGRATION_CREDITS'
  | 'INTEGRATION_EXECUTION_MEASUREMENTS'
  | 'SQLITE_STORAGE'
  | 'INBOUND_INBOX_TRIGGER';

export interface DynamoDBKey {
  PK: string;  // Partition Key
  SK: string;  // Sort Key
}

export interface DynamoDBEntity extends DynamoDBKey {
  dynamoLogicalEntityName: DynamoDBEntityType;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

// Key patterns for different entities
export const DynamoDBKeyPatterns = {
  // Tenant
  tenant: (tenantId: string) => ({
    PK: `TENANT#${tenantId}`,
    SK: '#METADATA#'
  }),

  // User
  user: (tenantId: string, userId: string) => ({
    PK: `TENANT#${tenantId}`,
    SK: `USER#${userId}`
  }),

  // Environment
  environment: (tenantId: string, environmentId: string) => ({
    PK: `TENANT#${tenantId}`,
    SK: `ENVIRONMENT#${environmentId}`
  }),

  // Integration
  integration: (tenantId: string, environmentId: string, integrationId: string) => ({
    PK: `TENANT#${tenantId}#ENVIRONMENT#${environmentId}`,
    SK: `INTEGRATION#${integrationId}`
  }),

  // Integration Version
  integrationVersion: (tenantId: string, integrationId: string, environmentId: string, version: number) => ({
    PK: `TENANT#${tenantId}#INTEGRATION#${integrationId}#ENVIRONMENT#${environmentId}`,
    SK: `REVISION#v${version}`
  }),

  // Integration Execution
  integrationExecution: (tenantId: string, period: string, environmentId: string, integrationId: string, execId: string) => ({
    PK: `TENANT#${tenantId}#EXEC#${period}#ENVIRONMENT#${environmentId}`,
    SK: `INTEGRATION#${integrationId}#EXEC#${execId}`
  }),

  // API Gateway
  apiGateway: (tenantId: string, environmentId: string, apiGatewayId: string) => ({
    PK: `TENANT#${tenantId}#ENVIRONMENT#${environmentId}`,
    SK: `APIGATEWAY#${apiGatewayId}`
  }),

  // API Client
  apiClient: (tenantId: string, environmentId: string, clientId: string) => ({
    PK: `TENANT#${tenantId}#ENVIRONMENT#${environmentId}`,
    SK: `API_CLIENT#${clientId}`
  }),

  // Package
  package: (tenantId: string, environmentId: string, packageId: string) => ({
    PK: `TENANT#${tenantId}#ENVIRONMENT#${environmentId}`,
    SK: `PACKAGE#${packageId}`
  }),

  // System
  system: (tenantId: string, environmentId: string, systemId: string) => ({
    PK: `TENANT#${tenantId}#ENVIRONMENT#${environmentId}`,
    SK: `SYSTEM#${systemId}`
  })
};