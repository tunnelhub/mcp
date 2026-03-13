# TunnelHub MCP

Conecte clientes MCP ao TunnelHub para investigar automações, execuções, logs, traces, API Gateway, sistemas e pacotes usando o mesmo fluxo de autenticação do frontend.

Este MCP é especialmente útil para:

- Acompanhar automações do TunnelHub
- Localizar e resumir execuções
- Imprimir logs e traces
- Analisar falhas parciais e dependências externas
- Trabalhar com ambientes da empresa atual

## ✨ O que você pode fazer

- Autenticar no TunnelHub pelo navegador
- Listar ambientes disponíveis
- Listar e inspecionar automações
- Consultar sistemas do ambiente atual
- Consultar pacotes do ambiente atual
- Consultar tabelas de de/para do ambiente atual
- Consultar APIs, clients, usage plans, API keys e logs do API Gateway
- Localizar execuções por intervalo de tempo
- Resumir uma execução completa
- Consultar logs e traces de uma execução
- Ler informações básicas da empresa atual

## ✅ Pré-requisitos

Você vai precisar de:

- Node.js 22+
- Acesso a uma empresa do TunnelHub
- Um cliente compatível com MCP via `stdio`

Clientes recomendados:

- OpenCode
- Claude Desktop
- Cursor
- Outros clientes MCP compatíveis com `stdio`

## 🚀 Comece em 2 minutos

A forma principal de uso é via `npx` com o bin explícito:

```bash
npx -y @tunnelhub/mcp@latest
```

Se você estiver desenvolvendo localmente:

```bash
pnpm install
pnpm build
node dist/index.js
```

Se esta for sua primeira vez usando o MCP do TunnelHub, siga este fluxo:

1. Faça login no TunnelHub
   - se for o primeiro login, informe o `accountName` da empresa
2. Qual sessão está ativa?
3. Liste os ambientes disponíveis
4. Liste as automações ativas

Você não precisa decorar o nome das tools. Pode pedir em linguagem natural, e o cliente MCP deve escolher a ferramenta certa.

## 🔌 Configuração oficial por cliente

### OpenCode

A forma mais estável de configurar no OpenCode é via `opencode.json`.

Se preferir, você também pode usar `opencode mcp add`, que abre um fluxo interativo para adicionar o servidor MCP.

Exemplo usando `opencode.json`:

Exemplo completo:

```json
{
  "mcp": {
    "tunnelhub": {
      "type": "local",
      "command": [
        "npx",
        "-y",
        "@tunnelhub/mcp@latest"
      ],
      "enabled": true,
      "environment": {
        "OAUTH_CALLBACK_PORT": "3333"
      }
    }
  }
}
```

Exemplo usando build local:

```json
{
  "mcp": {
    "tunnelhub": {
      "type": "local",
      "command": [
        "node",
        "/caminho/para/mcp/dist/index.js"
      ],
      "enabled": true,
      "environment": {
        "OAUTH_CALLBACK_PORT": "3333"
      }
    }
  }
}
```

### Claude Desktop

Exemplo de configuração no `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "tunnelhub": {
      "command": "npx",
      "args": ["-y", "@tunnelhub/mcp@latest"],
      "env": {
        "OAUTH_CALLBACK_PORT": "3333"
      }
    }
  }
}
```

Exemplo usando build local:

```json
{
  "mcpServers": {
    "tunnelhub": {
      "command": "node",
      "args": ["/caminho/para/mcp/dist/index.js"],
      "env": {
        "OAUTH_CALLBACK_PORT": "3333"
      }
    }
  }
}
```

### Cursor

Use o mesmo comando `stdio` do cliente MCP:

```json
{
  "mcpServers": {
    "tunnelhub": {
      "command": "npx",
      "args": ["-y", "@tunnelhub/mcp@latest"],
      "env": {
        "OAUTH_CALLBACK_PORT": "3333"
      }
    }
  }
}
```

Exemplo usando build local:

```json
{
  "mcpServers": {
    "tunnelhub": {
      "command": "node",
      "args": ["/caminho/para/mcp/dist/index.js"],
      "env": {
        "OAUTH_CALLBACK_PORT": "3333"
      }
    }
  }
}
```

### Outros clientes MCP compatíveis com `stdio`

Se o cliente aceitar um comando local, use:

```bash
npx -y @tunnelhub/mcp@latest
```

Ou, em desenvolvimento:

```bash
node /caminho/para/mcp/dist/index.js
```

## 🔐 Como funciona o login

No primeiro uso, chame a ferramenta de login do MCP.

Fluxo esperado:

1. O cliente chama `login_tunnelhub`
2. O MCP abre o navegador local
3. Você faz login no TunnelHub
4. A sessão fica salva localmente
5. As próximas ferramentas passam a usar a empresa e o ambiente ativos

Ferramentas básicas de sessão:

- `login_tunnelhub`
- `current_session_tunnelhub`
- `list_sessions_tunnelhub`
- `list_environments_tunnelhub`
- `switch_environment_tunnelhub`
- `logout_tunnelhub`

## 💬 Exemplos de perguntas

Você pode pedir coisas como:

