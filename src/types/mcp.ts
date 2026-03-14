import { z } from 'zod';

export interface SessionTokens {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface Session {
  id: string;
  tenantId: string;
  tenantName: string;
  environmentId: string;
  environmentName: string;
  apiHost: string;
  frontendUrl: string;
  clientId: string;
  tokens: SessionTokens;
  user: {
    id: string;
    email?: string;
    role?: string;
    timezone: string;
  };
  lastUsed: string;
}

export interface AuthContext {
  session: Session;
  isValid: boolean;
}

export interface ToolContext {
  sessionManager: {
    createSession: (params?: LoginParams) => Promise<Session>;
    switchEnvironment: (environmentId: string) => Promise<Session>;
    getCurrentContext: () => Promise<AuthContext | null>;
    getCurrentSession: () => Session | null;
    getAllSessions: () => Session[];
    logout: (sessionId?: string) => void;
  };
  apiClient: {
    setSession: (session: Session) => void;
  };
  getSession: () => Promise<Session>;
}

export const LoginParamsSchema = z.object({
  accountName: z.string().min(1).optional().describe('Company account name to search before login. Example: 4success'),
  tenantId: z.string().min(1).optional().describe('Tenant UUID to resolve the company directly when account name is not enough.'),
}).strict();

export type LoginParams = z.infer<typeof LoginParamsSchema>;

export const SwitchEnvironmentParamsSchema = z.object({
  environmentId: z.string().min(1).describe('Target environment UUID'),
});

export const LogoutParamsSchema = z.object({
  sessionId: z.string().optional(),
});

export const PaginationParamsSchema = z.object({
  current: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
});

export const AutomationListParamsSchema = PaginationParamsSchema.extend({
  name: z.string().optional(),
  status: z.string().optional(),
}).strict();

export const PackageListParamsSchema = PaginationParamsSchema.extend({
  name: z.string().optional(),
  description: z.string().optional(),
}).strict();

export const PackageIdParamsSchema = z.object({
  packageId: z.string().min(1),
}).strict();

export const SystemListParamsSchema = PaginationParamsSchema.extend({
  name: z.string().optional(),
  internalName: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  environment: z.string().optional(),
}).strict();

export const SystemIdParamsSchema = z.object({
  systemId: z.string().min(1),
}).strict();

export const ApiGatewayListParamsSchema = PaginationParamsSchema.extend({
  id: z.string().optional(),
  name: z.string().optional(),
  packageId: z.string().optional(),
  type: z.string().optional(),
}).strict();

export const ApiGatewayIdParamsSchema = z.object({
  apiGatewayId: z.string().min(1),
}).strict();

export const ApiKeyListParamsSchema = PaginationParamsSchema.extend({
  id: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
}).strict();

export const UsagePlanListParamsSchema = PaginationParamsSchema.extend({
  id: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
}).strict();

export const AuthClientListParamsSchema = PaginationParamsSchema.extend({
  description: z.string().optional(),
  clientId: z.string().optional(),
  status: z.string().optional(),
}).strict();

export const AuthClientIdParamsSchema = z.object({
  clientId: z.string().min(1),
}).strict();

export const AuthResourceServerListParamsSchema = PaginationParamsSchema.extend({
  Identifier: z.string().optional(),
  Name: z.string().optional(),
}).strict();

export const ApiGatewayLogListParamsSchema = PaginationParamsSchema.extend({
  apiGatewayId: z.string().min(1),
  uuid: z.string().optional(),
  status: z.string().optional(),
  httpMethod: z.string().optional(),
  resource: z.string().optional(),
  path: z.string().optional(),
  sourceIp: z.string().optional(),
}).strict();

export const ApiGatewayLogIdParamsSchema = z.object({
  apiGatewayId: z.string().min(1),
  timestamp: z.string().min(1),
  logId: z.string().min(1),
}).strict();

export const ApiGatewayAllLogsParamsSchema = PaginationParamsSchema.extend({
  startDate: z.string().min(1).describe('Start date/time. Example: 2026-03-13 or 2026-03-13 00:00:00'),
  endDate: z.string().min(1).describe('End date/time. Example: 2026-03-13 or 2026-03-13 23:59:59'),
  uuid: z.string().optional(),
  packageId: z.string().optional(),
  apiKey: z.string().optional(),
  client: z.string().optional(),
  apiId: z.string().optional(),
  httpMethod: z.string().optional(),
  resource: z.string().optional(),
  status: z.string().optional(),
}).strict();

export const DataStoreListParamsSchema = PaginationParamsSchema.extend({
  externalCode: z.string().optional().describe('Conversion table code used in automations.'),
  description: z.string().optional(),
  packageId: z.string().optional(),
}).strict();

export const DataStoreIdParamsSchema = z.object({
  dataStoreId: z.string().min(1),
}).strict();

export const DataStoreItemListParamsSchema = DataStoreIdParamsSchema.extend({
  current: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
  fromValue: z.string().optional(),
  toValue: z.string().optional(),
}).strict();

export const DataStoreItemIdParamsSchema = DataStoreIdParamsSchema.extend({
  itemId: z.string().min(1),
}).strict();

export const StatisticsDateRangeParamsSchema = z.object({
  startDate: z.string().min(1).optional().describe('Start date. Example: 2026-03-01'),
  endDate: z.string().min(1).optional().describe('End date. Example: 2026-03-31'),
}).strict();

export const HomeStatisticsParamsSchema = StatisticsDateRangeParamsSchema;

export const TenantExecutionStatisticsParamsSchema = StatisticsDateRangeParamsSchema;

export const AutomationIdParamsSchema = z.object({
  automationId: z.string().min(1),
}).strict();

export const ExecuteAutomationParamsSchema = AutomationIdParamsSchema.extend({
  payload: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
}).strict();

export const AutomationActionLogsParamsSchema = AutomationIdParamsSchema.extend({
  current: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
}).strict();

export const ExecutionListParamsSchema = PaginationParamsSchema.extend({
  startDate: z.string().min(1).describe('Start date/time. Example: 2026-03-13 or 2026-03-13 00:00:00'),
  endDate: z.string().min(1).describe('End date/time. Example: 2026-03-13 or 2026-03-13 23:59:59'),
  automationId: z.string().optional(),
  status: z.string().optional(),
  hideEmptySuccess: z.boolean().optional(),
}).strict();

export const ExecutionBaseParamsSchema = z.object({
  executionId: z.string().min(1),
  automationId: z.string().min(1),
  executionPeriod: z.string().min(1).describe('Execution period in YYYY-MM format. Example: 2026-03'),
}).strict();

export const ExecutionDetailsParamsSchema = ExecutionBaseParamsSchema;

export const ExecutionTracesParamsSchema = ExecutionBaseParamsSchema.extend({
  nextToken: z.string().optional(),
  cursor: z.string().optional(),
  pageSize: z.number().int().positive().max(500).optional(),
  message: z.string().optional(),
  level: z.string().optional(),
  status: z.string().optional(),
  timestampStart: z.string().optional(),
  timestampEnd: z.string().optional(),
}).strict();

export const ExecutionLogsParamsSchema = ExecutionBaseParamsSchema.extend({
  current: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(500).optional(),
  totalPreCalculated: z.number().int().nonnegative().optional(),
  lastEvaluatedKey: z.unknown().optional(),
}).strict();

export const FindExecutionParamsSchema = ExecutionListParamsSchema.extend({
  executionId: z.string().optional(),
}).strict();

export const TenantIdParamsSchema = z.object({
  tenantId: z.string().min(1),
}).strict();
