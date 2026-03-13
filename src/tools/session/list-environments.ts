import { z } from 'zod';
import type { ToolContext } from '../../types/mcp.js';
import { errorResult, requireSession, textResult } from '../../utils/error-handler.js';

const EmptySchema = z.object({}).strict();

export const listEnvironmentsTool = {
  name: 'list_environments_tunnelhub',
  schema: {
    title: 'List TunnelHub Environments',
    description: 'List environments available to the current authenticated user.',
    inputSchema: EmptySchema,
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
      const apiClient = context.apiClient as unknown as { getEnvironments: () => Promise<unknown[]> };
      const environments = (await apiClient.getEnvironments()) as Array<Record<string, unknown>>;

      const text = environments
        .map((environment: Record<string, unknown>) => {
          const active = environment.uuid === session.environmentId ? '*' : '-';
          return `${active} ${String(environment.name)} (${String(environment.uuid)})`;
        })
        .join('\n');

      return textResult(`Available environments:\n\n${text}`, environments);
    } catch (error) {
      return errorResult(error);
    }
  },
};
