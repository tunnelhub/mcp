import type { ToolContext } from '../../types/mcp.js';
import { LoginParamsSchema } from '../../types/mcp.js';
import { errorResult, textResult } from '../../utils/error-handler.js';

export const loginTool = {
  name: 'login_tunnelhub',
  schema: {
    title: 'Login TunnelHub',
    description: 'Authenticate to TunnelHub using the browser-based frontend auth flow.',
    inputSchema: LoginParamsSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  handler: async (_params: unknown, context: ToolContext) => {
    try {
      const session = await context.sessionManager.createSession();
      context.apiClient.setSession(session);

      return textResult(
        `Authenticated successfully.\n\nTenant: ${session.tenantName}\nEnvironment: ${session.environmentName}\nUser: ${session.user.email || session.user.id}`,
        session,
      );
    } catch (error) {
      return errorResult(error);
    }
  },
};
