# WiseData

WiseData e um app de BI conversacional para planilhas. A proposta e permitir que o usuario crie projetos, envie arquivos CSV/XLS/XLSX, visualize um resumo da base e converse com os dados para gerar insights, tabelas, graficos e KPIs.

> Estado atual: o projeto roda em modo mock local para desenvolvimento do frontend. Autenticacao, banco, storage, projetos, mensagens e KPIs sao simulados no navegador com `localStorage`.

## Funcionalidades

- Landing page para apresentacao do produto.
- Fluxo de autenticacao mock.
- Dashboard com criacao e listagem de projetos.
- Upload de planilhas CSV, XLS e XLSX.
- Leitura e analise inicial da planilha, incluindo tipos de coluna, amostras e contagem de valores unicos.
- Tela de projeto com abas para base de dados, resumo, chat e KPIs.
- Chat mock que responde em Markdown usando metadados e amostras da planilha.
- Persistencia local de projetos, fontes de dados, mensagens e KPIs.

## Stack

- React 19
- TypeScript
- Vite
- TanStack Start / TanStack Router
- TanStack Query
- Tailwind CSS
- Radix UI
- Recharts
- PapaParse
- SheetJS (`xlsx`)
- ESLint e Prettier

## Requisitos

- Node.js 22 ou superior recomendado
- npm

## Como Rodar

Instale as dependencias:

```bash
npm install
```

Inicie o ambiente de desenvolvimento:

```bash
npm run dev
```

Depois, abra a URL exibida no terminal, normalmente:

```text
http://localhost:5173
```

## Scripts

```bash
npm run dev
```

Roda o servidor de desenvolvimento com Vite.

```bash
npm run build
```

Gera a build de producao.

```bash
npm run build:dev
```

Gera uma build usando o modo `development`.

```bash
npm run preview
```

Serve localmente a build gerada.

```bash
npm run lint
```

Executa o ESLint no projeto.

```bash
npm run format
```

Formata os arquivos com Prettier.

## Estrutura do Projeto

```text
src/
  components/          Componentes compartilhados e componentes de UI
  features/project/    Paineis da tela de projeto: upload, resumo, chat e KPIs
  hooks/               Hooks reutilizaveis
  integrations/mock/   Backend mock local baseado em localStorage
  lib/                 Utilitarios, parser de planilhas e helpers server-only
  routes/              Rotas do TanStack Router
```

Arquivos importantes:

- `src/routes/index.tsx`: landing page.
- `src/routes/auth.tsx`: autenticacao mock.
- `src/routes/_authenticated/dashboard.tsx`: dashboard de projetos.
- `src/routes/_authenticated/projects.$projectId.tsx`: tela principal do projeto.
- `src/features/project/upload-panel.tsx`: upload e processamento inicial da planilha.
- `src/lib/sheet-parser.ts`: parser e analise de CSV/XLS/XLSX.
- `src/integrations/mock/client.ts`: implementacao mock de auth, banco e storage.
- `src/routes/api/chat.ts`: endpoint local de chat mock.

## Dados e Persistencia Local

Durante o desenvolvimento, o app nao depende de um backend real. Os dados ficam salvos no `localStorage` do navegador:

- `wisedata.mock-session.v1`: sessao do usuario mock.
- `wisedata.mock-db.v1`: projetos, fontes de dados, mensagens e KPIs.

Para limpar o ambiente local, remova essas chaves no DevTools do navegador ou limpe os dados do site.

## Upload de Planilhas

Formatos suportados:

- `.csv`
- `.xls`
- `.xlsx`

O parser extrai:

- linhas e colunas;
- tipos inferidos por coluna (`number`, `date`, `string`, `boolean`);
- valores de amostra;
- contagem aproximada de valores unicos;
- primeiras linhas para uso no resumo e no chat mock.

## Variaveis de Ambiente

No modo atual, nao ha variaveis obrigatorias para rodar o frontend mock.

Configuracoes server-only devem ficar em arquivos `.server.ts`, como `src/lib/config.server.ts`, para evitar que segredos sejam enviados ao bundle do navegador. Variaveis publicas devem usar o prefixo `VITE_`.

## Observacoes de Desenvolvimento

- A integracao real de IA esta desabilitada em `src/lib/ai-gateway.server.ts`.
- O endpoint `/api/chat` retorna uma resposta mock em Markdown para apoiar o desenvolvimento da interface.
- O backend mock imita parte da API de auth, banco e storage para facilitar uma futura troca por um backend real.
- O projeto usa componentes Radix/shadcn-style em `src/components/ui`.

## Licenca

Este projeto ainda nao declara uma licenca.
