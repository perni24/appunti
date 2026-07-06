---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [github, git, branching, workflow]
aliases: [Branching strategy GitHub, Strategia di branch GitHub]
prerequisites: [Branch su GitHub, Pull request]
related: [Branch su GitHub, Pull request, Merge squash e rebase su GitHub]
---

# Branching strategy su GitHub

## Sintesi

Una **branching strategy** definisce come usare branch, pull request e merge in un repository. Serve a evitare caos nella history, conflitti frequenti e deploy non controllati.

La strategia migliore dipende dal progetto: un'app piccola puo usare trunk-based development; un prodotto con release complesse puo richiedere branch di release.

## Quando usarlo

Definisci una strategia quando:

- piu persone lavorano sullo stesso repository;
- vuoi proteggere `main`;
- hai release regolari;
- vuoi CI obbligatoria prima del merge;
- devi separare sviluppo, staging e produzione;
- vuoi ridurre conflitti e branch longevi.

## Come funziona

Gli elementi principali sono:

- branch principale;
- branch di feature;
- branch di fix;
- eventuali branch di release;
- regole di merge;
- branch protection;
- convenzioni di naming.

Una strategia semplice:

```text
main
feature/nome-feature
fix/nome-bug
release/v1.2.0
```

## API / Sintassi

Creare branch con naming chiaro:

```bash
git switch main
git pull
git switch -c feature/export-csv
```

Esempi di naming:

```text
feature/export-csv
fix/login-token-expired
docs/update-readme
chore/update-dependencies
release/v1.4.0
```

## Esempio pratico

Workflow base:

1. `main` sempre stabile;
2. ogni modifica parte da branch dedicato;
3. ogni branch apre una pull request;
4. CI e review sono obbligatorie;
5. merge solo dopo controlli verdi;
6. branch eliminato dopo il merge.

Questo modello e semplice e adatto a molti progetti applicativi.

## Varianti

- **Trunk-based development**: branch piccoli e vita breve.
- **GitHub Flow**: branch, PR, review, merge su `main`.
- **Git Flow**: branch separati per develop, release e hotfix.
- **Release branches**: utili per mantenere versioni attive.
- **Environment branches**: spesso rischiosi se sostituiscono deploy automatizzati.

## Errori comuni

- Branch longevi che divergono troppo da `main`.
- Strategia troppo complessa per il team.
- Fare push diretto su branch protetti.
- Mescolare branch di ambiente e branch di sviluppo.
- Non definire convenzioni di naming.
- Non cancellare branch conclusi.

## Checklist

- `main` rappresenta codice stabile?
- Le modifiche passano da pull request?
- I branch hanno vita breve?
- Esiste naming coerente?
- Le regole di merge sono chiare?
- La strategia e proporzionata al progetto?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Branch su GitHub]]
- [[Pull request]]
- [[Merge squash e rebase su GitHub]]
- [[Review code su GitHub]]
