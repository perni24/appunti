---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [github, github-actions, marketplace, supply-chain]
aliases: [Actions marketplace, GitHub Actions marketplace]
prerequisites: [GitHub Actions, Sintassi YAML GitHub Actions]
related: [Sicurezza dei token GitHub, Dependabot]
---

# Actions marketplace

## Sintesi

L'**Actions marketplace** raccoglie action riutilizzabili per workflow GitHub Actions. Una action puo fare checkout del codice, configurare runtime, pubblicare package, caricare artefatti o integrare servizi esterni.

Usare action esterne velocizza lo sviluppo dei workflow, ma introduce rischio supply chain: vanno scelte, versionate e revisionate.

## Quando usarlo

Usalo quando:

- esiste una action affidabile per un task comune;
- vuoi evitare script ripetuti;
- devi configurare tool standard;
- vuoi integrare servizi cloud o registry;
- vuoi mantenere workflow leggibili;
- vuoi creare azioni riutilizzabili.

## Come funziona

Una action si usa in uno step con `uses`.

```yaml
- uses: actions/checkout@v4
```

Le action possono essere:

- nel marketplace;
- in repository pubblici;
- nello stesso repository;
- in repository privati accessibili;
- in immagini Docker.

## API / Sintassi

Action con input:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 22
    cache: npm
```

Action locale:

```yaml
- uses: ./.github/actions/setup-project
```

Versione fissata:

```yaml
- uses: owner/action@v1
```

Per maggiore rigore puoi fissare anche commit SHA, soprattutto su action terze critiche.

## Esempio pratico

CI Node.js:

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-node@v4
    with:
      node-version: 22
      cache: npm
  - run: npm ci
  - run: npm test
```

Qui `checkout` recupera il codice e `setup-node` prepara il runtime.

## Varianti

- **Official actions**: action mantenute da GitHub o vendor noti.
- **Community actions**: utili ma da revisionare.
- **Local actions**: dentro il repository.
- **Composite actions**: raccolgono step riutilizzabili.
- **Docker actions**: eseguono logica in container.
- **JavaScript actions**: eseguono codice Node.js.

## Errori comuni

- Usare action non mantenute.
- Usare `@main` invece di versione stabile.
- Non leggere permessi richiesti.
- Usare action terze con secret sensibili.
- Non aggiornare action obsolete.
- Non considerare dependency graph per le action.

## Checklist

- L'action e mantenuta?
- La versione e fissata?
- I permessi richiesti sono minimi?
- La action riceve secret?
- Esistono alternative ufficiali?
- Dependabot aggiorna anche GitHub Actions?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[GitHub Actions]]
- [[Sintassi YAML GitHub Actions]]
- [[Dependabot]]
- [[Sicurezza dei token GitHub]]

## Fonti

- [GitHub Docs - Find and customize actions](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/find-and-customize-actions)
