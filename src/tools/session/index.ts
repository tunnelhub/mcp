import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { loginTool } from './login.js';
import { switchSessionTool } from './switch-session.js';
import { listSessionsTool } from './list-sessions.js';
import { currentSessionTool } from './current-session.js';
import { logoutTool } from './logout.js';
import { listEnvironmentsTool } from './list-environments.js';
import type { ToolContext } from '../../types/mcp.js';

export function registerSessionTools(server: McpServer, context: unknown): void {
  const toolContext = context as ToolContext;

  server.registerTool(loginTool.name, loginTool.schema, (params) => loginTool.handler(params, toolContext));
  server.registerTool(switchSessionTool.name, switchSessionTool.schema, (params) => switchSessionTool.handler(params, toolContext));
  server.registerTool(listSessionsTool.name, listSessionsTool.schema, (params) => listSessionsTool.handler(params, toolContext));
  server.registerTool(currentSessionTool.name, currentSessionTool.schema, (params) => currentSessionTool.handler(params, toolContext));
  server.registerTool(logoutTool.name, logoutTool.schema, (params) => logoutTool.handler(params, toolContext));
  server.registerTool(listEnvironmentsTool.name, listEnvironmentsTool.schema, (params) => listEnvironmentsTool.handler(params, toolContext));
}
