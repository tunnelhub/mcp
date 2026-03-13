import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { ToolContext } from '../../types/mcp.js';
import { TenantIdParamsSchema } from '../../types/mcp.js';
import { errorResult, requireSession, textResult } from '../../utils/error-handler.js';

const ListTenantsSchema = z.object({}).strict();

const listTenantsTool = {
  name: 'list_tenants_tunnelhub',
  schema: {
    title: 'List TunnelHub Tenants',
    description: 'List tenants visible to the authenticated user. Intended as read-only lookup.',
    inputSchema: ListTenantsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  handler: async (_params: unknown, context: ToolContext) => {
    try {
      const session = await requireSession(context);
      context.apiClient.setSession(session);
      const apiClient = context.apiClient as unknown as { listTenants: () => Promise<unknown> };
      const tenants = await apiClient.listTenants();
      return textResult('Fetched tenants.', tenants);
    } catch (error) {
      return errorResult(error);
    }
  },
};

const getTenantTool = {
  name: 'get_tenant_tunnelhub',
  schema: {
    title: 'Get TunnelHub Tenant',
    description: 'Get read-only details for a tenant by id.',
    inputSchema: TenantIdParamsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  handler: async (params: z.infer<typeof TenantIdParamsSchema>, context: ToolContext) => {
    try {
      const session = await requireSession(context);
      context.apiClient.setSession(session);
      const apiClient = context.apiClient as unknown as { getTenant: (tenantId: string) => Promise<unknown> };
      const tenant = await apiClient.getTenant(params.tenantId);
      return textResult(`Fetched tenant ${params.tenantId}.`, tenant);
    } catch (error) {
      return errorResult(error);
    }
  },
};

export function registerTenantTools(server: McpServer, context: unknown): void {
  server.registerTool(listTenantsTool.name, listTenantsTool.schema, (params) => listTenantsTool.handler(params, context as ToolContext));
  server.registerTool(getTenantTool.name, getTenantTool.schema, (params) => getTenantTool.handler(params, context as ToolContext));
}
