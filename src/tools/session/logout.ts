import type { z } from 'zod';
import type { ToolContext } from '../../types/mcp.js';
import { LogoutParamsSchema } from '../../types/mcp.js';
import { errorResult, textResult } from '../../utils/error-handler.js';

export const logoutTool = {
  name: 'logout_tunnelhub',
  schema: {
    title: 'Logout TunnelHub',
    description: 'Remove the current or a specific saved TunnelHub session.',
    inputSchema: LogoutParamsSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  handler: async (params: z.infer<typeof LogoutParamsSchema>, context: ToolContext) => {
    try {
      const currentSession = context.sessionManager.getCurrentSession();
      context.sessionManager.logout(params.sessionId);

      if (params.sessionId) {
        return textResult(`Logged out session ${params.sessionId}.`);
      }

      return textResult(
        currentSession
          ? `Logged out current session for ${currentSession.tenantName} / ${currentSession.environmentName}.`
          : 'No active session to logout.',
      );
    } catch (error) {
      return errorResult(error);
    }
  },
};
