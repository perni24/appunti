---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - github
  - codeowners
  - review
  - permessi
aliases:
  - CODEOWNERS
  - Code owners
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Pull request]]"
  - "[[Programmazione/GitHub/Pagine/Review code su GitHub]]"
related:
  - "[[Programmazione/GitHub/Pagine/Pull request]]"
  - "[[Programmazione/GitHub/Pagine/Review code su GitHub]]"
title: CODEOWNERS
---

# CODEOWNERS

## Sintesi

`CODEOWNERS` risponde alla domanda **«chi deve essere coinvolto nella review di questi file?»**. Non concede accesso al codice e non blocca il merge da solo. Per richiedere un’approvazione configura anche una regola sul branch di destinazione o un ruleset applicabile.

## Quale file viene letto?

GitHub usa il `CODEOWNERS` del **branch base** della pull request, anche se il contributo arriva da un fork. Cerca prima `.github/CODEOWNERS`, poi `CODEOWNERS` nella radice, infine `docs/CODEOWNERS`; legge il primo trovato, senza unirli. Una nuova regola proposta in una PR non decide chi deve approvare quella stessa PR.

Per ricevere la richiesta un utente deve avere accesso **write**; un team deve essere visibile e avere accesso esplicito di scrittura al repository. Usa `@organizzazione/team` per un team: `@team` indica un account utente. Una PR in bozza non genera automaticamente la richiesta agli owner finché non diventa pronta per la review.

## Esempio: dalla regola generale all’eccezione

In `.github/CODEOWNERS`, con nomi di organizzazione e team **da sostituire**:

```text
*                     @example-org/maintainers
*.md                  @example-org/docs
/apps/api/            @example-org/backend
/apps/api/README.md   @example-org/backend @example-org/docs
/.github/workflows/   @example-org/platform
/.github/CODEOWNERS   @example-org/maintainers
```

| Percorso modificato | Owner secondo il file | Perché |
| --- | --- | --- |
| `README.md` | docs | La regola per i Markdown viene dopo il fallback. |
| `apps/api/guida.md` | backend | La regola per la directory viene dopo `*.md`: i risultati non si sommano. |
| `apps/api/README.md` | backend **o** docs | L’ultima riga corrispondente elenca i due team **sulla stessa riga**. |
| `.github/workflows/deploy-pages.yml` | platform | Il pattern è ancorato alla directory dei workflow nella radice. |

Quando è richiesta la review dei code owner, per il file `apps/api/README.md` basta l’approvazione di **uno** dei due owner indicati; il numero totale di review richieste o eventuali altre regole restano separati. Non usare questa sintassi per esprimere «servono entrambi i team».

## Diagnosi: perché non è arrivata la richiesta?

Controlla base della PR, stato di bozza, ultima regola corrispondente e accesso degli owner. I percorsi distinguono maiuscole e minuscole anche se il computer locale non lo fa. La sintassi somiglia a `.gitignore`, ma non ne supporta tutte le forme, tra cui la negazione con `!` e le classi `[abc]`. GitHub segnala le righe non valide nella pagina del file. Assegna un owner anche a `CODEOWNERS` stesso e verifica sul branch protetto che l’approvazione sia effettivamente richiesta.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Pull request|Pull request]]
- [[Programmazione/GitHub/Pagine/Review code su GitHub|Review code su GitHub]]
- [[Programmazione/GitHub/Pagine/Repository GitHub|Repository GitHub]]
- [[Programmazione/GitHub/Pagine/Branch protection rules|Branch protection rules]]

## Fonti

- [GitHub Docs - About code owners](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- [GitHub Docs: protezioni e review richieste](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
