---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: operational-note
status: "non revisionato"
difficulty: base
tags: [github, pull-request, review, procedura]
aliases: [Aprire una pull request corretta, Creare una PR corretta]
prerequisites: [Pull request, Branch su GitHub, Commit e cronologia su GitHub]
related: [Review code su GitHub, Issues GitHub, Conventional commits su GitHub]
---

# Aprire una pull request corretta

## Obiettivo

Aprire una pull request chiara, revisionabile e collegata al lavoro giusto, evitando PR troppo grandi, descrizioni vaghe o branch non aggiornati.

Una pull request corretta non e solo una richiesta di merge: e un pacchetto leggibile di contesto, codice, motivazione, test e rischi.

## Quando usarlo

Usa questa procedura quando:

- proponi una modifica a un repository;
- vuoi far revisionare codice;
- vuoi collegare una modifica a una issue;
- lavori su branch separato;
- devi passare controlli CI e review.

## Procedura

1. Crea un branch con nome descrittivo.
2. Fai commit piccoli e coerenti.
3. Esegui test, lint o build in locale se possibile.
4. Fai push del branch.
5. Apri la pull request verso il branch corretto, di solito `main`.
6. Scrivi titolo chiaro.
7. Compila descrizione, motivazione, test eseguiti e impatto.
8. Collega issue correlate.
9. Aggiungi reviewer, label e assignee se richiesti.
10. Controlla CI, conflitti e file modificati prima di chiedere review.

## Snippet

Flusso base:

```bash
git switch -c feature/login-validation
git add .
git commit -m "Add login validation"
git push -u origin feature/login-validation
gh pr create --base main --head feature/login-validation
```

Template descrizione:

```md
## Cosa cambia

- 

## Perche

- 

## Test

- [ ] Test locali
- [ ] CI passata

## Rischi

- 
```

## Adattamenti comuni

- **PR piccola**: ideale per review rapide.
- **PR draft**: utile quando vuoi feedback prima che sia pronta.
- **PR da fork**: comune in open source.
- **PR collegata a issue**: usa parole come `Closes #123`.
- **PR con breaking change**: evidenzia impatto e migrazioni.

## Debug rapido

- Se non puoi aprire la PR, controlla permessi e branch sorgente.
- Se la PR punta al branch sbagliato, cambia base branch.
- Se ci sono conflitti, aggiorna il branch con `main`.
- Se la CI non parte, controlla trigger e path del workflow.
- Se la review e lenta, riduci dimensione o aggiungi contesto.

## Checklist finale

- Branch descrittivo.
- Titolo chiaro.
- Descrizione completa.
- Issue collegata se esiste.
- Test dichiarati.
- CI passata o errore spiegato.
- Nessun file accidentale incluso.
- Reviewer corretti assegnati.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Branch su GitHub]]
- [[Commit e cronologia su GitHub]]
- [[Pull request]]
- [[Review code su GitHub]]
- [[Issues GitHub]]
- [[Conventional commits su GitHub]]

## Fonti

- [GitHub Docs - Creating a pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request)
