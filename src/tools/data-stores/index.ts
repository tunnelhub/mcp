import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { z } from 'zod';
import type { DataStore, DataStoreItem } from '../../types/api.js';
import type { ToolContext } from '../../types/mcp.js';
import {
  DataStoreIdParamsSchema,
  DataStoreItemIdParamsSchema,
  DataStoreItemListParamsSchema,
  DataStoreListParamsSchema,
} from '../../types/mcp.js';
import { errorResult, requireSession, textResult } from '../../utils/error-handler.js';

function extractListItems<T>(response: unknown): T[] {
  if (Array.isArray(response)) {
    return response as T[];
  }

  if (response && typeof response === 'object' && Array.isArray((response as { data?: unknown[] }).data)) {
    return (((response as { data?: unknown[] }).data || []) as T[]);
  }

  return [];
}

function summarizeDataStore(item: DataStore): string {
  return [
    `Data Store ID: ${item.uuid}`,
    `External Code: ${item.externalCode || 'n/a'}`,
    `Description: ${item.description || 'n/a'}`,
    `Package ID: ${item.packageId || 'n/a'}`,
    `Created At: ${item.createdAt || 'n/a'}`,
    `Updated At: ${item.updatedAt || 'n/a'}`,
  ].join('\n');
}

function summarizeDataStoreList(items: DataStore[]): string {
  if (items.length === 0) {
    return 'No conversion tables found.';
  }

  return items
    .slice(0, 15)
    .map((item) => `${item.externalCode || item.uuid} | ${item.description || 'n/a'} | ${item.uuid}`)
    .join('\n');
}

function summarizeDataStoreItem(item: DataStoreItem): string {
  return [
    `Item ID: ${item.uuid}`,
    `Table ID: ${item.dataStoreId}`,
    `From: ${item.fromValue}`,
    `To: ${item.toValue}`,
    `Created At: ${item.createdAt || 'n/a'}`,
    `Updated At: ${item.updatedAt || 'n/a'}`,
  ].join('\n');
}

function summarizeDataStoreItems(items: DataStoreItem[]): string {
  if (items.length === 0) {
    return 'No conversion table items found.';
  }

  return items
    .slice(0, 20)
    .map((item) => `${item.fromValue} -> ${item.toValue} | ${item.uuid}`)
    .join('\n');
}

const listDataStoresTool = {
  name: 'list_data_stores_tunnelhub',
  schema: {
    title: 'List TunnelHub Conversion Tables',
    description: 'List conversion tables (data stores) from platform-service using the current environment.',
    inputSchema: DataStoreListParamsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  handler: async (params: z.infer<typeof DataStoreListParamsSchema>, context: ToolContext) => {
    try {
      const session = await requireSession(context);
      context.apiClient.setSession(session);
      const apiClient = context.apiClient as unknown as {
        listDataStores: (params: Record<string, unknown>) => Promise<unknown>;
      };
      const response = await apiClient.listDataStores(params as Record<string, unknown>);
      const items = extractListItems<DataStore>(response);
      const summary = summarizeDataStoreList(items);

      return textResult(`Conversion tables:\n\n${summary}\n\nReturned: ${items.length}`, {
        dataStores: items,
        rawResponse: response,
      });
    } catch (error) {
      return errorResult(error);
    }
  },
};

const getDataStoreTool = {
  name: 'get_data_store_tunnelhub',
  schema: {
    title: 'Get TunnelHub Conversion Table',
    description: 'Get read-only details for one conversion table by id.',
    inputSchema: DataStoreIdParamsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  handler: async (params: z.infer<typeof DataStoreIdParamsSchema>, context: ToolContext) => {
    try {
      const session = await requireSession(context);
      context.apiClient.setSession(session);
      const apiClient = context.apiClient as unknown as {
        getDataStore: (dataStoreId: string) => Promise<DataStore>;
      };
      const dataStore = await apiClient.getDataStore(params.dataStoreId);
      return textResult(`Conversion table details:\n\n${summarizeDataStore(dataStore)}`, dataStore);
    } catch (error) {
      return errorResult(error);
    }
  },
};

const listDataStoreItemsTool = {
  name: 'list_data_store_items_tunnelhub',
  schema: {
    title: 'List Conversion Table Items',
    description: 'List de/para rows for one conversion table.',
    inputSchema: DataStoreItemListParamsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  handler: async (params: z.infer<typeof DataStoreItemListParamsSchema>, context: ToolContext) => {
    try {
      const session = await requireSession(context);
      context.apiClient.setSession(session);
      const apiClient = context.apiClient as unknown as {
        listDataStoreItems: (dataStoreId: string, params: Record<string, unknown>) => Promise<unknown>;
      };
      const response = await apiClient.listDataStoreItems(params.dataStoreId, params as Record<string, unknown>);
      const items = extractListItems<DataStoreItem>(response);
      const summary = summarizeDataStoreItems(items);

      return textResult(`Conversion table items for ${params.dataStoreId}:\n\n${summary}\n\nReturned: ${items.length}`, {
        items,
        rawResponse: response,
      });
    } catch (error) {
      return errorResult(error);
    }
  },
};

const getDataStoreItemTool = {
  name: 'get_data_store_item_tunnelhub',
  schema: {
    title: 'Get Conversion Table Item',
    description: 'Get read-only details for one de/para row by id.',
    inputSchema: DataStoreItemIdParamsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  handler: async (params: z.infer<typeof DataStoreItemIdParamsSchema>, context: ToolContext) => {
    try {
      const session = await requireSession(context);
      context.apiClient.setSession(session);
      const apiClient = context.apiClient as unknown as {
        getDataStoreItem: (dataStoreId: string, itemId: string) => Promise<DataStoreItem>;
      };
      const item = await apiClient.getDataStoreItem(params.dataStoreId, params.itemId);
      return textResult(`Conversion table item details:\n\n${summarizeDataStoreItem(item)}`, item);
    } catch (error) {
      return errorResult(error);
    }
  },
};

export function registerDataStoreTools(server: McpServer, context: unknown): void {
  const toolContext = context as ToolContext;
  server.registerTool(listDataStoresTool.name, listDataStoresTool.schema, (params) => listDataStoresTool.handler(params, toolContext));
  server.registerTool(getDataStoreTool.name, getDataStoreTool.schema, (params) => getDataStoreTool.handler(params, toolContext));
  server.registerTool(listDataStoreItemsTool.name, listDataStoreItemsTool.schema, (params) => listDataStoreItemsTool.handler(params, toolContext));
  server.registerTool(getDataStoreItemTool.name, getDataStoreItemTool.schema, (params) => getDataStoreItemTool.handler(params, toolContext));
}
