---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - github
  - github-actions
  - github-pages
  - deploy
aliases:
  - GitHub Pages con Actions
  - Pages con Actions
prerequisites:
  - "[[Programmazione/GitHub/Pagine/GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Deploy con GitHub Actions]]"
related:
  - "[[Programmazione/GitHub/Pagine/Environments GitHub Actions]]"
title: GitHub Pages con Actions
---

# GitHub Pages con Actions

## Sintesi

Con **GitHub Pages da Actions**, Git conserva i sorgenti e il workflow consegna a Pages l’output statico. Per questo vault la pagina iniziale si scrive in `Home.md` e si genera come `site/public/index.html`. Non serve committare gli HTML, e modificarli direttamente non cambia la fonte della prossima build.

## Il percorso di una nota in questo repository

1. **Sorgente Pages:** in **Settings → Pages → Build and deployment → Source**, scegli *GitHub Actions* per usare il workflow personalizzato. *Deploy from a branch* è l’altra modalità, pensata per contenuti pubblicabili da un branch. Non aggiungere un secondo workflow per far riconoscere quello esistente.
2. **Evento:** `.github/workflows/deploy-pages.yml` parte al push su `main` o manualmente. Non parte per il solo commit locale o all’apertura di una PR.
3. **Build:** il job `build` esegue checkout, prepara Node 24 e configura Pages. Installazione, plugin, controlli del vault e build girano da `site/`. Il contenuto da caricare è `site/public`, **non** `dist`, la radice del vault o la cartella dei Markdown.
4. **Pubblicazione:** il job `deploy` attende `build`; `actions/deploy-pages` usa l’artifact Pages di quel run. L’output `page_url` è il link della destinazione. La versione online è quella dell’ultimo deployment riuscito, non necessariamente quella dell’ultimo push.

Questi sono gli ultimi passaggi dei due job, **estratti separati dal workflow in uso**. Il primo è uno step di `build`; il secondo è il job sotto `jobs.deploy`. Il workflow dichiara `contents: read`, `pages: write` e `id-token: write`.

```yaml
- name: Upload GitHub Pages artifact
  uses: actions/upload-pages-artifact@v5
  with:
    path: site/public
```

```yaml
environment:
  name: github-pages
  url: ${{ steps.deployment.outputs.page_url }}
runs-on: ubuntu-latest
needs: build
steps:
  - name: Deploy to GitHub Pages
    id: deployment
    uses: actions/deploy-pages@v4
```

## Se il sito non mostra la modifica

| Sintomo | Primo controllo utile |
| --- | --- |
| Nessun run per lo SHA atteso | Verifica push e branch, poi il trigger del workflow. |
| Build o upload fallito | Apri il primo step rosso e verifica che l’output contenga `index.html` alla radice dell’artifact. |
| Upload riuscito, deploy saltato o fallito | Controlla dipendenza, sorgente Pages, permessi ed eventuali regole di `github-pages`. L’upload da solo non pubblica. |
| Home visibile, link interni rotti | Per un sito di progetto il prefisso conta: `site/quartz.config.yaml` usa `perni24.github.io/appunti`. Verifica un link profondo sotto `/appunti/`, non solo la home. |
| Manca una singola nota | Verifica il frontmatter: `publish: true` per una nota di contenuto, niente `draft: true`. Gli indici seguono regole dedicate. |

Un dominio personalizzato o una preview separata cambia la destinazione da verificare. Una build locale permette di controllare l’HTML prima del push, ma non verifica le impostazioni Pages del repository.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Deploy con GitHub Actions|Deploy con GitHub Actions]]
- [[Programmazione/GitHub/Pagine/GitHub Actions|GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Artifacts GitHub Actions|Artifacts GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Environments GitHub Actions|Environments GitHub Actions]]

## Fonti

- [GitHub Docs - Scegliere la sorgente di pubblicazione](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [GitHub Docs - Build, artifact e deploy personalizzati](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [actions/deploy-pages - Requisiti e output](https://github.com/actions/deploy-pages/tree/v4)
