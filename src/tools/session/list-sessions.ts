import { z } from 'zod';
import type { ToolContext } from '../../types/mcp.js';
import { errorResult, textResult } from '../../utils/error-handler.js';

const EmptySchema = z.object({}).strict();

export const listSessionsTool = {
  name: 'list_sessions_tunnelhub',
  schema: {
    title: 'List TunnelHub Sessions',
    description: 'List saved TunnelHub sessions in local MCP storage.',
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
      const sessions = context.sessionManager.getAllSessions();
      const currentSession = context.sessionManager.getCurrentSession();

      if (sessions.length === 0) {
        return textResult('No saved sessions. Use login_tunnelhub first.');
      }

      const text = sessions
        .map((session) => {
          const marker = currentSession?.id === session.id ? '*' : '-';
          return `${marker} ${session.tenantName} / ${session.environmentName} (${session.id})`;
        })
        .join('\n');

      return textResult(`Saved sessions:\n\n${text}`, sessions);
    } catch (error) {
      return errorResult(error);
    }
  },
};
