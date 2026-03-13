import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import LZString from 'lz-string';
import type { z } from 'zod';
import type {
  ApiGateway,
  ApiGatewayLog,
  ApiKey,
  AuthClient,
  AuthResourceServer,
  UsagePlan,
} from '../../types/api.js';
import type { ToolContext } from '../../types/mcp.js';
import {
  ApiGatewayAllLogsParamsSchema,
  ApiGatewayIdParamsSchema,
  ApiGatewayListParamsSchema,
  ApiGatewayLogIdParamsSchema,
  ApiGatewayLogListParamsSchema,
  ApiKeyListParamsSchema,
  AuthClientIdParamsSchema,
  AuthClientListParamsSchema,
  AuthResourceServerListParamsSchema,
  UsagePlanListParamsSchema,
} from '../../types/mcp.js';
import { errorResult, requireSession, textResult } from '../../utils/error-handler.js';

type ListResponse<T> = {
  data?: T[];
  total?: number;
  success?: boolean;
};

function extractItems<T>(response: unknown): T[] {
  if (Array.isArray(response)) {
    return response as T[];
  }

  if (response && typeof response === 'object' && Array.isArray((response as ListResponse<T>).data)) {
    return (response as ListResponse<T>).data || [];
  }

  return [];
}

function summarizeApiGateway(item: ApiGateway): string {
  return [
    `API Gateway ID: ${item.id}`,
    `Name: ${item.name || 'n/a'}`,
    `Type: ${item.type || 'n/a'}`,
    `Package: ${item.packageId || 'n/a'}`,
    `Description: ${item.description || 'n/a'}`,
    `Repository URL: ${item.repositoryUrl || 'n/a'}`,
    `Stages: ${item.stages?.length ?? 0}`,
    `Usage Plans: ${item.usagePlans?.length ?? 0}`,
    `Created At: ${item.createdAt || 'n/a'}`,
    `Updated At: ${item.updatedAt || 'n/a'}`,
  ].join('\n');
}

function summarizeApiGatewayList(items: ApiGateway[]): string {
  if (items.length === 0) {
    return 'No API Gateways found.';
  }

  return items
    .slice(0, 15)
    .map((item) => `${item.name || item.id} | ${item.type || 'n/a'} | package=${item.packageId || 'n/a'} | ${item.id}`)
    .join('\n');
}

function summarizeApiKeyList(items: ApiKey[]): string {
  if (items.length === 0) {
    return 'No API keys found.';
  }

  return items
    .slice(0, 15)
    .map((item) => `${item.name || item.id || 'n/a'} | enabled=${String(item.enabled ?? 'n/a')} | ${item.id || 'n/a'}`)
    .join('\n');
}

function summarizeUsagePlanList(items: UsagePlan[]): string {
  if (items.length === 0) {
    return 'No usage plans found.';
  }

  return items
    .slice(0, 15)
    .map((item) => `${item.name || item.id || 'n/a'} | ${item.description || 'n/a'} | keys=${item.apiKeys?.length ?? 0}`)
    .join('\n');
}

function summarizeAuthClient(item: AuthClient): string {
  return [
    `Client ID: ${item.clientId}`,
    `Description: ${item.description || 'n/a'}`,
    `Status: ${item.status || 'n/a'}`,
    `Allowed Scopes: ${item.allowedScopes?.join(', ') || 'n/a'}`,
    `Access Token Validity: ${String(item.accessTokenValidity ?? 'n/a')}`,
    `ID Token Validity: ${String(item.idTokenValidity ?? 'n/a')}`,
    `Refresh Token Validity: ${String(item.refreshTokenValidity ?? 'n/a')}`,
    `Issue Refresh Token: ${String(item.issueRefreshToken ?? 'n/a')}`,
    `Created At: ${item.createdAt || 'n/a'}`,
  ].join('\n');
}

function summarizeAuthClientList(items: AuthClient[]): string {
  if (items.length === 0) {
    return 'No auth clients found.';
  }

  return items
    .slice(0, 15)
    .map((item) => `${item.description || item.clientId} | ${item.status || 'n/a'} | ${item.clientId}`)
    .join('\n');
}

function summarizeAuthResourceServerList(items: AuthResourceServer[]): string {
  if (items.length === 0) {
    return 'No auth resource servers found.';
  }

  return items
    .slice(0, 15)
    .map((item) => `${item.Name || item.Identifier || 'n/a'} | scopes=${item.Scopes?.length ?? 0} | ${item.Identifier || 'n/a'}`)
    .join('\n');
}

