import type { z } from 'zod';
import type { ToolContext } from '../../types/mcp.js';
import { SwitchEnvironmentParamsSchema } from '../../types/mcp.js';
import { errorResult, textResult } from '../../utils/error-handler.js';

export const switchSessionTool = {
  name: 'switch_environment_tunnelhub',
  schema: {
    title: 'Switch TunnelHub Environment',
    description: 'Switch the active TunnelHub environment for the current session.',
    inputSchema: SwitchEnvironmentParamsSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  handler: async (params: z.infer<typeof SwitchEnvironmentParamsSchema>, context: ToolContext) => {
    try {
      const session = await context.sessionManager.switchEnvironment(params.environmentId);
      context.apiClient.setSession(session);

      return textResult(
        `Switched environment.\n\nTenant: ${session.tenantName}\nEnvironment: ${session.environmentName}`,
        session,
      );
    } catch (error) {
      return errorResult(error);
    }
  },
};
