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
  - release
  - checklist
  - versioning
aliases:
  - Checklist release GitHub
  - Checklist rilascio GitHub
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Gestione release su GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Tag, versioni e changelog|Tag, versioni e changelog]]"
related:
  - "[[Programmazione/GitHub/Pagine/Release automation GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Protected tags]]"
  - "[[Programmazione/GitHub/Pagine/Deploy con GitHub Actions]]"
title: Checklist release GitHub
---

# Checklist release GitHub

## Obiettivo

Decidere se pubblicare **questa versione, da questo commit, con questi file**. Un tag identifica codice; la release aggiunge note e asset; il deploy aggiorna un ambiente. Le tre cose possono accadere in tempi diversi.

## Prima di creare la bozza

- [ ] **Versione.** Il numero rispetta la politica del progetto. Per una patch descrivere la correzione; per un cambio incompatibile indicare cosa smette di funzionare e come migrare. Se il changelog fa parte dei sorgenti distribuiti, aggiornarlo prima del tag.
- [ ] **Commit.** Recuperare lo SHA completo del commit che ha superato i test di release. Verificare l'identità del remoto `origin` e confrontare quel commit con il tag remoto previsto. Un job verde successivo sul branch non certifica la versione precedente.
- [ ] **Asset.** Elencare in anticipo file, piattaforme e formati promessi. Controllare un download o un'installazione di prova; se sono previsti checksum, firme o attestazioni, verificarli sui file che saranno distribuiti. L'archivio dei sorgenti non sostituisce un binario.

Per il tag di esempio `v1.2.0`, da un clone con accesso al remoto, leggere i riferimenti senza modificarli:

```bash
git ls-remote --tags origin "refs/tags/v1.2.0" "refs/tags/v1.2.0^{}"
```

Per un **tag annotato** la prima riga del tag identifica l'oggetto tag; confrontare con il commit testato la riga che termina in `^{}`. Per un **tag leggero su commit**, confrontare direttamente lo SHA della riga senza suffisso. Se manca il tag, il comando può non stampare nulla: non proseguire. Se i commit non coincidono, non spostare silenziosamente un tag già pubblico.

## Bozza e decisione di pubblicazione

Preparare `note-v1.2.0.md` con le note **di questa versione**, non l'intero changelog. Solo dopo i controlli, con GitHub CLI autenticata e permesso di scrittura, questo comando **crea una bozza sul remoto**; non la pubblica. Sostituire `OWNER/REPO` e verificare che sia lo stesso repository controllato come `origin`.

```bash
gh release create v1.2.0 --repo OWNER/REPO --verify-tag --draft --title "v1.2.0" --notes-file note-v1.2.0.md
```

`--verify-tag` blocca la creazione se il tag remoto non esiste; **non verifica lo SHA** al posto tuo. Allegare alla bozza gli asset concordati. Per una beta usare un tag distinto e contrassegnarla come pre-release: «bozza» indica visibilità prima della pubblicazione, «pre-release» indica maturità.

```bash
gh release view v1.2.0 --repo OWNER/REPO --json tagName,isDraft,isPrerelease,assets,url
```

- [ ] **Via libera:** tag e CI corrispondono, note e migrazioni sono leggibili, file previsti presenti e verificati, destinatari e piano di recupero noti. Solo a questo punto pubblicare la bozza.
- [ ] **Dopo la pubblicazione:** aprire la release con gli accessi di un normale destinatario. Se sono previsti package o deploy, verificarne separatamente versione ed esito. Nel vault Quartz, pubblicare una release non attiva di per sé il deploy Pages.
- [ ] **Se qualcosa non torna:** mantenere la bozza e annotare la verifica mancante. Se la versione è già pubblica, comunicare il problema e pianificare una correzione senza riutilizzare il tag.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Gestione release su GitHub|Gestione release su GitHub]]
- [[Programmazione/GitHub/Pagine/Tag, versioni e changelog|Tag, versioni e changelog]]
- [[Programmazione/GitHub/Pagine/Release automation GitHub Actions|Release automation GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Protected tags|Protected tags]]
- [[Programmazione/GitHub/Pagine/Deploy con GitHub Actions|Deploy con GitHub Actions]]
- [[Programmazione/GitHub/Pagine/GitHub Packages con Actions|GitHub Packages con Actions]]

## Fonti

- [Git: identificativi dei tag remoti](https://git-scm.com/docs/git-ls-remote)
- [GitHub CLI: verifica del tag e creazione della bozza](https://cli.github.com/manual/gh_release_create)
- [GitHub CLI: ispezionare una release](https://cli.github.com/manual/gh_release_view)
- [GitHub Docs: gestione e pubblicazione delle release](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)
