import type { ToolContext } from '../../types/mcp.js';
import { LoginParamsSchema } from '../../types/mcp.js';
import { errorResult, textResult } from '../../utils/error-handler.js';
import type { z } from 'zod';

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
  handler: async (params: z.infer<typeof LoginParamsSchema>, context: ToolContext) => {
    try {
      const session = await context.sessionManager.createSession(params);
      context.apiClient.setSession(session);

      return textResult(
        `Authenticated successfully.\n\nCompany: ${session.tenantName}\nEnvironment: ${session.environmentName}\nUser: ${session.user.email || session.user.id}`,
        session,
      );
    } catch (error) {
      return errorResult(error);
    }
  },
};
