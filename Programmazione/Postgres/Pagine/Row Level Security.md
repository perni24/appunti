---
date: 2026-06-02
area: Programmazione
topic: Postgres
type: technical-note
status: "non revisionato"
publish: true
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

Owner e superuser possono bypassare RLS, salvo configurazioni specifiche. Per questo i test vanno eseguiti con ruoli realistici, non con superuser.

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

Impostare il tenant nella sessione:

```sql
SET app.tenant_id = '00000000-0000-0000-0000-000000000001';
```

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
- L'owner non viene usato come runtime user?
- Esistono test per tentativi di accesso cross-tenant?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Ruoli e privilegi avanzati|Ruoli e privilegi avanzati]]
- [[Programmazione/Postgres/Pagine/Gestione Utenti e Ruoli|Gestione Utenti e Ruoli]]
- [[Programmazione/Postgres/Pagine/Sicurezza delle estensioni|Sicurezza delle estensioni]]
