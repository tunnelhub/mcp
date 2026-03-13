import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type {
  AutomationExecution,
  AutomationExecutionDetailsResponse,
  AutomationExecutionLogsResponse,
  AutomationTraceResponse,
} from '../../types/api.js';
import type { ToolContext } from '../../types/mcp.js';
import {
  ExecutionDetailsParamsSchema,
  ExecutionListParamsSchema,
  ExecutionLogsParamsSchema,
  ExecutionTracesParamsSchema,
  FindExecutionParamsSchema,
} from '../../types/mcp.js';
import { errorResult, requireSession, textResult } from '../../utils/error-handler.js';

type ExecutionListResponse = {
  data?: AutomationExecution[];
  total?: number;
  success?: boolean;
};

function extractExecutions(response: unknown): AutomationExecution[] {
  if (Array.isArray(response)) {
    return response as AutomationExecution[];
  }

  if (response && typeof response === 'object' && Array.isArray((response as ExecutionListResponse).data)) {
    return (response as ExecutionListResponse).data || [];
  }

  return [];
}

function executionIdOf(execution: AutomationExecution): string {
  return execution.executionId || execution.uuid || 'n/a';
}

function executionPeriodOf(execution: AutomationExecution): string {
  return execution.executionPeriod || execution.execPeriod || execution.period || (execution.createdAt ? execution.createdAt.slice(0, 7) : 'unknown');
}

