import axios from 'axios';
import type { ApiErrorResponse } from '../types/api.js';
import type { ToolContext } from '../types/mcp.js';

export class MCPError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

export function formatError(error: unknown): MCPError {
  if (error instanceof MCPError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    return new MCPError(
      data?.message || data?.error || error.message,
      String(error.response?.status || 'HTTP_ERROR'),
      data,
    );
  }

  if (error instanceof Error) {
    return new MCPError(error.message);
  }

  return new MCPError('Unknown error');
}

function normalizeStructuredContent(structuredContent?: unknown): Record<string, unknown> | undefined {
  if (structuredContent === undefined) {
    return undefined;
  }

  if (
    typeof structuredContent === 'object' &&
    structuredContent !== null &&
    !Array.isArray(structuredContent)
  ) {
    return structuredContent as Record<string, unknown>;
  }

  return { result: structuredContent };
}

export function textResult(text: string, structuredContent?: unknown): {
  content: Array<{ type: 'text'; text: string }>;
  structuredContent?: Record<string, unknown>;
} {
  return {
    content: [{ type: 'text', text }],
    structuredContent: normalizeStructuredContent(structuredContent),
  };
}

export function errorResult(error: unknown): {
  content: Array<{ type: 'text'; text: string }>;
  isError: true;
  structuredContent: { error: string; code?: string; details?: unknown };
} {
  const formatted = formatError(error);

  return {
    content: [{ type: 'text', text: `Error: ${formatted.message}` }],
    isError: true,
    structuredContent: {
      error: formatted.message,
      code: formatted.code,
      details: formatted.details,
    },
  };
}

export async function requireSession(context: ToolContext) {
  const session = await context.getSession();
  return session;
}