function summarizeApiGatewayLog(item: ApiGatewayLog): string {
  return [
    `Log ID: ${item.uuid}`,
    `API Gateway ID: ${item.apiId}`,
    `Status: ${item.status || 'n/a'}`,
    `HTTP Method: ${item.httpMethod || 'n/a'}`,
    `Path: ${item.path || 'n/a'}`,
    `Resource: ${item.resource || 'n/a'}`,
    `Source IP: ${item.sourceIp || 'n/a'}`,
    `Created At: ${item.createdAt || 'n/a'}`,
    `Start Time: ${item.startTime || 'n/a'}`,
    `End Time: ${item.endTime || 'n/a'}`,
    `HTTP Status Code: ${String((item.rawResponse as { statusCode?: unknown } | undefined)?.statusCode ?? 'n/a')}`,
  ].join('\n');
}

function summarizeApiGatewayLogList(items: ApiGatewayLog[]): string {
  if (items.length === 0) {
    return 'No API Gateway logs found.';
  }

  return items
    .slice(0, 15)
    .map((item) => `${item.uuid} | ${item.status || 'n/a'} | ${item.httpMethod || 'n/a'} ${item.path || item.resource || 'n/a'} | ${item.createdAt || 'n/a'}`)
    .join('\n');
}

function decodeCompressedPayload(payload: string | undefined): unknown {
  if (!payload) {
    return undefined;
  }

  const decompressed = LZString.decompressFromUTF16(payload);
  if (!decompressed || decompressed === 'null') {
    return undefined;
  }

  try {
    return JSON.parse(JSON.parse(decompressed));
  } catch {
    try {
      return JSON.parse(decompressed);
    } catch {
      return decompressed;
    }
  }
}

