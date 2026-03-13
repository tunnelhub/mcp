# TunnelHub MCP Technical Overview

## Overview

`@tunnelhub/mcp` is a `stdio` MCP server for TunnelHub focused on:

- session management
- environments
- automations
- execution monitoring
- logs and traces

The current product emphasis is operational support for TunnelHub automations rather than full platform coverage.

## Runtime Model

- transport: `stdio`
- entrypoint: `dist/index.js`
- package command: `npx @tunnelhub/mcp`
- local command: `node dist/index.js`

The server is intended to run inside MCP clients such as OpenCode, Claude Desktop, Cursor, and other `stdio`-compatible hosts.

## Authentication Flow

Authentication intentionally goes through the TunnelHub frontend rather than Cognito Hosted UI.

Why:

- not every Cognito pool has Hosted UI configured
- the frontend auth flow is the most reliable path already used by the CLI

Flow:

1. MCP starts a local callback server
2. it opens the browser
3. user authenticates in TunnelHub frontend `/#/auth-cli`
4. frontend posts `idToken`, `accessToken`, `refreshToken`, `expiresIn` back to the local callback
5. MCP resolves current user, tenant context, and environments
6. session is persisted locally

Relevant files:

- `src/auth/browser-auth.ts`
- `src/auth/session-manager.ts`
- `src/auth/cognito-client.ts`
- `src/auth/token-manager.ts`

## Session Model

The session currently stores:

- tenant id and tenant name
- current environment id and name
- frontend URL
- API host
- Cognito client id
- tokens
- current user email, role, timezone

Timezone comes from `/user-service/currentUser` when available, with fallback to `America/Sao_Paulo`.

## Frontend URL Resolution

The login flow prefers the tenant custom domain when it is known.

Resolution order:

1. previously saved tenant frontend URL
2. tenant public details `domain` -> `https://${domain}.tunnelhub.io`
3. default frontend fallback

## API Design

This MCP is REST-only.

It does not access DynamoDB directly.

The API client maps tools to public backend services:

- `/tenant-service`
- `/user-service`
- `/platform-service`
- `/integrations-service`

Relevant file:

- `src/utils/api-client.ts`

## Headers

The MCP automatically sends:

- `Authorization: Bearer <idToken>`
- `EnvironmentId: <current environment id>`

Monitoring requests also send:

- `UserTimeZone: <session timezone>`

## Monitoring Model

Execution detail APIs require three identifiers:

- `automationId`
- `executionPeriod`
- `executionId`

This matches the product URL pattern:

`/automations/{automationId}/execution/{executionPeriod}/{executionId}`

### Execution discovery

Execution search is range-based.

`list_automation_executions_tunnelhub` and `find_execution_tunnelhub` require:

- `startDate`
- `endDate`

Internally this is translated to backend `createdAt` range filters.

### Execution detail

Execution detail tools:

- `get_execution_tunnelhub`
- `summarize_execution_tunnelhub`
- `get_execution_logs_tunnelhub`
- `get_execution_traces_tunnelhub`

`summarize_execution_tunnelhub` is the best default tool for operational triage because it combines:

- execution details
- logs preview
- trace summary
- first traces
- last traces

## Filtering Behavior

### Automations

Automation listing uses Ant Table style filtering.

Example backend shape:

```json
{
  "current": 1,
  "pageSize": 20,
  "sorter": {
    "name": "ascend"
  },
  "filter": {
    "status": ["ACTIVE"]
  }
}
```

The MCP now normalizes this automatically.

### Executions

Execution listing uses:

- `createdAt`
- `sorter`
- `filter`
- `hideEmptySuccess`

The MCP normalizes the user-facing range into the backend request shape.

### Traces

Trace requests support V2-style filters when `pageSize`, `cursor`, `message`, `level`, or `status` are sent.

Common filters:

- `level`
- `status`
- `message`

## Response Shaping

The MCP returns both:

- human-readable text for agents
- `structuredContent` for clients that use structured payloads

Important practical rule:

the text response is intentionally rich because many MCP agents reason better from text than from raw structured payload alone.

## Tool Groups

### Session

- `login_tunnelhub`
- `current_session_tunnelhub`
- `list_sessions_tunnelhub`
- `list_environments_tunnelhub`
- `switch_environment_tunnelhub`
- `logout_tunnelhub`

### Tenants

- `list_tenants_tunnelhub`
- `get_tenant_tunnelhub`

### Automations

- `list_automations_tunnelhub`
- `get_automation_tunnelhub`
- `list_automation_deploys_tunnelhub`
- `get_automation_action_logs_tunnelhub`
- `execute_automation_tunnelhub`

### Monitoring

- `list_automation_executions_tunnelhub`
- `find_execution_tunnelhub`
- `get_execution_tunnelhub`
- `summarize_execution_tunnelhub`
- `get_execution_traces_tunnelhub`
- `get_execution_logs_tunnelhub`

## Local Development

Install and build:

```bash
pnpm install
pnpm typecheck
pnpm build
```

Run locally:

```bash
node dist/index.js
```

Watch mode:

```bash
pnpm dev
```

## Publish Readiness Notes

For `npx` usage, the package now exposes:

- npm name: `@tunnelhub/mcp`
- bin command: `tunnelhub-mcp`

Expected invocation from clients is still:

```bash
npx @tunnelhub/mcp
```

## Known Limitations

- current feature depth is strongest in automations and monitoring
- execution listing still depends on explicit date ranges
- some backend APIs use Ant Table semantics, so request normalization is required in the MCP layer
- platform coverage is not complete yet for every TunnelHub domain

## Troubleshooting

### Login opens the wrong frontend

Check:

- tenant public `domain`
- saved local session context
- `TUNNELHUB_FRONTEND_URL` override

### OAuth callback port already in use

Default preferred port is `3333`.

The MCP will try the next available local port automatically.

### Monitoring returns no execution for a narrow window

Check:

- timezone used in session
- whether timestamps are being interpreted in local time vs UTC
- try a wider range first, then narrow manually

### Client does not connect to the server

Check:

- build exists in `dist/`
- client is configured for `stdio`
- command path is correct

## Relevant Files

- `src/index.ts`
- `src/server.ts`
- `src/utils/api-client.ts`
- `src/auth/browser-auth.ts`
- `src/auth/session-manager.ts`
- `src/tools/session/index.ts`
- `src/tools/automations/index.ts`
- `src/tools/monitoring/index.ts`
