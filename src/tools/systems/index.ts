import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { z } from 'zod';
import type { System } from '../../types/api.js';
import type { ToolContext } from '../../types/mcp.js';
import { SystemIdParamsSchema, SystemListParamsSchema } from '../../types/mcp.js';
import { errorResult, requireSession, textResult } from '../../utils/error-handler.js';

function extractSystems(response: unknown): System[] {
  if (Array.isArray(response)) {
    return response as System[];
  }

  if (response && typeof response === 'object' && Array.isArray((response as { data?: unknown[] }).data)) {
    return (((response as { data?: unknown[] }).data || []) as System[]);
  }

  return [];
}

function summarizeSystem(item: System): string {
  return [
    `System ID: ${item.uuid}`,
    `Name: ${item.name || 'n/a'}`,
    `Internal Name: ${item.internalName || 'n/a'}`,
    `Type: ${item.type || 'n/a'}`,
    `Status: ${item.status || 'n/a'}`,
    `Environment: ${item.environment || 'n/a'}`,
    `Description: ${item.description || 'n/a'}`,
    `Created At: ${item.createdAt || 'n/a'}`,
    `Updated At: ${item.updatedAt || 'n/a'}`,
  ].join('\n');
}

function summarizeSystemList(items: System[]): string {
  if (items.length === 0) {
    return 'No systems found.';
  }

  return items
    .slice(0, 15)
    .map((item) => `${item.name || item.uuid} | ${item.type || 'n/a'} | ${item.status || 'n/a'} | ${item.uuid}`)
    .join('\n');
}

const listSystemsTool = {
  name: 'list_systems_tunnelhub',
  schema: {
    title: 'List TunnelHub Systems',
    description: 'List systems from integrations-service using the current environment.',
    inputSchema: SystemListParamsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  handler: async (params: z.infer<typeof SystemListParamsSchema>, context: ToolContext) => {
    try {
      const session = await requireSession(context);
      context.apiClient.setSession(session);
      const apiClient = context.apiClient as unknown as {
        listSystems: (params: Record<string, unknown>) => Promise<unknown>;
      };
      const response = await apiClient.listSystems(params as Record<string, unknown>);
      const items = extractSystems(response);
      const summary = summarizeSystemList(items);

      return textResult(`Systems:\n\n${summary}\n\nReturned: ${items.length}`, {
        systems: items,
        rawResponse: response,
      });
    } catch (error) {
      return errorResult(error);
    }
  },
};

const getSystemTool = {
  name: 'get_system_tunnelhub',
  schema: {
    title: 'Get TunnelHub System',
    description: 'Get read-only details for one system by id.',
    inputSchema: SystemIdParamsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  handler: async (params: z.infer<typeof SystemIdParamsSchema>, context: ToolContext) => {
    try {
      const session = await requireSession(context);
      context.apiClient.setSession(session);
      const apiClient = context.apiClient as unknown as {
        getSystem: (systemId: string) => Promise<System>;
      };
      const item = await apiClient.getSystem(params.systemId);
      return textResult(`System details:\n\n${summarizeSystem(item)}`, item);
    } catch (error) {
      return errorResult(error);
    }
  },
};

export function registerSystemTools(server: McpServer, context: unknown): void {
  const toolContext = context as ToolContext;
  server.registerTool(listSystemsTool.name, listSystemsTool.schema, (params) => listSystemsTool.handler(params, toolContext));
  server.registerTool(getSystemTool.name, getSystemTool.schema, (params) => getSystemTool.handler(params, toolContext));
}
