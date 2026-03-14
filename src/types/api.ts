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

export type ApiGatewayType = 'REST' | 'HTTP' | 'WEBSOCKET';

export type ApiLogStatus = 'SUCCESS' | 'FAIL';

export interface ApiGatewayStage {
  stageName?: string;
  [key: string]: unknown;
}

export interface UsagePlanKey {
  id?: string;
  name?: string;
  type?: string;
  value?: string;
  [key: string]: unknown;
}

export interface ApiGatewayUsagePlanBinding {
  stage: string;
  usagePlan: string;
  keys?: UsagePlanKey[];
}

export interface ApiGateway {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  type: ApiGatewayType;
  stages?: ApiGatewayStage[];
  usagePlans?: ApiGatewayUsagePlanBinding[];
  environmentId: string;
  packageId: string;
  policyArn?: string;
  repositoryUrl?: string;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
  [key: string]: unknown;
}

export interface ApiKey {
  id?: string;
  name?: string;
  description?: string;
  value?: string;
  enabled?: boolean;
  tags?: Record<string, string>;
  createdDate?: string;
  lastUpdatedDate?: string;
  [key: string]: unknown;
}

export interface UsagePlanThrottleSettings {
  burstLimit?: number;
  rateLimit?: number;
}

export interface UsagePlanQuotaSettings {
  limit?: number;
  offset?: number;
  period?: string;
}

export interface UsagePlan {
  id?: string;
  name?: string;
  description?: string;
  apiStages?: Array<Record<string, unknown>>;
  throttle?: UsagePlanThrottleSettings;
  quota?: UsagePlanQuotaSettings;
  apiKeys?: UsagePlanKey[];
  tags?: Record<string, string>;
  [key: string]: unknown;
}

export type AuthClientStatus = 'active' | 'revoked';

export interface AuthClient {
  clientId: string;
  description?: string;
  createdAt?: string;
  status?: AuthClientStatus;
  allowedScopes?: string[];
  idTokenValidity?: number;
  accessTokenValidity?: number;
  refreshTokenValidity?: number;
  issueRefreshToken?: boolean;
  [key: string]: unknown;
}

export interface AuthResourceServer {
  Identifier?: string;
  Name?: string;
  Scopes?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export interface ApiGatewayLog {
  uuid: string;
  tenantId?: string;
  apiId: string;
  packageId?: string;
  environmentId?: string;
  status?: ApiLogStatus;
  expirationPeriod?: number;
  path?: string;
  resource?: string;
  sourceIp?: string;
  httpMethod?: string;
  rawRequest?: Record<string, unknown>;
  requestPayload?: string;
  requestHeaders?: Record<string, string | undefined>;
  rawResponse?: Record<string, unknown>;
  responsePayload?: string;
  responseHeaders?: Record<string, string | boolean | number | undefined>;
  createdAt?: string;
  startTime?: string;
  endTime?: string;
  [key: string]: unknown;
}

export interface HomeStatisticsByPeriod {
  exec_period: string;
  total_executions: number;
  total_processed_items: number;
  total_fail: number;
  total_success: number;
  total_neutral: number;
}

export interface HomeStatisticsByDay {
  exec_date: string;
  total_executions: number;
  total_processed_items: number;
  total_fail: number;
  total_success: number;
  total_neutral: number;
}

export interface HomeStatisticsByIntegration {
  integration_name: string;
  total_executions: number;
  total_processed_items: number;
  total_fail: number;
  total_success: number;
  total_neutral: number;
}

export interface HomeStatisticsData {
  resumeByPeriod: HomeStatisticsByPeriod[];
  resumeByDay: HomeStatisticsByDay[];
  resumeByIntegration: HomeStatisticsByIntegration[];
}

export interface HomeStatisticsResponse {
  data: HomeStatisticsData;
}

export interface AutomationTenantStatistics {
  executedTimeInSeconds?: {
    total?: number;
    byEnvironment?: Record<string, number>;
    byAutomation?: Record<string, number>;
  };
  [key: string]: unknown;
}

export interface AutomationRecharge {
  uuid: string;
  secondsRecharged: number;
  secondsUsed: number;
  currency?: string;
  amout?: number;
  createdAt?: string;
  [key: string]: unknown;
}

export interface TenantExecutionStatisticsResponse {
  stats: {
    secondsIncluded: number;
    tenantTier: string;
    statistics?: AutomationTenantStatistics;
    [key: string]: unknown;
  };
  recharges: AutomationRecharge[];
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
