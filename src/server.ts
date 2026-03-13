import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import packageJson from '../package.json' with { type: 'json' };
import { SessionManager } from './auth/session-manager.js';
import { registerApiGatewayTools } from './tools/api-gateway/index.js';
import { registerDataStoreTools } from './tools/data-stores/index.js';
import { registerAutomationTools } from './tools/automations/index.js';
import { registerMonitoringTools } from './tools/monitoring/index.js';
import { registerPackageTools } from './tools/packages/index.js';
import { registerSessionTools } from './tools/session/index.js';
import { registerSystemTools } from './tools/systems/index.js';
import { registerTenantTools } from './tools/tenants/index.js';
import { ApiClient } from './utils/api-client.js';
import type { ToolContext } from './types/mcp.js';
import { MCPError } from './utils/error-handler.js';

export class TunnelHubMCPServer {
  private readonly server: McpServer;

  private readonly sessionManager: SessionManager;

  private readonly apiClient: ApiClient;

  constructor() {
    this.server = new McpServer({
      name: 'tunnelhub-mcp-server',
      version: packageJson.version,
    });
    this.sessionManager = new SessionManager();
    this.apiClient = new ApiClient();
    this.setupServer();
  }

  private setupServer(): void {
    const context: ToolContext = {
      sessionManager: this.sessionManager,
      apiClient: this.apiClient,
      getSession: async () => {
        const authContext = await this.sessionManager.getCurrentContext();
        if (!authContext?.session) {
          throw new MCPError('Not authenticated. Use login_tunnelhub first.', 'AUTH_REQUIRED');
        }

        this.apiClient.setSession(authContext.session);
        return authContext.session;
      },
    };

    registerSessionTools(this.server, context);
    registerTenantTools(this.server, context);
    registerPackageTools(this.server, context);
    registerSystemTools(this.server, context);
    registerApiGatewayTools(this.server, context);
    registerDataStoreTools(this.server, context);
    registerAutomationTools(this.server, context);
    registerMonitoringTools(this.server, context);
  }

  getServer(): McpServer {
    return this.server;
  }
}

const tunnelHubServer = new TunnelHubMCPServer();

export default tunnelHubServer.getServer();
