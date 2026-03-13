import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { z } from 'zod';
import type { Package } from '../../types/api.js';
import type { ToolContext } from '../../types/mcp.js';
import { PackageIdParamsSchema, PackageListParamsSchema } from '../../types/mcp.js';
import { errorResult, requireSession, textResult } from '../../utils/error-handler.js';

function extractPackages(response: unknown): Package[] {
  if (Array.isArray(response)) {
    return response as Package[];
  }

  if (response && typeof response === 'object' && Array.isArray((response as { data?: unknown[] }).data)) {
    return (((response as { data?: unknown[] }).data || []) as Package[]);
  }

  return [];
}

function summarizePackage(item: Package): string {
  return [
    `Package ID: ${item.uuid}`,
    `Name: ${item.name || 'n/a'}`,
    `Description: ${item.description || 'n/a'}`,
    `Parameters: ${item.parameters?.length ?? 0}`,
    `Created At: ${item.createdAt || 'n/a'}`,
    `Updated At: ${item.updatedAt || 'n/a'}`,
  ].join('\n');
}

function summarizePackageList(items: Package[]): string {
  if (items.length === 0) {
    return 'No packages found.';
  }

  return items
    .slice(0, 15)
    .map((item) => `${item.name || item.uuid} | ${item.description || 'n/a'} | ${item.uuid}`)
    .join('\n');
}

const listPackagesTool = {
  name: 'list_packages_tunnelhub',
  schema: {
    title: 'List TunnelHub Packages',
    description: 'List integration packages from integrations-service using the current environment.',
    inputSchema: PackageListParamsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  handler: async (params: z.infer<typeof PackageListParamsSchema>, context: ToolContext) => {
    try {
      const session = await requireSession(context);
      context.apiClient.setSession(session);
      const apiClient = context.apiClient as unknown as {
        listPackages: (params: Record<string, unknown>) => Promise<unknown>;
      };
      const response = await apiClient.listPackages(params as Record<string, unknown>);
      const items = extractPackages(response);
      const summary = summarizePackageList(items);

      return textResult(`Packages:\n\n${summary}\n\nReturned: ${items.length}`, {
        packages: items,
        rawResponse: response,
      });
    } catch (error) {
      return errorResult(error);
    }
  },
};

const getPackageTool = {
  name: 'get_package_tunnelhub',
  schema: {
    title: 'Get TunnelHub Package',
    description: 'Get read-only details for one package by id.',
    inputSchema: PackageIdParamsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  handler: async (params: z.infer<typeof PackageIdParamsSchema>, context: ToolContext) => {
    try {
      const session = await requireSession(context);
      context.apiClient.setSession(session);
      const apiClient = context.apiClient as unknown as {
        getPackage: (packageId: string) => Promise<Package>;
      };
      const item = await apiClient.getPackage(params.packageId);
      return textResult(`Package details:\n\n${summarizePackage(item)}`, item);
    } catch (error) {
      return errorResult(error);
    }
  },
};

export function registerPackageTools(server: McpServer, context: unknown): void {
  const toolContext = context as ToolContext;
  server.registerTool(listPackagesTool.name, listPackagesTool.schema, (params) => listPackagesTool.handler(params, toolContext));
  server.registerTool(getPackageTool.name, getPackageTool.schema, (params) => getPackageTool.handler(params, toolContext));
}
