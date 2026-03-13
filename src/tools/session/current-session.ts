import { z } from 'zod';
import type { ToolContext } from '../../types/mcp.js';
import { errorResult, textResult } from '../../utils/error-handler.js';

const EmptySchema = z.object({}).strict();

export const currentSessionTool = {
  name: 'current_session_tunnelhub',
  schema: {
    title: 'Current TunnelHub Session',
    description: 'Show the current authenticated TunnelHub session.',
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
      const authContext = await context.sessionManager.getCurrentContext();
      if (!authContext?.session) {
        return textResult('No active session. Use login_tunnelhub first.');
      }

      const session = authContext.session;
      const expiresInMinutes = Math.max(0, Math.floor((session.tokens.expiresAt - Date.now()) / 60000));

      return textResult(
        `Current session:\n\nTenant: ${session.tenantName}\nEnvironment: ${session.environmentName}\nAPI Host: ${session.apiHost}\nUser: ${session.user.email || session.user.id}\nExpires in: ${expiresInMinutes} minutes`,
        session,
      );
    } catch (error) {
      return errorResult(error);
    }
  },
};