function formatInTimeZone(value: string | undefined, timeZone: string): string {
  if (!value) {
    return 'n/a';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

function summarizeExecutionRow(execution: AutomationExecution, timeZone: string): string {
  return [
    `${executionIdOf(execution)} | ${execution.status || 'n/a'} | ${formatInTimeZone(execution.createdAt, timeZone)}`,
    `automation=${execution.automationId || 'n/a'} | period=${executionPeriodOf(execution)} | processed=${String(execution.processedItems ?? 'n/a')}`,
  ].join('\n');
}

function summarizeExecutionList(executions: AutomationExecution[], timeZone: string): string {
  if (executions.length === 0) {
    return 'No executions found for the selected range.';
  }

  return executions.slice(0, 10).map((execution) => summarizeExecutionRow(execution, timeZone)).join('\n\n');
}

function summarizeExecutionDetails(details: AutomationExecutionDetailsResponse, timeZone: string): string {
  const execution = details.execution;
  const automation = details.automation;

  if (!execution) {
    return 'Execution details returned no execution payload.';
  }

  return [
    `Automation: ${automation?.name || execution.automationName || automation?.uuid || execution.automationId || 'n/a'}`,
    `Automation ID: ${execution.automationId || automation?.uuid || 'n/a'}`,
    `Execution ID: ${executionIdOf(execution)}`,
    `Execution Period: ${executionPeriodOf(execution)}`,
    `Status: ${execution.status || 'n/a'}`,
    `Created At: ${formatInTimeZone(execution.createdAt, timeZone)} (${execution.createdAt || 'n/a'} UTC)` ,
    `Finished At: ${formatInTimeZone(execution.finishedAt, timeZone)} (${execution.finishedAt || 'n/a'} UTC)`,
    `Processed Items: ${String(execution.processedItems ?? 'n/a')}`,
    `Success: ${String(execution.totalSuccess ?? 'n/a')}`,
    `Fail: ${String(execution.totalFail ?? 'n/a')}`,
    `Neutral: ${String(execution.totalNeutral ?? 'n/a')}`,
    `Message: ${String(execution.message ?? 'n/a')}`,
  ].join('\n');
}

function tracePreview(traces: Array<Record<string, unknown>>, timeZone: string, limit = 20, fromEnd = false): string {
  if (traces.length === 0) {
    return 'No trace lines returned.';
  }

  const selectedTraces = fromEnd ? traces.slice(-limit) : traces.slice(0, limit);

  return selectedTraces.map((trace, index) => {
    const rawTimestamp = trace.timestamp ?? trace.ingestionTime;
    const timestamp = typeof rawTimestamp === 'string'
      ? formatInTimeZone(rawTimestamp, timeZone)
      : String(rawTimestamp ?? 'n/a');
    const level = trace.level ? `[${String(trace.level)}] ` : '';
    const status = trace.status ? `(${String(trace.status)}) ` : '';
    const message = String(trace.message ?? trace.eventMessage ?? trace.msg ?? JSON.stringify(trace));
    return `${index + 1}. ${timestamp} ${level}${status}${message}`;
  }).join('\n');
}

function extractTraces(response: AutomationTraceResponse): Array<Record<string, unknown>> {
  if (Array.isArray(response.traces)) {
    return response.traces;
  }

  if (Array.isArray(response.items)) {
    return response.items;
  }

  return [];
}

function logsPreview(response: AutomationExecutionLogsResponse, limit = 20): string {
  const rows = Array.isArray(response.data) ? response.data : [];
  if (rows.length === 0) {
    return 'No execution logs returned.';
  }

  return rows.slice(0, limit).map((row, index) => {
    const jsonItem = row.jsonItem as Record<string, unknown> | undefined;
    const createdAt = String(row.createdAt ?? 'n/a');
    const action = String(row.action ?? 'n/a');
    const status = String(row.status ?? 'n/a');
    const message = String(row.message ?? jsonItem?.message ?? '');
    return `${index + 1}. ${createdAt} [${action}/${status}] ${message}`.trim();
  }).join('\n');
}

function traceIssueSummary(traces: Array<Record<string, unknown>>): string {
  const warns = traces.filter((trace) => String(trace.level || '').toUpperCase() === 'WARN').length;
  const errors = traces.filter((trace) => String(trace.level || '').toUpperCase() === 'ERROR').length;
  return `WARN: ${warns} | ERROR: ${errors}`;
}

const summarizeExecutionTool = {
  name: 'summarize_execution_tunnelhub',
  schema: {
    title: 'Summarize Execution',
    description: 'Summarize one execution with details, logs, and traces.',
    inputSchema: ExecutionDetailsParamsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  handler: async (params: typeof ExecutionDetailsParamsSchema._type, context: ToolContext) => {
    try {
      const session = await requireSession(context);
      context.apiClient.setSession(session);
      const apiClient = context.apiClient as unknown as {
        getExecutionDetails: (params: typeof ExecutionDetailsParamsSchema._type) => Promise<AutomationExecutionDetailsResponse>;
        getExecutionLogs: (params: Record<string, unknown>) => Promise<AutomationExecutionLogsResponse>;
        getExecutionTraces: (params: Record<string, unknown>) => Promise<AutomationTraceResponse>;
      };
      const [details, logs, traces] = await Promise.all([
        apiClient.getExecutionDetails(params),
        apiClient.getExecutionLogs({
          executionId: params.executionId,
          automationId: params.automationId,
          period: params.executionPeriod,
          current: 1,
          pageSize: 20,
        }),
        apiClient.getExecutionTraces({
          executionId: params.executionId,
          automationId: params.automationId,
          period: params.executionPeriod,
          pageSize: 100,
        }),
      ]);
      const traceLines = extractTraces(traces);
      const logCount = Array.isArray(logs.data) ? logs.data.length : 0;
      const timeZone = session.user.timezone;

      return textResult(
        `Execution summary:\n\n${summarizeExecutionDetails(details, timeZone)}\n\nTrace summary: ${traceIssueSummary(traceLines)} | Total traces: ${traceLines.length} | Logs: ${logCount}\n\nFirst traces:\n${tracePreview(traceLines, timeZone, 5)}\n\nLast traces:\n${tracePreview(traceLines, timeZone, 5, true)}\n\nLogs:\n${logsPreview(logs, 10)}`,
        { details, logs, traces },
      );
    } catch (error) {
      return errorResult(error);
    }
  },
};

const listExecutionsTool = {
  name: 'list_automation_executions_tunnelhub',
  schema: {
    title: 'List Automation Executions',
    description: 'List automation executions for a required date range. startDate and endDate are mandatory.',
    inputSchema: ExecutionListParamsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  handler: async (params: typeof ExecutionListParamsSchema._type, context: ToolContext) => {
    try {
      const session = await requireSession(context);
      context.apiClient.setSession(session);
      const apiClient = context.apiClient as unknown as { listExecutions: (params: Record<string, unknown>) => Promise<unknown> };
      const response = await apiClient.listExecutions(params as Record<string, unknown>);
      const executions = extractExecutions(response);
      const timeZone = session.user.timezone;

      return textResult(
        `Executions from ${params.startDate} to ${params.endDate} (${timeZone}):\n\n${summarizeExecutionList(executions, timeZone)}`,
        { response, executions },
      );
    } catch (error) {
      return errorResult(error);
    }
  },
};

const findExecutionTool = {
  name: 'find_execution_tunnelhub',
  schema: {
    title: 'Find Execution',
    description: 'Find an execution within a required date range and resolve its execution period.',
    inputSchema: FindExecutionParamsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  handler: async (params: typeof FindExecutionParamsSchema._type, context: ToolContext) => {
    try {
      const session = await requireSession(context);
      context.apiClient.setSession(session);
      const apiClient = context.apiClient as unknown as { findExecution: (params: Record<string, unknown>) => Promise<AutomationExecution | null> };
      const execution = await apiClient.findExecution(params as Record<string, unknown>);

      if (!execution) {
        return textResult(`No execution found from ${params.startDate} to ${params.endDate}.`);
      }

      return textResult(`Execution found:\n\n${summarizeExecutionRow(execution, session.user.timezone)}`, {
        ...execution,
        executionId: executionIdOf(execution),
        executionPeriod: executionPeriodOf(execution),
      });
    } catch (error) {
      return errorResult(error);
    }
  },
};

const getExecutionTool = {
  name: 'get_execution_tunnelhub',
  schema: {
    title: 'Get Execution',
    description: 'Get execution summary details for one automation execution. Requires automationId, executionId, and executionPeriod.',
    inputSchema: ExecutionDetailsParamsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  handler: async (params: typeof ExecutionDetailsParamsSchema._type, context: ToolContext) => {
    try {
      const session = await requireSession(context);
      context.apiClient.setSession(session);
      const apiClient = context.apiClient as unknown as {
        getExecutionDetails: (params: typeof ExecutionDetailsParamsSchema._type) => Promise<AutomationExecutionDetailsResponse>;
      };
      const details = await apiClient.getExecutionDetails(params);
      return textResult(`Execution details:\n\n${summarizeExecutionDetails(details, session.user.timezone)}`, details);
    } catch (error) {
      return errorResult(error);
    }
  },
};

const getExecutionTracesTool = {
  name: 'get_execution_traces_tunnelhub',
  schema: {
    title: 'Get Execution Traces',
    description: 'Get execution traces for one automation execution.',
    inputSchema: ExecutionTracesParamsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  handler: async (params: typeof ExecutionTracesParamsSchema._type, context: ToolContext) => {
    try {
      const session = await requireSession(context);
      context.apiClient.setSession(session);
      const apiClient = context.apiClient as unknown as { getExecutionTraces: (params: Record<string, unknown>) => Promise<AutomationTraceResponse> };

      const requestParams: Record<string, unknown> = {
        executionId: params.executionId,
        automationId: params.automationId,
        period: params.executionPeriod,
        nextToken: params.nextToken,
        cursor: params.cursor,
        pageSize: params.pageSize,
        message: params.message,
        level: params.level,
        status: params.status,
      };

      if (params.timestampStart && params.timestampEnd) {
        requestParams.timestampRange = `${params.timestampStart},${params.timestampEnd}`;
      }

      const traces = await apiClient.getExecutionTraces(requestParams);
      const lines = extractTraces(traces);

      return textResult(
        `Traces for execution ${params.executionId}: ${lines.length} item(s).\n${traceIssueSummary(lines)}\n\n${tracePreview(lines, session.user.timezone)}`,
        traces,
      );
    } catch (error) {
      return errorResult(error);
    }
  },
};

const getExecutionLogsTool = {
  name: 'get_execution_logs_tunnelhub',
  schema: {
    title: 'Get Execution Logs',
    description: 'Get execution logs for one automation execution.',
    inputSchema: ExecutionLogsParamsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  handler: async (params: typeof ExecutionLogsParamsSchema._type, context: ToolContext) => {
    try {
      const session = await requireSession(context);
      context.apiClient.setSession(session);
      const apiClient = context.apiClient as unknown as { getExecutionLogs: (params: Record<string, unknown>) => Promise<AutomationExecutionLogsResponse> };
      const requestParams: Record<string, unknown> = {
        executionId: params.executionId,
        automationId: params.automationId,
        period: params.executionPeriod,
        current: params.current,
        pageSize: params.pageSize,
        totalPreCalculated: params.totalPreCalculated,
        LastEvaluatedKey: params.lastEvaluatedKey,
      };
      const logs = await apiClient.getExecutionLogs(requestParams);
      const count = Array.isArray(logs.data) ? logs.data.length : 0;

      return textResult(`Execution logs for ${params.executionId}: ${count} item(s).\n\n${logsPreview(logs)}`, logs);
    } catch (error) {
      return errorResult(error);
    }
  },
};

export function registerMonitoringTools(server: McpServer, context: unknown): void {
  const toolContext = context as ToolContext;
  server.registerTool(listExecutionsTool.name, listExecutionsTool.schema, (params) => listExecutionsTool.handler(params, toolContext));
  server.registerTool(findExecutionTool.name, findExecutionTool.schema, (params) => findExecutionTool.handler(params, toolContext));
  server.registerTool(getExecutionTool.name, getExecutionTool.schema, (params) => getExecutionTool.handler(params, toolContext));
  server.registerTool(summarizeExecutionTool.name, summarizeExecutionTool.schema, (params) => summarizeExecutionTool.handler(params, toolContext));
  server.registerTool(getExecutionTracesTool.name, getExecutionTracesTool.schema, (params) => getExecutionTracesTool.handler(params, toolContext));
  server.registerTool(getExecutionLogsTool.name, getExecutionLogsTool.schema, (params) => getExecutionLogsTool.handler(params, toolContext));
}
