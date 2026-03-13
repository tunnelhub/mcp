import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { z } from 'zod';
import type { ToolContext } from '../../types/mcp.js';
import {
  AutomationActionLogsParamsSchema,
  AutomationIdParamsSchema,
  AutomationListParamsSchema,
  ExecuteAutomationParamsSchema,
} from '../../types/mcp.js';
import { errorResult, requireSession, textResult } from '../../utils/error-handler.js';

function summarizeAutomation(automation: Record<string, unknown>): string {
  return [
    `Automation ID: ${String(automation.uuid || automation.id || 'n/a')}`,
    `Name: ${String(automation.name || 'n/a')}`,
    `Status: ${String(automation.status || 'n/a')}`,
    `Description: ${String(automation.description || 'n/a')}`,
    `Created At: ${String(automation.createdAt || 'n/a')}`,
    `Updated At: ${String(automation.updatedAt || 'n/a')}`,
  ].join('\n');
}

function summarizeAutomationList(response: unknown): string {
  const items = Array.isArray(response)
    ? response
    : response && typeof response === 'object' && Array.isArray((response as { data?: unknown[] }).data)
      ? ((response as { data?: unknown[] }).data || [])
      : [];

  if (items.length === 0) {
    return 'No automations found.';
  }

  return items
    .slice(0, 10)
    .map((item) => {
      const automation = item as Record<string, unknown>;
      return `${String(automation.name || automation.uuid || 'n/a')} | ${String(automation.status || 'n/a')} | ${String(automation.uuid || 'n/a')}`;
    })
    .join('\n');
}

function extractAutomations(response: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(response)) {
    return response as Array<Record<string, unknown>>;
  }

  if (response && typeof response === 'object' && Array.isArray((response as { data?: unknown[] }).data)) {
    return (((response as { data?: unknown[] }).data || []) as Array<Record<string, unknown>>);
  }

  return [];
}

