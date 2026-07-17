---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [github, git, commit, history]
aliases: [Commit GitHub, Cronologia GitHub]
prerequisites: [Git e GitHub]
related: [Branch su GitHub, Pull request]
---

# Commit e cronologia su GitHub

## Sintesi

Un **commit** e uno snapshot della modifica salvato nella cronologia Git. GitHub visualizza i commit, permette di esplorare diff, blame, history dei file e collega i commit a branch, pull request, issue e release.

Una buona cronologia non serve solo a "salvare": serve a capire perche il codice e cambiato.

## Quando usarlo

Cura commit e cronologia quando:

- lavori su una pull request;
- vuoi rendere una review piu semplice;
- devi capire quando e stato introdotto un bug;
- vuoi collegare modifiche a issue o release;
- vuoi mantenere un progetto leggibile nel tempo.

## Come funziona

Un commit contiene:

- identificativo hash;
- autore;
- data;
- messaggio;
- diff rispetto al commit precedente;
- riferimento al parent commit.

GitHub mostra questa cronologia nella scheda `Commits` e nelle pagine dei file. In una pull request, GitHub mostra i commit e il diff complessivo.

## API / Sintassi

Creare un commit:

```bash
git status
git add file.md
git commit -m "Aggiunge documentazione setup"
```

Vedere la cronologia:

```bash
git log --oneline --graph --decorate
```

Vedere differenze:

```bash
git diff
git diff main...HEAD
```

Modificare l'ultimo commit prima del push:

```bash
git commit --amend
```

## Esempio pratico

Commit leggibile:

```bash
git add src/auth.js tests/auth.test.js
git commit -m "Valida token scaduti nel login"
```

Commit poco utile:

```bash
git commit -m "fix"
```

Il primo aiuta review e debug. Il secondo costringe a leggere il diff per capire cosa e successo.

## Varianti

- **Commit atomico**: contiene una singola modifica logica.
- **Commit di fix**: corregge un problema specifico.
- **Commit di refactor**: cambia struttura senza cambiare comportamento.
- **Commit di merge**: unisce due linee di sviluppo.
- **Commit squashato**: risultato di piu commit compressi in uno.

## Errori comuni

- Fare commit enormi con molte modifiche non correlate.
- Usare messaggi generici.
- Committare file temporanei o generati.
- Mescolare refactor e cambio comportamento nello stesso commit.
- Riscrivere history gia condivisa senza coordinarsi.
- Pensare che il commit sia su GitHub prima del `push`.

## Checklist

- Il commit ha un obiettivo chiaro?
- Il messaggio spiega cosa cambia?
- Il diff contiene solo file attesi?
- Hai escluso segreti e file generati?
- I test o controlli collegati passano?
- La cronologia aiuta una futura review?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Git e GitHub]]
- [[Branch su GitHub]]
- [[Pull request]]

## Fonti

- [GitHub Docs - About commits](https://docs.github.com/en/pull-requests/committing-changes-to-your-project/creating-and-editing-commits/about-commits)