- `Faça login no TunnelHub`
- `Faça login no TunnelHub para a empresa 4success`
- `Qual sessão está ativa?`
- `Liste os ambientes disponíveis`
- `Liste as automações ativas`
- `Liste os sistemas HTTP do ambiente atual`
- `Mostre o system 1234`
- `Liste os pacotes do ambiente atual`
- `Mostre o package abc`
- `Liste as APIs do API Gateway`
- `Mostre a API 123abc`
- `Liste os clients de autenticacao`
- `Mostre o client xyz`
- `Liste os usage plans`
- `Liste as API keys`
- `Liste os logs da API 123abc`
- `Mostre o log 9988 da API 123abc no timestamp 1710345600`
- `Liste os logs globais do API Gateway no dia 2026-03-13`
- `Liste as tabelas de de/para do ambiente atual`
- `Busque a tabela de de/para CFOP`
- `Liste os itens da tabela de de/para 1234`
- `Me mostre o item abc da tabela de de/para 1234`
- `Ache a execução 9b696080439f no dia 2026-03-13`
- `Resuma a execução 019ce7f3-2707-740c-8692-9b696080439f`
- `Me mostre os traces com ERROR dessa execução`
- `Me mostre os logs dessa execução`
- `Essa execução teve sucesso degradado?`
- `Quais dependências externas falharam nessa execução?`
- `Só usando o MCP, me diga o que precisa ser corrigido nessa automação`

## 🧰 Principais ferramentas disponíveis

### Sessão

- `login_tunnelhub`
- `current_session_tunnelhub`
- `list_sessions_tunnelhub`
- `list_environments_tunnelhub`
- `switch_environment_tunnelhub`
- `logout_tunnelhub`

### Empresas

- `list_tenants_tunnelhub`
- `get_tenant_tunnelhub`

### Tabelas de de/para

- `list_data_stores_tunnelhub`
- `get_data_store_tunnelhub`
- `list_data_store_items_tunnelhub`
- `get_data_store_item_tunnelhub`

### API Gateway

- `list_api_gateways_tunnelhub`
- `get_api_gateway_tunnelhub`
- `list_api_keys_tunnelhub`
- `list_usage_plans_tunnelhub`
- `list_auth_clients_tunnelhub`
- `get_auth_client_tunnelhub`
- `list_auth_resource_servers_tunnelhub`
- `list_api_gateway_logs_tunnelhub`
- `get_api_gateway_log_tunnelhub`
- `list_all_api_gateway_logs_tunnelhub`

### Sistemas

- `list_systems_tunnelhub`
- `get_system_tunnelhub`

### Pacotes

- `list_packages_tunnelhub`
- `get_package_tunnelhub`

### Automações

- `list_automations_tunnelhub`
- `get_automation_tunnelhub`
- `list_automation_deploys_tunnelhub`
- `get_automation_action_logs_tunnelhub`
- `execute_automation_tunnelhub`

### Monitoramento

- `list_automation_executions_tunnelhub`
- `find_execution_tunnelhub`
- `get_execution_tunnelhub`
- `summarize_execution_tunnelhub`
- `get_execution_traces_tunnelhub`
- `get_execution_logs_tunnelhub`

## ⚙️ Variáveis de ambiente

Variáveis suportadas:

- `OAUTH_CALLBACK_PORT` padrão `3333`
- `TUNNELHUB_FRONTEND_URL` opcional
- `TUNNELHUB_API_HOST` opcional; padrão `https://api.tunnelhub.io`

Observações:

- O login usa o fluxo do frontend do TunnelHub
- Quando possível, o MCP reutiliza o domínio personalizado da empresa
- A porta do callback OAuth prefere `3333` e procura outra livre se necessário

## 🧭 Dicas de uso

- Ao procurar uma execução, informe sempre a data ou um intervalo de tempo
- Quando já souber `automationId`, `executionId` e `executionPeriod`, use direto as ferramentas de detalhe
- Para diagnóstico rápido, prefira `summarize_execution_tunnelhub`
- Para investigação detalhada, consulte traces e logs em seguida

## ⚠️ Limitações atuais

- O foco atual está em automações e monitoramento
- API Gateway está disponível em modo somente leitura
- Sistemas e pacotes estão disponíveis em modo somente leitura
- Tabelas de de/para estão disponíveis em modo somente leitura
- API keys e logs podem incluir dados sensíveis retornados pelo backend
- Algumas APIs do backend têm comportamentos específicos de filtro e paginação
- A listagem de execuções depende de intervalo de tempo obrigatório

## 🛠️ Desenvolvimento local

Comandos úteis:

```bash
pnpm install
pnpm typecheck
pnpm build
pnpm dev
```

## 🤝 Contribuições

Feedback, sugestões e contribuições são bem-vindos.

Se você estiver evoluindo o MCP internamente, vale sempre validar:

- Experiência de uso no cliente MCP
- Clareza das respostas textuais
- Consistência dos filtros
- Qualidade dos exemplos do README

## 📚 Documentação técnica

Detalhes técnicos, arquitetura e comportamento interno estão documentados em inglês:

- `docs/technical-overview.md`
