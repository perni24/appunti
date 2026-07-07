---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [github, template, organizzazione, governance]
aliases: [Template organizzativi GitHub, Template GitHub organizzazione]
prerequisites: [Organizzazioni e team GitHub, Issue templates e pull request templates]
related: [Repository hygiene, Governance repository GitHub, CODEOWNERS]
---

# Template organizzativi GitHub

## Sintesi

I **template organizzativi GitHub** standardizzano file e configurazioni comuni tra repository. Possono essere template repository, default community health files nel repository `.github`, issue template, pull request template, CODEOWNERS e file di sicurezza.

Servono a evitare che ogni repository reinventa struttura, checklist e policy.

## Quando usarlo

Usali quando:

- un'organizzazione crea molti repository simili;
- vuoi README, CONTRIBUTING o SECURITY coerenti;
- vuoi template issue e PR comuni;
- vuoi standardizzare configurazioni iniziali;
- vuoi ridurre lavoro manuale nei nuovi repository;
- vuoi separare default organizzativi e personalizzazioni per repository.

## Come funziona

GitHub supporta due pattern principali:

- **template repository**: repository usato come base per crearne altri;
- **repository `.github`**: contiene file di community default usati dai repository che non ne hanno uno proprio.

Il repository `.github` puo fornire file come:

- `CODE_OF_CONDUCT.md`;
- `CONTRIBUTING.md`;
- `SECURITY.md`;
- issue template;
- pull request template;
- funding e support files.

I repository possono sovrascrivere i default aggiungendo file specifici.

## API / Sintassi

Struttura tipica del repository `.github`:

```text
.github/
  CONTRIBUTING.md
  CODE_OF_CONDUCT.md
  SECURITY.md
  ISSUE_TEMPLATE/
    bug_report.yml
    feature_request.yml
  pull_request_template.md
```

Template repository:

```text
template-node-service/
  README.md
  .github/workflows/ci.yml
  .gitignore
  src/
  tests/
```

## Esempio pratico

Organizzazione con molti servizi:

```text
org/.github
  SECURITY.md comune
  CONTRIBUTING.md comune
  issue template comuni

org/template-api-service
  CI base
  Dockerfile
  README iniziale
  struttura cartelle
```

Il primo standardizza policy. Il secondo accelera la creazione di nuovi progetti.

## Varianti

- **Repository `.github`**: default organizzativi.
- **Template repository**: base tecnica per nuovi repository.
- **Issue forms YAML**: template issue piu strutturati.
- **Pull request template**: checklist comune per review.
- **CODEOWNERS comune**: responsabilita su file o cartelle.
- **Template per linguaggio**: Python, Node, Rust, documentazione, librerie.

## Errori comuni

- Usare un template repository per policy che dovrebbero stare in `.github`.
- Duplicare `SECURITY.md` in ogni repository senza motivo.
- Non documentare come aggiornare i template.
- Rendere il template troppo specifico.
- Non lasciare spazio a override locali.
- Confondere issue template globali e template specifici del repository.

## Checklist

- I default comuni sono nel repository `.github`?
- I template tecnici sono in template repository dedicati?
- I file sono mantenuti da owner chiari?
- I repository possono sovrascrivere i default quando serve?
- Le issue e PR template sono coerenti?
- La sicurezza ha un `SECURITY.md` chiaro?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Organizzazioni e team GitHub]]
- [[Issue templates e pull request templates]]
- [[CODEOWNERS]]
- [[README LICENSE e gitignore]]
- [[Repository hygiene]]
- [[Governance repository GitHub]]

## Fonti

- [GitHub Docs - Creating a template repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-template-repository)
- [GitHub Docs - Creating a default community health file](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file)
