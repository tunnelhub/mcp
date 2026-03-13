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
    createSession: () => Promise<Session>;
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

export const LoginParamsSchema = z.object({}).strict();

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

export const AutomationIdParamsSchema = z.object({
  automationId: z.string().min(1),
});

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