const listAutomationsTool = {
  name: 'list_automations_tunnelhub',
  schema: {
    title: 'List TunnelHub Automations',
    description: 'List automations from integrations-service using the current environment.',
    inputSchema: AutomationListParamsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  handler: async (params: z.infer<typeof AutomationListParamsSchema>, context: ToolContext) => {
    try {
      const session = await requireSession(context);
      context.apiClient.setSession(session);
      const apiClient = context.apiClient as unknown as { listAutomations: (params: Record<string, unknown>) => Promise<unknown> };
      const response = await apiClient.listAutomations(params as Record<string, unknown>);
      const items = extractAutomations(response);
      const filteredItems = params.status
        ? items.filter((item) => String(item.status || '') === params.status)
        : items;
      const summary = summarizeAutomationList(filteredItems);
      const activeCount = items.filter((item) => String(item.status || '') === 'ACTIVE').length;
      const inactiveCount = items.filter((item) => String(item.status || '') === 'INACTIVE').length;

      return textResult(`Automations:\n\n${summary}\n\nReturned: ${items.length} | Active: ${activeCount} | Inactive: ${inactiveCount}`, {
        automations: filteredItems,
        rawResponse: response,
      });
    } catch (error) {
      return errorResult(error);
    }
  },
};

const getAutomationTool = {
  name: 'get_automation_tunnelhub',
  schema: {
    title: 'Get TunnelHub Automation',
    description: 'Get automation details by id.',
    inputSchema: AutomationIdParamsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  handler: async (params: z.infer<typeof AutomationIdParamsSchema>, context: ToolContext) => {
    try {
      const session = await requireSession(context);
      context.apiClient.setSession(session);
      const apiClient = context.apiClient as unknown as { getAutomation: (id: string) => Promise<Record<string, unknown>> };
      const automation = await apiClient.getAutomation(params.automationId);
      return textResult(`Automation details:\n\n${summarizeAutomation(automation)}`, automation);
    } catch (error) {
      return errorResult(error);
    }
  },
};

const listAutomationDeploysTool = {
  name: 'list_automation_deploys_tunnelhub',
  schema: {
    title: 'List Automation Deploys',
    description: 'List deploy history for a TunnelHub automation.',
    inputSchema: AutomationIdParamsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  handler: async (params: z.infer<typeof AutomationIdParamsSchema>, context: ToolContext) => {
    try {
      const session = await requireSession(context);
      context.apiClient.setSession(session);
      const apiClient = context.apiClient as unknown as { listAutomationDeploys: (id: string) => Promise<unknown> };
      const deploys = await apiClient.listAutomationDeploys(params.automationId);
      const items = Array.isArray(deploys) ? deploys : [];
      const summary = items.length === 0
        ? 'No deploys found.'
        : items.slice(0, 5).map((item) => {
            const deploy = item as Record<string, unknown>;
            return `${String(deploy.deployId || deploy.internalSequence || 'n/a')} | ${String(deploy.createdAt || 'n/a')} | ${String(deploy.message || 'n/a')}`;
          }).join('\n');
      return textResult(`Deploy history for ${params.automationId}:\n\n${summary}`, { deploys });
    } catch (error) {
      return errorResult(error);
    }
  },
};

const getAutomationActionLogsTool = {
  name: 'get_automation_action_logs_tunnelhub',
  schema: {
    title: 'Get Automation Action Logs',
    description: 'Read action logs for a TunnelHub automation.',
    inputSchema: AutomationActionLogsParamsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  handler: async (params: z.infer<typeof AutomationActionLogsParamsSchema>, context: ToolContext) => {
    try {
      const session = await requireSession(context);
      context.apiClient.setSession(session);
      const apiClient = context.apiClient as unknown as {
        getAutomationActionLogs: (id: string, params?: Record<string, unknown>) => Promise<unknown>;
      };
      const logs = await apiClient.getAutomationActionLogs(params.automationId, params as Record<string, unknown>);
      const items = Array.isArray(logs)
        ? logs
        : logs && typeof logs === 'object' && Array.isArray((logs as { data?: unknown[] }).data)
          ? ((logs as { data?: unknown[] }).data || [])
          : [];
      return textResult(`Action logs for ${params.automationId}: ${items.length} item(s).`, {
        logs,
      });
    } catch (error) {
      return errorResult(error);
    }
  },
};

const executeAutomationTool = {
  name: 'execute_automation_tunnelhub',
  schema: {
    title: 'Execute Automation',
    description: 'Dispatch a TunnelHub automation manually, same flow used by the UI.',
    inputSchema: ExecuteAutomationParamsSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  handler: async (params: z.infer<typeof ExecuteAutomationParamsSchema>, context: ToolContext) => {
    try {
      const session = await requireSession(context);
      context.apiClient.setSession(session);
      const apiClient = context.apiClient as unknown as {
        executeAutomation: (id: string, payload?: unknown) => Promise<unknown>;
      };
      const result = await apiClient.executeAutomation(params.automationId, params.payload);
      return textResult(`Manual dispatch triggered for automation ${params.automationId}.`, result);
    } catch (error) {
      return errorResult(error);
    }
  },
};

export function registerAutomationTools(server: McpServer, context: unknown): void {
  const toolContext = context as ToolContext;
  server.registerTool(listAutomationsTool.name, listAutomationsTool.schema, (params) => listAutomationsTool.handler(params, toolContext));
  server.registerTool(getAutomationTool.name, getAutomationTool.schema, (params) => getAutomationTool.handler(params, toolContext));
  server.registerTool(listAutomationDeploysTool.name, listAutomationDeploysTool.schema, (params) => listAutomationDeploysTool.handler(params, toolContext));
  server.registerTool(getAutomationActionLogsTool.name, getAutomationActionLogsTool.schema, (params) => getAutomationActionLogsTool.handler(params, toolContext));
  server.registerTool(executeAutomationTool.name, executeAutomationTool.schema, (params) => executeAutomationTool.handler(params, toolContext));
}
