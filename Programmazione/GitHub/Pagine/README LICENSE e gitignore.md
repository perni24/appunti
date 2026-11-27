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
  - readme
  - license
  - gitignore
  - repository
aliases:
  - README LICENSE e gitignore
  - README
  - LICENSE
  - gitignore
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Repository GitHub]]"
related:
  - "[[Programmazione/GitHub/Pagine/Repository GitHub]]"
title: README LICENSE e gitignore
---

# README LICENSE e gitignore

## Sintesi

Questi tre file rispondono a domande diverse. Il **README** dice come usare il progetto; **LICENSE** specifica a quali condizioni si può riutilizzare il codice; **.gitignore** indica a Git quali file **non ancora tracciati** ignorare. Nessuno dei tre controlla chi può accedere al repository.

## README: verificare il primo avvio

Per un’app Node con `package-lock.json` e script `dev` e `test` realmente definiti in `package.json`, un README minimo potrebbe essere:

````md
# Catalogo

API locale per cercare elementi per nome. Requisiti: Node.js e npm nelle versioni indicate dal progetto.

## Installazione

```bash
npm ci
```

## Avvio

```bash
npm run dev
```

## Test

```bash
npm test
```
````

Adatta il contenuto al progetto: per una libreria mostra una chiamata minima e i requisiti di compatibilità; per un’app indica anche le variabili necessarie, con valori fittizi. Un buon controllo è partire da un clone nuovo e seguire solo le istruzioni scritte. Nel repository GitHub sceglie il README da mostrare cercando nell’ordine `.github/`, radice, `docs/`: controlla questo ordine se viene mostrato il testo sbagliato.

## LICENSE: pubblico non significa open source

Se vuoi permettere il riuso, scegli una licenza coerente con l’obiettivo e includine il testo. Licenze permissive e copyleft impongono condizioni differenti: non basta scrivere «open source» nel README. Senza licenza esplicita, rendere il codice pubblico non concede in generale i diritti di modifica e redistribuzione di una licenza open source. Poter vedere il repository e farne un fork su GitHub è una questione distinta.

## .gitignore: una prova prima del commit

Esempio nella radice di un progetto web:

```gitignore
node_modules/
.env
dist/
coverage/
```

Con un file `.env` locale **non tracciato**, mostra la regola che lo esclude:

```bash
git check-ignore -v -- .env
```

Controlla invece se il file è **già nell’indice**:

```bash
git ls-files -- .env
```

Se il secondo comando stampa `.env`, la regola da sola non lo protegge. Per smettere di tracciarlo lasciando la copia sul disco, verifica innanzitutto il percorso e, solo se vuoi registrare la sua rimozione dal repository, usa:

```bash
git rm --cached -- .env
```

Controlla `git status` prima del commit. L’operazione **non cancella la cronologia**; se quel file conteneva un segreto già condiviso, revoca o ruota la credenziale. Per spiegare la configurazione agli altri, versiona semmai un `.env.example` con nomi delle variabili e valori innocui.

## Checklist

- Scopo, requisiti, avvio e test sono riproducibili? È chiaro quali parti del progetto siano pronte all’uso?
- La licenza esprime il riuso che si vuole consentire?
- Cache, dipendenze ricostruibili e output generati sono esclusi senza nascondere file necessari? Controlla lo staging prima del commit.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Repository GitHub|Repository GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub|GitHub]]

## Fonti

- [GitHub Docs: scelta e visualizzazione del README](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes)
- [GitHub Docs: licenze dei repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository)
- [Git: regole di gitignore e file già tracciati](https://git-scm.com/docs/gitignore)
- [GitHub Docs: ignorare file](https://docs.github.com/en/get-started/git-basics/ignoring-files)