function stringifyPayload(payload: unknown): string {
  if (payload === undefined) {
    return 'n/a';
  }

  if (typeof payload === 'string') {
    return payload;
  }

  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

const listApiGatewaysTool = {
  name: 'list_api_gateways_tunnelhub',
  schema: {
    title: 'List API Gateways',
    description: 'List API Gateway definitions from api-gateway-service using the current environment.',
    inputSchema: ApiGatewayListParamsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  handler: async (params: z.infer<typeof ApiGatewayListParamsSchema>, context: ToolContext) => {
    try {
      const session = await requireSession(context);
      context.apiClient.setSession(session);
      const apiClient = context.apiClient as unknown as {
        listApiGateways: (params: Record<string, unknown>) => Promise<unknown>;
      };
      const response = await apiClient.listApiGateways(params as Record<string, unknown>);
      const items = extractItems<ApiGateway>(response);

      return textResult(`API Gateways:\n\n${summarizeApiGatewayList(items)}\n\nReturned: ${items.length}`, {
        apiGateways: items,
        rawResponse: response,
      });
    } catch (error) {
      return errorResult(error);
    }
  },
};

const getApiGatewayTool = {
  name: 'get_api_gateway_tunnelhub',
  schema: {
    title: 'Get API Gateway',
    description: 'Get read-only details for one API Gateway by id.',
    inputSchema: ApiGatewayIdParamsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  handler: async (params: z.infer<typeof ApiGatewayIdParamsSchema>, context: ToolContext) => {
    try {
      const session = await requireSession(context);
      context.apiClient.setSession(session);
      const apiClient = context.apiClient as unknown as {
        getApiGateway: (apiGatewayId: string) => Promise<ApiGateway>;
      };
      const item = await apiClient.getApiGateway(params.apiGatewayId);
      return textResult(`API Gateway details:\n\n${summarizeApiGateway(item)}`, item);
    } catch (error) {
      return errorResult(error);
    }
  },
};

const listApiKeysTool = {
  name: 'list_api_keys_tunnelhub',
  schema: {
    title: 'List API Keys',
    description: 'List API keys from api-gateway-service using the current environment. Sensitive values may be included by backend.',
    inputSchema: ApiKeyListParamsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  handler: async (params: z.infer<typeof ApiKeyListParamsSchema>, context: ToolContext) => {
    try {
      const session = await requireSession(context);
      context.apiClient.setSession(session);
      const apiClient = context.apiClient as unknown as {
        listApiKeys: (params: Record<string, unknown>) => Promise<unknown>;
      };
      const response = await apiClient.listApiKeys(params as Record<string, unknown>);
      const items = extractItems<ApiKey>(response);

      return textResult(`API Keys:\n\n${summarizeApiKeyList(items)}\n\nReturned: ${items.length}\nNote: backend responses may include actual API key values.`, {
        apiKeys: items,
        rawResponse: response,
      });
    } catch (error) {
      return errorResult(error);
    }
  },
};

const listUsagePlansTool = {
  name: 'list_usage_plans_tunnelhub',
  schema: {
    title: 'List Usage Plans',
    description: 'List API Gateway usage plans from api-gateway-service using the current environment.',
    inputSchema: UsagePlanListParamsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  handler: async (params: z.infer<typeof UsagePlanListParamsSchema>, context: ToolContext) => {
    try {
      const session = await requireSession(context);
      context.apiClient.setSession(session);
      const apiClient = context.apiClient as unknown as {
        listUsagePlans: (params: Record<string, unknown>) => Promise<unknown>;
      };
      const response = await apiClient.listUsagePlans(params as Record<string, unknown>);
      const items = extractItems<UsagePlan>(response);

      return textResult(`Usage Plans:\n\n${summarizeUsagePlanList(items)}\n\nReturned: ${items.length}`, {
        usagePlans: items,
        rawResponse: response,
      });
    } catch (error) {
      return errorResult(error);
    }
  },
};

const listAuthClientsTool = {
  name: 'list_auth_clients_tunnelhub',
  schema: {
    title: 'List Auth Clients',
    description: 'List API auth clients from api-gateway-service using the current environment.',
    inputSchema: AuthClientListParamsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  handler: async (params: z.infer<typeof AuthClientListParamsSchema>, context: ToolContext) => {
    try {
      const session = await requireSession(context);
      context.apiClient.setSession(session);
      const apiClient = context.apiClient as unknown as {
        listAuthClients: (params: Record<string, unknown>) => Promise<unknown>;
      };
      const response = await apiClient.listAuthClients(params as Record<string, unknown>);
      const items = extractItems<AuthClient>(response);

      return textResult(`Auth clients:\n\n${summarizeAuthClientList(items)}\n\nReturned: ${items.length}`, {
        authClients: items,
        rawResponse: response,
      });
    } catch (error) {
      return errorResult(error);
    }
  },
};

const getAuthClientTool = {
  name: 'get_auth_client_tunnelhub',
  schema: {
    title: 'Get Auth Client',
    description: 'Get read-only details for one API auth client by client id.',
    inputSchema: AuthClientIdParamsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  handler: async (params: z.infer<typeof AuthClientIdParamsSchema>, context: ToolContext) => {
    try {
      const session = await requireSession(context);
      context.apiClient.setSession(session);
      const apiClient = context.apiClient as unknown as {
        getAuthClient: (clientId: string) => Promise<AuthClient>;
      };
      const item = await apiClient.getAuthClient(params.clientId);
      return textResult(`Auth client details:\n\n${summarizeAuthClient(item)}`, item);
    } catch (error) {
      return errorResult(error);
    }
  },
};

const listAuthResourceServersTool = {
  name: 'list_auth_resource_servers_tunnelhub',
  schema: {
    title: 'List Auth Resource Servers',
    description: 'List Cognito resource servers exposed by api-gateway-service.',
    inputSchema: AuthResourceServerListParamsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  handler: async (params: z.infer<typeof AuthResourceServerListParamsSchema>, context: ToolContext) => {
    try {
      const session = await requireSession(context);
      context.apiClient.setSession(session);
      const apiClient = context.apiClient as unknown as {
        listAuthResourceServers: (params: Record<string, unknown>) => Promise<unknown>;
      };
      const response = await apiClient.listAuthResourceServers(params as Record<string, unknown>);
      const items = extractItems<AuthResourceServer>(response);

      return textResult(`Auth resource servers:\n\n${summarizeAuthResourceServerList(items)}\n\nReturned: ${items.length}`, {
        resourceServers: items,
        rawResponse: response,
      });
    } catch (error) {
      return errorResult(error);
    }
  },
};

const listApiGatewayLogsTool = {
  name: 'list_api_gateway_logs_tunnelhub',
  schema: {
    title: 'List API Gateway Logs',
    description: 'List logs for one API Gateway by id.',
    inputSchema: ApiGatewayLogListParamsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  handler: async (params: z.infer<typeof ApiGatewayLogListParamsSchema>, context: ToolContext) => {
    try {
      const session = await requireSession(context);
      context.apiClient.setSession(session);
      const apiClient = context.apiClient as unknown as {
        listApiGatewayLogs: (apiGatewayId: string, params: Record<string, unknown>) => Promise<unknown>;
      };
      const { apiGatewayId, ...listParams } = params;
      const response = await apiClient.listApiGatewayLogs(apiGatewayId, listParams as Record<string, unknown>);
      const items = extractItems<ApiGatewayLog>(response);

      return textResult(`API Gateway logs for ${apiGatewayId}:\n\n${summarizeApiGatewayLogList(items)}\n\nReturned: ${items.length}`, {
        logs: items,
        rawResponse: response,
      });
    } catch (error) {
      return errorResult(error);
    }
  },
};

const getApiGatewayLogTool = {
  name: 'get_api_gateway_log_tunnelhub',
  schema: {
    title: 'Get API Gateway Log',
    description: 'Get one API Gateway log entry and decode compressed request and response payloads when possible.',
    inputSchema: ApiGatewayLogIdParamsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  handler: async (params: z.infer<typeof ApiGatewayLogIdParamsSchema>, context: ToolContext) => {
    try {
      const session = await requireSession(context);
      context.apiClient.setSession(session);
      const apiClient = context.apiClient as unknown as {
        getApiGatewayLog: (apiGatewayId: string, timestamp: string, logId: string) => Promise<ApiGatewayLog>;
      };
      const item = await apiClient.getApiGatewayLog(params.apiGatewayId, params.timestamp, params.logId);
      const decodedRequestPayload = decodeCompressedPayload(item.requestPayload);
      const decodedResponsePayload = decodeCompressedPayload(item.responsePayload);

      return textResult(
        `API Gateway log details:\n\n${summarizeApiGatewayLog(item)}\n\nDecoded request payload:\n${stringifyPayload(decodedRequestPayload)}\n\nDecoded response payload:\n${stringifyPayload(decodedResponsePayload)}`,
        {
          ...item,
          decodedRequestPayload,
          decodedResponsePayload,
        },
      );
    } catch (error) {
      return errorResult(error);
    }
  },
};

const listAllApiGatewayLogsTool = {
  name: 'list_all_api_gateway_logs_tunnelhub',
  schema: {
    title: 'List All API Gateway Logs',
    description: 'List API Gateway logs across the current environment for a required date range.',
    inputSchema: ApiGatewayAllLogsParamsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  handler: async (params: z.infer<typeof ApiGatewayAllLogsParamsSchema>, context: ToolContext) => {
    try {
      const session = await requireSession(context);
      context.apiClient.setSession(session);
      const apiClient = context.apiClient as unknown as {
        listAllApiGatewayLogs: (params: z.infer<typeof ApiGatewayAllLogsParamsSchema>) => Promise<unknown>;
      };
      const response = await apiClient.listAllApiGatewayLogs(params);
      const items = extractItems<ApiGatewayLog>(response);

      return textResult(`API Gateway logs:\n\n${summarizeApiGatewayLogList(items)}\n\nReturned: ${items.length}`, {
        logs: items,
        rawResponse: response,
      });
    } catch (error) {
      return errorResult(error);
    }
  },
};

export function registerApiGatewayTools(server: McpServer, context: unknown): void {
  const toolContext = context as ToolContext;

  server.registerTool(listApiGatewaysTool.name, listApiGatewaysTool.schema, (params) => listApiGatewaysTool.handler(params, toolContext));
  server.registerTool(getApiGatewayTool.name, getApiGatewayTool.schema, (params) => getApiGatewayTool.handler(params, toolContext));
  server.registerTool(listApiKeysTool.name, listApiKeysTool.schema, (params) => listApiKeysTool.handler(params, toolContext));
  server.registerTool(listUsagePlansTool.name, listUsagePlansTool.schema, (params) => listUsagePlansTool.handler(params, toolContext));
  server.registerTool(listAuthClientsTool.name, listAuthClientsTool.schema, (params) => listAuthClientsTool.handler(params, toolContext));
  server.registerTool(getAuthClientTool.name, getAuthClientTool.schema, (params) => getAuthClientTool.handler(params, toolContext));
  server.registerTool(listAuthResourceServersTool.name, listAuthResourceServersTool.schema, (params) => listAuthResourceServersTool.handler(params, toolContext));
  server.registerTool(listApiGatewayLogsTool.name, listApiGatewayLogsTool.schema, (params) => listApiGatewayLogsTool.handler(params, toolContext));
  server.registerTool(getApiGatewayLogTool.name, getApiGatewayLogTool.schema, (params) => getApiGatewayLogTool.handler(params, toolContext));
  server.registerTool(listAllApiGatewayLogsTool.name, listAllApiGatewayLogsTool.schema, (params) => listAllApiGatewayLogsTool.handler(params, toolContext));
}
