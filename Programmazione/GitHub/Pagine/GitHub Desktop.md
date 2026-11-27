---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - github
  - desktop
  - git
  - gui
aliases:
  - GitHub Desktop
prerequisites:
  - "[[Programmazione/GitHub/Pagine/GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Git e GitHub]]"
related:
  - "[[Programmazione/GitHub/Pagine/Branch su GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Pull request]]"
title: GitHub Desktop
---

# GitHub Desktop

## Sintesi

**GitHub Desktop** mostra graficamente lo stato di un clone Git. È utile per leggere il diff, selezionare file o righe e registrare commit piccoli. Un commit in **History** esiste già nel clone: non è necessariamente su GitHub.

## Prima di cliccare

| Controllo | Domanda a cui risponde |
| --- | --- |
| Current Repository / Current Branch | In quale clone e su quale branch sto lavorando? |
| Changes | Quali modifiche locali ci sono? Quali file o righe ho selezionato per il prossimo commit? |
| History | Quali commit esistono già su questo branch? |
| Fetch origin / Pull origin | Il fetch aggiorna i riferimenti remoti conosciuti. Il pull porta i cambiamenti remoti nel branch corrente e può richiedere di risolvere conflitti. |
| Publish branch / Push origin | Il primo pubblica un nuovo branch locale; il secondo invia i commit di un branch già pubblicato. Nessuno dei due apre automaticamente una PR. |

## Esempio: pubblicare solo la correzione al README

1. Apri il clone giusto. Da **Current Branch** crea `docs/avvio` a partire dalla base desiderata. Verifica il nome del branch **prima** di modificare.
2. Nell’editor modifica `README.md` e, separatamente, un file di appunti che non vuoi condividere. In **Changes** leggi il diff, seleziona il README e deseleziona gli appunti. Deselezionare **non** elimina la modifica dal disco.
3. Scrivi un messaggio che descriva la correzione e fai commit sul branch. Verifica due risultati distinti: il README compare nel nuovo commit in **History**; gli appunti sono ancora in **Changes**.
4. Usa **Publish branch** (oppure **Push origin** se esiste già sul server). Solo a questo punto apri la PR, controllando base e head.

## Controllo incrociato dal terminale

Desktop ed editor lavorano sugli stessi file del clone. Dopo il commit, dalla directory del progetto:

```bash
git status --short
```

Mostra ciò che resta nel working tree o nello staging. Per vedere quali percorsi contiene la modifica dell’ultimo commit ordinario, non ciò che è ancora sul disco:

```bash
git show --name-only --format= HEAD
```

Se dopo **Fetch origin** non vedi file nuovi nell’editor, è normale: il fetch non integra i commit. Se il push viene rifiutato, confronta prima le storie; non usare un push forzato per far sparire l’avviso.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub|GitHub]]
- [[Programmazione/GitHub/Pagine/Git e GitHub|Git e GitHub]]
- [[Programmazione/GitHub/Pagine/Branch su GitHub|Branch su GitHub]]
- [[Programmazione/GitHub/Pagine/Pull request|Pull request]]

## Fonti

- [GitHub Docs - GitHub Desktop](https://docs.github.com/en/desktop)
- [GitHub Desktop: selezionare file o righe e creare un commit](https://docs.github.com/en/desktop/making-changes-in-a-branch/committing-and-reviewing-changes-to-your-project-in-github-desktop)
- [GitHub Desktop: fetch, pull e sincronizzazione](https://docs.github.com/en/desktop/working-with-your-remote-repository-on-github-or-github-enterprise/syncing-your-branch-in-github-desktop)
