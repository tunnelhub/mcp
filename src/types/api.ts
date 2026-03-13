export interface TenantCognitoConfiguration {
  userPoolClientId: string;
  IdentityPoolId: string;
  UserPoolId: string;
}

export interface TenantPublicDetails {
  id: string;
  accountName: string;
  domain?: string;
  activateSAML: boolean;
  ssoProviderName?: string;
  cognito: {
    shared?: TenantCognitoConfiguration;
    dedicated?: TenantCognitoConfiguration;
  };
}

export interface Environment {
  uuid: string;
  name: string;
  description?: string;
  color?: string;
  isProductive?: boolean;
}

export interface CurrentUser {
  uuid: string;
  email?: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  tenantId: string;
  role?: string;
  timezone?: string;
  account_name?: string;
  company_name?: string;
  userPoolId?: string;
  userPoolClientId?: string;
  identityPoolId?: string;
}

export interface DataStore {
  uuid: string;
  tenantId: string;
  packageId?: string;
  externalCode: string;
  description?: string;
  limitedUsers?: string[];
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface DataStoreItem {
  uuid: string;
  tenantId?: string;
  dataStoreId: string;
  fromValue: string;
  toValue: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface GenericParameter {
  name: string;
  value: string;
}

export interface Package {
  uuid: string;
  tenantId: string;
  name: string;
  description?: string;
  parameters?: GenericParameter[];
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export type SystemType = 'DATABASE' | 'FTP' | 'LDAP' | 'MAIL' | 'HTTP' | 'SFTP' | 'SAPRFC' | 'SMB' | 'SOAP';

export interface System {
  uuid: string;
  tenantId: string;
  name: string;
  internalName: string;
  type: SystemType;
  description?: string;
  environment?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  parameters?: GenericParameter[] | Record<string, unknown>;
  logo?: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface Automation {
  uuid: string;
  name?: string;
  description?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface AutomationDeploy {
  deployId?: string;
  internalSequence?: number;
  createdAt?: string;
  createdBy?: string;
  message?: string;
  environmentId?: string;
  [key: string]: unknown;
}

export interface AutomationExecution {
  uuid?: string;
  executionId?: string;
  automationId?: string;
  automationName?: string;
  status?: string;
  createdAt?: string;
  startedAt?: string;
  finishedAt?: string;
  period?: string;
  executionPeriod?: string;
  execPeriod?: string;
  message?: string | null;
  processedItems?: number;
  totalFail?: number;
  totalNeutral?: number;
  totalSuccess?: number;
  useSqlite?: boolean;
  [key: string]: unknown;
}

export interface AutomationExecutionDetailsResponse {
  automation?: {
    uuid?: string;
    name?: string;
    description?: string;
    [key: string]: unknown;
  };
  execution?: AutomationExecution;
  traces?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export interface AutomationTraceResponse {
  items?: Array<Record<string, unknown>>;
  traces?: Array<Record<string, unknown>>;
  hasMore?: boolean;
  nextToken?: string;
  cursor?: string;
  total?: number;
  [key: string]: unknown;
}

export interface AutomationExecutionLogsResponse {
  data?: Array<Record<string, unknown>>;
  total?: number;
  LastEvaluatedKey?: unknown;
  [key: string]: unknown;
}

export interface ApiErrorResponse {
  error?: string;
  message?: string;
  statusCode?: number;
}
