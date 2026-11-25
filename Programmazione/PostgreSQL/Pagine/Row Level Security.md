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

I `GRANT` decidono se un ruolo può compiere un'operazione sulla tabella; la Row Level Security (RLS) limita **su quali righe**. Con RLS attiva e nessuna policy applicabile, l'accesso ordinario alle righe è negato per default. Una policy non concede da sola `SELECT` o `UPDATE`.

## Leggere una policy

- `USING` valuta la riga **esistente**: una riga esclusa non compare nella lettura né tra i bersagli di `UPDATE` o `DELETE`. Puoi ottenere zero righe senza un errore.
- `WITH CHECK` valuta la riga **proposta** da `INSERT` o `UPDATE`. Se non è ammessa, lo statement fallisce; non viene semplicemente ignorato.
- Le policy permissive applicabili si combinano con `OR`, le restrittive con `AND`; occorre almeno una policy permissiva che consenta l'operazione. Non fare i test come superuser, owner o ruolo `BYPASSRLS`. `FORCE ROW LEVEL SECURITY` assoggetta normalmente anche l'owner, ma non neutralizza i ruoli amministrativi esenti.

## Laboratorio: due richieste sulla stessa connessione

Database di prova vuoto. Il primo blocco richiede un amministratore e crea oggetti di laboratorio persistenti. I successivi simulano un ruolo runtime che non possiede la tabella.

```sql
CREATE ROLE lab_docs_user NOLOGIN;
CREATE SCHEMA lab_rls;
CREATE TABLE lab_rls.documents (
  id integer PRIMARY KEY, tenant_id uuid NOT NULL, title text NOT NULL
);
INSERT INTO lab_rls.documents VALUES
  (1, '00000000-0000-0000-0000-000000000001', 'Alfa'),
  (2, '00000000-0000-0000-0000-000000000002', 'Beta');
GRANT USAGE ON SCHEMA lab_rls TO lab_docs_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON lab_rls.documents TO lab_docs_user;
ALTER TABLE lab_rls.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_documents ON lab_rls.documents FOR ALL TO lab_docs_user
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
```

```sql
SET ROLE lab_docs_user;
BEGIN;
SET LOCAL app.tenant_id = '00000000-0000-0000-0000-000000000001';
SELECT title FROM lab_rls.documents;
COMMIT;
SELECT count(*) AS senza_contesto FROM lab_rls.documents;
```

```sql
BEGIN;
SET LOCAL app.tenant_id = '00000000-0000-0000-0000-000000000002';
SELECT title FROM lab_rls.documents;
ROLLBACK;
SELECT count(*) AS senza_contesto FROM lab_rls.documents;
RESET ROLE;
```

Nella stessa sessione, senza valore persistente di `app.tenant_id`, i risultati sono `Alfa`, `0`, `Beta`, `0`. Il secondo argomento di `current_setting` gestisce un parametro assente; `nullif` gestisce anche il valore vuoto dopo la transazione. Un UUID non valido produce un errore: valida il contesto prima di avviare il lavoro.

## Confine di fiducia e controlli

Il backend deve ricavare il tenant dall'identità autenticata e dalle autorizzazioni, non accettarlo come identità dichiarata dal client. Può impostarlo con `set_config('app.tenant_id', $1, true)` sulla **stessa connessione e nella stessa transazione** delle query. Il setting è contesto applicativo, non una credenziale: questo modello protegge da un filtro dimenticato, non autentica client ai quali è consentito scegliere il setting. Per accessi SQL diretti valuta invece policy legate a identità database distinte.

Con un pool non usare `SET` di sessione per il tenant. Imposta il contesto per ogni richiesta, chiudi sempre la transazione anche in caso di errore e verifica sia commit sia rollback. Come prova negativa controlla che il tenant non possa vedere una riga altrui né salvare una propria riga attribuendola a un altro tenant.

## Fonti

[PostgreSQL 18: Row Security Policies](https://www.postgresql.org/docs/18/ddl-rowsecurity.html) · [SET e SET LOCAL](https://www.postgresql.org/docs/18/sql-set.html) · [Opzioni di configurazione personalizzate](https://www.postgresql.org/docs/18/runtime-config-custom.html)

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Ruoli e privilegi avanzati|Ruoli e privilegi avanzati]]
- [[Programmazione/PostgreSQL/Pagine/Gestione Utenti e Ruoli|Gestione Utenti e Ruoli]]
- [[Programmazione/PostgreSQL/Pagine/Sicurezza delle estensioni|Sicurezza delle estensioni]]
- [[Programmazione/PostgreSQL/Pagine/Connection Pooling|Connection Pooling]]
