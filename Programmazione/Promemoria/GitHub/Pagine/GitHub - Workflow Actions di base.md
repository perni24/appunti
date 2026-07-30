---
date: 2026-07-30
area: Programmazione
topic: Promemoria GitHub
type: operational-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [github, promemoria, actions, workflow, ci]
aliases: [Cheatsheet GitHub Actions]
prerequisites: []
related:
  - "[[Programmazione/GitHub/Pagine/Workflow GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Pipeline CI GitHub Actions]]"
---

# GitHub - Workflow Actions di base

## Posizione

```text
.github/
`-- workflows/
    `-- ci.yml
```

## Workflow Node.js

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read

concurrency:
  group: ci-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v7

      - name: Setup Node.js
        uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm test

      - name: Build
        run: npm run build
```

## Struttura minima

```yaml
name: Workflow

on:
  workflow_dispatch:

permissions:
  contents: read

jobs:
  job-name:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - run: echo "Hello"
```

## Shell

```yaml
- name: Bash command
  shell: bash
  run: echo "hello"
```

```yaml
- name: PowerShell command
  shell: pwsh
  run: Write-Output "hello"
```

## Directory di lavoro

```yaml
defaults:
  run:
    working-directory: frontend
```

## Variabili

```yaml
env:
  NODE_ENV: test

jobs:
  verify:
    env:
      LOG_LEVEL: warning
```

## Approfondimento

- [[Programmazione/GitHub/Pagine/Workflow GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Sintassi YAML GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Pipeline CI GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Workflow per test, lint e build]]
- [[Programmazione/GitHub/Pagine/Checklist GitHub Actions]]

## Riferimenti

- [GitHub Docs - Workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)
- [actions/checkout](https://github.com/actions/checkout)
- [actions/setup-node](https://github.com/actions/setup-node)
