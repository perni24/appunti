---
date: 2026-05-20
area: Programmazione
topic: Postgres
type: technical-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - postgres
  - sicurezza
  - rls
aliases: []
prerequisites: []
related: []
---

# Row Level Security

## Sintesi

La **Row Level Security** (RLS) limita quali righe un ruolo puo leggere o modificare, applicando policy direttamente nel database.

## Concetto chiave

RLS sposta una parte dell'autorizzazione dal codice applicativo al database.

```sql
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation
ON documents
USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

## Quando usarla

- Multi-tenancy.
- Isolamento per utente.
- Dati sensibili con regole centralizzate.

## Errori comuni

- Non testare policy con ruoli reali.
- Dimenticare differenza tra `USING` e `WITH CHECK`.
- Usare bypass inconsapevole con owner o superuser.

## Quando usarlo

- Da completare: indicare scenari pratici in cui questa nota e utile.

## Come funziona

Da completare: spiegare il meccanismo principale o il comportamento tecnico.

## API / Sintassi

```text
Da completare con API o sintassi principale.
```

## Esempio pratico

```text
Da completare con un esempio pratico.
```

## Varianti

- Da completare: varianti, alternative o differenze rispetto ad approcci simili.

## Checklist

- Da completare: controlli essenziali prima di usare questo concetto in pratica.

## Collegamenti
- [[Programmazione/Postgres/Pagine/Ruoli e privilegi avanzati|Ruoli e privilegi avanzati]]
- [[Programmazione/Postgres/Pagine/Gestione Utenti e Ruoli|Gestione Utenti e Ruoli]]
- [[Programmazione/Postgres/Pagine/Sicurezza delle estensioni|Sicurezza delle estensioni]]


