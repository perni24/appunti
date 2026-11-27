---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: operational-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - github
  - github-pages
  - documentazione
  - procedura
aliases:
  - Pubblicare documentazione con GitHub Pages
  - Deploy documentazione GitHub Pages
prerequisites:
  - "[[Programmazione/GitHub/Pagine/GitHub Pages con Actions]]"
  - "[[Programmazione/GitHub/Pagine/Repository GitHub]]"
related:
  - "[[Programmazione/GitHub/Pagine/Deploy con GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Environments GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Workflow GitHub Actions]]"
title: Pubblicare documentazione con GitHub Pages
---

# Pubblicare documentazione con GitHub Pages

## Obiettivo

Pubblicare la versione verificata degli appunti con **il workflow Quartz già presente**. I Markdown restano i sorgenti tracciati; `site/public` è un risultato della build. Non serve un branch di HTML, né un secondo workflow di deploy.

## Procedura per questo vault

1. **Scegliere la pagina da rendere visibile.** Modificare il Markdown nella sua area e collegarlo dall'indice. Le note di contenuto devono avere `publish: true` e non `draft: true`; Home e indici seguono le regole dedicate del vault. Una build riuscita non rende pubblica una nota esclusa.
2. **Provare l'output locale.** Dalla radice, con le dipendenze di `site` e i plugin installati come nel workflow, eseguire:

```bash
npm --prefix site run site:build
```

   La home attesa è `site/public/index.html`. Per aprire home, nota e collegamenti nello stesso sottopercorso previsto online, avviare la preview e seguire l'URL indicato nel terminale:

```bash
npm --prefix site run site:preview
```

3. **Configurare la sorgente una volta.** Con permessi amministrativi e Pages disponibile per il repository, in *Settings → Pages → Build and deployment → Source* scegliere **GitHub Actions**. *Deploy from a branch* è una modalità alternativa per chi pubblica da un branch e dalla sua radice o da `/docs`; non è un secondo passaggio per Quartz.
4. **Pubblicare i sorgenti.** Dopo la verifica, inviare le modifiche al branch `main` tramite il normale flusso del progetto. Un commit soltanto locale o un push al solo branch di lavoro non attivano il deploy di questo vault. Per ripubblicare `main` senza modifiche, usare *Actions → Deploy Quartz to GitHub Pages → Run workflow* selezionando `main`.
5. **Controllare la consegna.** Nel run per il commit atteso, `build` deve caricare l'artifact da `site/public` e `deploy` deve completarsi nell'environment `github-pages`. Aprire il link dell'environment e verificare una modifica riconoscibile nella nota, non solo la home. Caricare l'artifact non basta a rendere online la nuova versione.

## Diagnosi per sintomo

| Sintomo | Controllo discriminante |
| --- | --- |
| Compare anche una build Pages del branch | Controllare la sorgente in *Settings → Pages* prima di aggiungere o disabilitare workflow. |
| Build verde, pagina assente | Cercare prima l'HTML nella build locale. Se manca, controllare pubblicabilità e percorso della nota; se esiste, confrontare commit e ultimo **deploy** riuscito. |
| Repository visibile, sito in 404 | Usare l'URL Pages del deployment, non quello dei sorgenti. L'artifact deve avere `index.html` alla radice; `pages: write` e `id-token: write` servono per il job di deployment. |
| Home visibile, CSS o pagine interne in 404 | Controllare i link sotto `/appunti/` e `configuration.baseUrl` in `site/quartz.config.yaml`. Aprire l'HTML via filesystem non riproduce il percorso del sito. |

## Altri generatori e domini

Per un sito diverso, caricare **la directory che contiene l'index generato**: può essere `dist` o altro. Il nome non si deduce da GitHub Pages. Con dominio personalizzato, configurare dominio nelle impostazioni Pages e record dal provider DNS; nel deploy con workflow personalizzato il **file** `CNAME` non è richiesto ed è ignorato. È distinto dal **record DNS** CNAME eventualmente richiesto per un sottodominio.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub Pages con Actions|GitHub Pages con Actions]]
- [[Programmazione/GitHub/Pagine/Deploy con GitHub Actions|Deploy con GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Workflow GitHub Actions|Workflow GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Environments GitHub Actions|Environments GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Permissions GitHub Actions|Permissions GitHub Actions]]

## Fonti

- [GitHub Docs: scegliere la sorgente di pubblicazione](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [GitHub Docs: artifact e deploy nei workflow Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [GitHub Docs: configurare un dominio personalizzato](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
