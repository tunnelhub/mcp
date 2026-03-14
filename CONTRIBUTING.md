# Contributing

Thanks for contributing to `@tunnelhub/mcp`.

## Development setup

```bash
pnpm install
pnpm typecheck
pnpm build
```

For local development:

```bash
pnpm dev
```

## Before opening a PR

Please run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Or run everything with:

```bash
pnpm check
```

## Contribution guidelines

- Keep changes focused.
- Follow existing project patterns.
- Prefer improving MCP usability over exposing raw backend behavior.
- Preserve REST-only integration. Do not add direct DynamoDB access.
- Keep README user-facing and technical details in `docs/technical-overview.md`.

## Reporting issues

When reporting a bug, include:

- MCP client used
- operating system
- Node.js version
- steps to reproduce
- expected behavior
- actual behavior
- relevant logs or tool outputs

## Suggested PR format

- short title
- problem being solved
- summary of changes
- how it was tested

## Release notes

Package publication is validated with:

```bash
pnpm pack:check
pnpm publish:dry-run
```

## Release process

Releases are created from git tags in the format `vX.Y.Z`.

Typical flow:

```bash
pnpm release:patch
git push origin main --follow-tags
```

The GitHub Actions workflow then:

- validates the pushed tag against `package.json`
- runs `pnpm check`
- creates the package tarball with `npm pack`
- publishes to npm using trusted publishing with GitHub Actions OIDC
- creates or updates the matching GitHub Release
