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
  - repository
  - manutenzione
  - hygiene
aliases:
  - Repository hygiene
  - Igiene repository GitHub
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Repository GitHub]]"
  - "[[Programmazione/GitHub/Pagine/README LICENSE e gitignore]]"
related:
  - "[[Programmazione/GitHub/Pagine/Governance repository GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Template organizzativi GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Archiviazione repository GitHub]]"
title: Repository hygiene
---

# Repository hygiene

## Sintesi

Per **repository hygiene** si intende la manutenzione periodica che rende il progetto comprensibile e utilizzabile da chi arriva oggi. Non si misura contando quanti branch o issue si eliminano: un branch di manutenzione vecchio può servire ancora e una segnalazione aperta può descrivere un problema reale.

## Routine di triage

| Controllo | Segnale | Azione utile |
| --- | --- | --- |
| Setup e documentazione | Un clone nuovo non si avvia con le istruzioni del README | Riprovare il percorso documentato, poi correggere prerequisiti o comandi. Verificare anche licenza, descrizione e contatto di sicurezza. |
| Issue e pull request | Ricerca `is:issue is:open no:label` o PR senza risposta | Confermare se il problema è riproducibile, assegnare una priorità o chiedere informazioni. Se si chiude, spiegare perché. |
| Dipendenze e release | Alert non assegnati, bozze ferme, note di aggiornamento mancanti | Assegnare un responsabile, verificare impatto e test; controllare che le release pubblicate corrispondano ai tag attesi. |
| Ciclo di vita | Utenti ancora attivi ma nessun manutentore | Dichiarare lo stato nel README, cercare un successore o valutare l'archiviazione. |

## Esempio: ispezionare senza cancellare

Dalla radice di un clone con `main` aggiornato, elencare i **branch locali** il cui commit di punta è raggiungibile da `main`:

```bash
git branch --merged main --format="%(refname:short)"
```

Anche `main` può apparire. Un merge con squash può invece aver integrato il contenuto **senza** rendere raggiungibile il commit originale. Prima di eliminare un branch, controllare PR, lavoro residuo e necessità del team: l'elenco non è una lista di cancellazione.

Nel vault, i file sorgente sono tracciati, l'HTML generato in `site/public` no. Quali file di quella cartella sono già nell'indice Git?

```bash
git ls-files -- site/public
```

Nessuna riga significa **nessun file tracciato in quel percorso**, non che la cartella sia vuota. Per un file generato non tracciato, chiedere quale regola lo ignora:

```bash
git check-ignore -v -- site/public/index.html
```

L'output indica file delle regole, riga e pattern. Aggiungere un percorso a `.gitignore` non smette di tracciare file già versionati.

## Errori comuni

- Chiudere o eliminare elementi soltanto per anzianità, senza consultare chi li usa.
- Considerare risolto un alert perché è stato letto, senza annotare la decisione.
- Duplicare policy comuni senza sapere quale copia aggiornare. Al termine del triage, lasciare una decisione verificabile o una prossima azione con responsabile.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/README LICENSE e gitignore|README LICENSE e gitignore]]
- [[Programmazione/GitHub/Pagine/Issues GitHub|Issues GitHub]]
- [[Programmazione/GitHub/Pagine/Labels milestones e assignees|Labels milestones e assignees]]
- [[Programmazione/GitHub/Pagine/Dependabot|Dependabot]]
- [[Programmazione/GitHub/Pagine/Secret scanning|Secret scanning]]
- [[Programmazione/GitHub/Pagine/Code scanning|Code scanning]]
- [[Programmazione/GitHub/Pagine/Governance repository GitHub|Governance repository GitHub]]
- [[Programmazione/GitHub/Pagine/Archiviazione repository GitHub|Archiviazione repository GitHub]]

## Fonti

- [GitHub Docs: pratiche di gestione](https://docs.github.com/en/repositories/creating-and-managing-repositories/best-practices-for-repositories)
- [Git: git branch](https://git-scm.com/docs/git-branch)
- [Git: git ls-files](https://git-scm.com/docs/git-ls-files)
- [Git: git check-ignore](https://git-scm.com/docs/git-check-ignore)
