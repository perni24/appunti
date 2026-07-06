---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: base
tags: [github, readme, license, gitignore, repository]
aliases: [README LICENSE e gitignore, README, LICENSE, gitignore]
prerequisites: [Repository GitHub]
related: [Repository GitHub]
---

# README LICENSE e gitignore

## Sintesi

`README.md`, `LICENSE` e `.gitignore` sono tre file fondamentali in un repository GitHub.

- `README.md`: spiega cosa fa il progetto e come usarlo.
- `LICENSE`: dichiara i termini legali di uso e distribuzione.
- `.gitignore`: indica a Git quali file non versionare.

Sono piccoli, ma determinano quanto un repository e comprensibile, riutilizzabile e sicuro.

## Quando usarlo

Aggiungili quando:

- crei un nuovo repository;
- pubblichi un progetto open source;
- vuoi rendere chiaro come installare o eseguire il codice;
- vuoi evitare di committare cache, build, dipendenze o segreti;
- vuoi chiarire se altri possono usare, modificare o distribuire il progetto.

## Come funziona

GitHub mostra automaticamente il `README.md` nella pagina principale del repository.

Una licenza chiarisce cosa e permesso fare col codice. Senza licenza, un repository pubblico non e automaticamente libero da riusare.

`.gitignore` viene letto da Git e impedisce di aggiungere file che corrispondono ai pattern indicati.

## API / Sintassi

Esempio `README.md` minimo:

````md
# Nome progetto

## Descrizione

Breve spiegazione del progetto.

## Installazione

```bash
npm install
```

## Uso

```bash
npm run dev
```
````

Esempio `.gitignore`:

```gitignore
node_modules/
.env
dist/
coverage/
```

## Esempio pratico

Per un progetto web:

```text
README.md
LICENSE
.gitignore
package.json
src/
tests/
```

Nel `README.md` inserisci almeno:

- scopo;
- requisiti;
- installazione;
- comandi principali;
- variabili d'ambiente richieste;
- come eseguire test;
- stato del progetto.

## Varianti

- **README breve**: adatto a repository personali piccoli.
- **README operativo**: include setup, comandi, troubleshooting.
- **README da libreria**: include API, esempi e compatibilita.
- **Licenza permissiva**: permette uso ampio con pochi vincoli.
- **Licenza copyleft**: impone condizioni piu forti sulla redistribuzione.
- **.gitignore per linguaggio**: Node, Python, Rust, Java, ecc.

## Errori comuni

- Repository senza descrizione.
- README che spiega solo "cosa" ma non "come eseguirlo".
- Inserire credenziali in `.env` e poi committarle.
- Aggiungere `.gitignore` dopo aver gia versionato file da ignorare.
- Pubblicare codice senza licenza e creare ambiguita sul riuso.
- Copiare licenze senza capirne implicazioni.

## Checklist

- Il README spiega lo scopo in poche righe?
- Ci sono istruzioni di installazione?
- Ci sono comandi di esecuzione e test?
- La licenza e coerente con l'obiettivo del progetto?
- `.gitignore` copre file generati e segreti?
- Hai verificato `git status` prima del commit?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Repository GitHub]]
- [[GitHub]]
