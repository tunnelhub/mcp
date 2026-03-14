import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type {
  AutomationRecharge,
  HomeStatisticsByDay,
  HomeStatisticsByIntegration,
  HomeStatisticsByPeriod,
  HomeStatisticsResponse,
  TenantExecutionStatisticsResponse,
} from '../../types/api.js';
import type { ToolContext } from '../../types/mcp.js';
import {
  HomeStatisticsParamsSchema,
  TenantExecutionStatisticsParamsSchema,
} from '../../types/mcp.js';
import { errorResult, requireSession, textResult } from '../../utils/error-handler.js';

function numberValue(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function summarizePeriod(periods: HomeStatisticsByPeriod[]): string {
  if (periods.length === 0) {
    return 'No period summary returned.';
  }

  return periods
    .slice(0, 6)
    .map(
      (item) =>
        `${item.exec_period} | executions=${numberValue(item.total_executions)} | processed=${numberValue(item.total_processed_items)} | success=${numberValue(item.total_success)} | fail=${numberValue(item.total_fail)}`,
    )
    .join('\n');
}

function summarizeDays(days: HomeStatisticsByDay[]): string {
  if (days.length === 0) {
    return 'No daily summary returned.';
  }

  return days
    .slice(-10)
    .map(
      (item) =>
        `${item.exec_date} | executions=${numberValue(item.total_executions)} | processed=${numberValue(item.total_processed_items)} | success=${numberValue(item.total_success)} | fail=${numberValue(item.total_fail)}`,
    )
    .join('\n');
}

function summarizeIntegrations(items: HomeStatisticsByIntegration[]): string {
  if (items.length === 0) {
    return 'No integration ranking returned.';
  }

  return items
    .slice(0, 7)
    .map(
      (item, index) =>
        `${index + 1}. ${item.integration_name || 'n/a'} | processed=${numberValue(item.total_processed_items)} | executions=${numberValue(item.total_executions)} | success=${numberValue(item.total_success)} | fail=${numberValue(item.total_fail)}`,
    )
    .join('\n');
}

function rechargeAvailableSeconds(recharge: AutomationRecharge): number {
  return numberValue(recharge.secondsRecharged) - numberValue(recharge.secondsUsed);
}

function summarizeRecharges(recharges: AutomationRecharge[]): string {
  if (recharges.length === 0) {
    return 'No recharges found.';
  }

  return recharges
    .slice(0, 10)
    .map(
      (item) =>
        `${item.uuid} | purchased=${numberValue(item.secondsRecharged)} | used=${numberValue(item.secondsUsed)} | available=${rechargeAvailableSeconds(item)} | ${item.createdAt || 'n/a'}`,
    )
    .join('\n');
}

function summarizeEnvironmentUsage(entries: Array<[string, number]>): string {
  if (entries.length === 0) {
    return 'No environment usage found.';
  }

  return entries
    .slice(0, 10)
    .map(([environmentId, usedSeconds]) => `${environmentId} | used=${usedSeconds}`)
    .join('\n');
}

function summarizeAutomationUsage(entries: Array<[string, number]>): string {
  if (entries.length === 0) {
    return 'No automation usage found.';
  }

  return entries
    .slice(0, 10)
    .map(([automationId, usedSeconds]) => `${automationId} | used=${usedSeconds}`)
    .join('\n');
}

function sortUsageMap(map: Record<string, number> | undefined): Array<[string, number]> {
  return Object.entries(map || {}).sort((left, right) => right[1] - left[1]);
}

const getHomeStatisticsTool = {
  name: 'get_home_statistics_tunnelhub',
  schema: {
    title: 'Get Home Statistics',
    description: 'Get tenant home statistics for executions and processed items in the current environment.',
    inputSchema: HomeStatisticsParamsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  handler: async (params: typeof HomeStatisticsParamsSchema._type, context: ToolContext) => {
    try {
      const session = await requireSession(context);
      context.apiClient.setSession(session);
      const apiClient = context.apiClient as unknown as {
        getHomeStatistics: (params?: { startDate?: string; endDate?: string }) => Promise<HomeStatisticsResponse>;
      };
      const response = await apiClient.getHomeStatistics(params);
      const periods = response.data?.resumeByPeriod || [];
      const days = response.data?.resumeByDay || [];
      const integrations = response.data?.resumeByIntegration || [];

      return textResult(
        [
          'Home statistics:',
          '',
          `Range: ${params.startDate || 'backend default'} to ${params.endDate || 'backend default'}`,
          `Periods: ${periods.length} | Days: ${days.length} | Top integrations: ${integrations.length}`,
          '',
          'By period:',
          summarizePeriod(periods),
          '',
          'By day:',
          summarizeDays(days),
          '',
          'Top integrations:',
          summarizeIntegrations(integrations),
        ].join('\n'),
        {
          statistics: response.data,
          rawResponse: response,
        },
      );
    } catch (error) {
      return errorResult(error);
    }
  },
};

const getTenantExecutionStatisticsTool = {
  name: 'get_tenant_execution_statistics_tunnelhub',
  schema: {
    title: 'Get Tenant Execution Statistics',
    description: 'Get tenant execution consumption statistics and recharges for one month period.',
    inputSchema: TenantExecutionStatisticsParamsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  handler: async (params: typeof TenantExecutionStatisticsParamsSchema._type, context: ToolContext) => {
    try {
      const session = await requireSession(context);
      context.apiClient.setSession(session);
      const apiClient = context.apiClient as unknown as {
        getTenantExecutionStatistics: (params?: { startDate?: string; endDate?: string }) => Promise<TenantExecutionStatisticsResponse>;
      };
      const response = await apiClient.getTenantExecutionStatistics(params);
      const stats = response.stats || { secondsIncluded: 0, tenantTier: 'n/a' };
      const executed = numberValue(stats.statistics?.executedTimeInSeconds?.total);
      const included = numberValue(stats.secondsIncluded);
      const byEnvironment = sortUsageMap(stats.statistics?.executedTimeInSeconds?.byEnvironment);
      const byAutomation = sortUsageMap(stats.statistics?.executedTimeInSeconds?.byAutomation);
      const recharges = Array.isArray(response.recharges) ? response.recharges : [];
      const totalRecharged = recharges.reduce((sum, item) => sum + numberValue(item.secondsRecharged), 0);
      const totalRechargeUsed = recharges.reduce((sum, item) => sum + numberValue(item.secondsUsed), 0);
      const totalRechargeAvailable = recharges.reduce((sum, item) => sum + rechargeAvailableSeconds(item), 0);

      return textResult(
        [
          'Tenant execution statistics:',
          '',
          `Period seed: ${params.startDate || 'current month default'}${params.endDate ? ` | endDate=${params.endDate}` : ''}`,
          `Tenant tier: ${stats.tenantTier || 'n/a'}`,
          `Included seconds: ${included}`,
          `Executed seconds: ${executed}`,
          `Plan balance: ${included - executed}`,
          `Recharges: ${recharges.length} | purchased=${totalRecharged} | used=${totalRechargeUsed} | available=${totalRechargeAvailable}`,
          '',
          'Usage by environment:',
          summarizeEnvironmentUsage(byEnvironment),
          '',
          'Usage by automation:',
          summarizeAutomationUsage(byAutomation),
          '',
          'Recharges:',
          summarizeRecharges(recharges),
        ].join('\n'),
        {
          stats,
          recharges,
          rawResponse: response,
        },
      );
    } catch (error) {
      return errorResult(error);
    }
  },
};

export function registerStatisticsTools(server: McpServer, context: unknown): void {
  const toolContext = context as ToolContext;
  server.registerTool(getHomeStatisticsTool.name, getHomeStatisticsTool.schema, (params) =>
    getHomeStatisticsTool.handler(params, toolContext),
  );
  server.registerTool(getTenantExecutionStatisticsTool.name, getTenantExecutionStatisticsTool.schema, (params) =>
    getTenantExecutionStatisticsTool.handler(params, toolContext),
  );
}
