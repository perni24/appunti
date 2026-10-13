---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: non revisionato
publish: true
tags:
  - programmazione
  - postgres
  - sicurezza
  - rls
aliases: []
prerequisites: []
related: []
title: Row Level Security
---

# Row Level Security

## Sintesi

La **Row Level Security** limita quali righe un ruolo puo leggere o modificare. Le policy vengono applicate dal database e sono utili soprattutto in sistemi multi-tenant o con dati sensibili.

## Quando usarlo

Usa RLS quando l'accesso alle righe dipende dall'identita o dal tenant:

- applicazioni multi-tenant;
- isolamento tra clienti;
- utenti che possono vedere solo i propri dati;
- dashboard con dati filtrati per reparto;
- regole di autorizzazione che devono restare nel database;
- difesa aggiuntiva contro query applicative sbagliate.

## Come funziona

RLS si abilita sulla tabella con `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`. Poi si creano policy che definiscono:

- `USING`: quali righe sono visibili o modificabili come target;
- `WITH CHECK`: quali nuove righe o modifiche sono consentite.

Superuser e ruoli con `BYPASSRLS` bypassano RLS. Il proprietario della tabella normalmente la bypassa, ma puo essere assoggettato alle policy con `FORCE ROW LEVEL SECURITY`; questo non limita superuser o `BYPASSRLS`. I test vanno eseguiti con il ruolo applicativo reale.

## API / Sintassi

Abilitare RLS:

```sql
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
```

Policy di lettura:

```sql
CREATE POLICY documents_select_by_tenant
ON documents
FOR SELECT
USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

Policy di scrittura:

```sql
CREATE POLICY documents_write_by_tenant
ON documents
FOR INSERT
WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
```

Impostare il tenant per la transazione della richiesta, usando la stessa connessione per tutti i comandi:

```sql
BEGIN;
SET LOCAL app.tenant_id = '00000000-0000-0000-0000-000000000001';
SELECT id, title FROM documents;
COMMIT;
```

Il backend ricava il tenant dall'identita autenticata e dalle autorizzazioni, non da un parametro client accettato senza verifica. Con query parametrizzate puo usare `SELECT set_config('app.tenant_id', $1, true)` nella stessa transazione; il placeholder dipende dal driver.

`SET` senza `LOCAL` persiste nella sessione anche dopo il commit: una connessione riutilizzata dal pool puo conservare il tenant precedente. `SET LOCAL` dura fino a commit o rollback, ma fuori da una transazione esplicita non imposta il contesto per le query successive. Gestire sempre il rollback in caso di errore e impostare il contesto per ogni richiesta prima delle query protette. Non mescolare questo schema con un tenant persistente di sessione: a fine transazione quel valore tornerebbe attivo.

Un setting `app.*` non autentica un utente: chi puo eseguire SQL arbitrario con quel ruolo puo cambiarlo. Questa policy protegge dai filtri applicativi dimenticati, non da un client SQL non fidato o da SQL injection. Per tali scenari occorre un diverso confine di autorizzazione, per esempio ruoli distinti con policy basate su `current_user`.

## Esempio pratico

Tabella documenti multi-tenant:

```sql
CREATE TABLE documents (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY documents_tenant_select
ON documents
FOR SELECT
USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY documents_tenant_insert
ON documents
FOR INSERT
WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
```

Una query senza filtro esplicito vede comunque solo le righe permesse dalla policy.

## Varianti

- Policy per `SELECT`, `INSERT`, `UPDATE`, `DELETE`.
- Policy permissive o restrittive.
- `FORCE ROW LEVEL SECURITY` per applicare RLS anche all'owner.
- Policy basate su `current_user`.
- Policy basate su setting applicativi come `current_setting('app.tenant_id')`.
- RLS combinata con ruoli read-only/read-write.

## Errori comuni

- Non testare policy con ruoli reali.
- Dimenticare differenza tra `USING` e `WITH CHECK`.
- Usare bypass inconsapevole con owner o superuser.
- Impostare il tenant con dati non validati dall'applicazione.
- Credere che RLS sostituisca tutti i controlli applicativi.
- Dimenticare policy per `INSERT` o `UPDATE`.

## Checklist

- RLS e abilitata sulla tabella?
- Le policy coprono lettura e scrittura?
- I test usano il ruolo applicativo reale?
- Il valore di tenant/user viene impostato in modo sicuro?
- Ogni richiesta imposta il tenant dentro la propria transazione, sulla stessa connessione?
- I test coprono due tenant consecutivi sulla stessa connessione e il rollback dopo un errore?
- L'owner non viene usato come runtime user?
- Esistono test per tentativi di accesso cross-tenant?

## Collegamenti

- [[Programmazione/PostgreSQL/Pagine/Ruoli e privilegi avanzati|Ruoli e privilegi avanzati]]
- [[Programmazione/PostgreSQL/Pagine/Gestione Utenti e Ruoli|Gestione Utenti e Ruoli]]
- [[Programmazione/PostgreSQL/Pagine/Sicurezza delle estensioni|Sicurezza delle estensioni]]
- [[Programmazione/PostgreSQL/Pagine/Connection Pooling|Connection Pooling]]

## Fonti

- [PostgreSQL - Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [PostgreSQL - SET](https://www.postgresql.org/docs/current/sql-set.html)
- [PostgreSQL - Customized Options](https://www.postgresql.org/docs/current/runtime-config-custom.html)


## Navigazione

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
