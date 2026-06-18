---
date: 2026-06-18
area: Programmi open source
topic: Generazione diagrammi ER da SQL
type: technical-note
status: "non revisionato"
difficulty: base
tags: [open-source, database, sql, er-diagram, schema]
aliases: [SQL to ER diagram, SQL to ERD, DDL to ER diagram]
prerequisites: []
related: [TrailBase]
---

# SQL to ER diagram

## Sintesi

**SQL to ER diagram** indica una categoria di strumenti open source che trasformano definizioni SQL, DDL o DBML in diagrammi Entity-Relationship.

Sono utili quando hai gia uno schema database e vuoi ottenere rapidamente una rappresentazione visuale di tabelle, colonne, chiavi primarie, chiavi esterne e relazioni.

## Quando usarlo

- Documentare uno schema SQL esistente.
- Capire velocemente le relazioni tra tabelle.
- Generare diagrammi per README, documentazione tecnica o onboarding.
- Convertire DDL in formato visuale come PlantUML.
- Verificare se foreign key e cardinalita sono modellate in modo coerente.

## Come funziona

Lo strumento legge un input SQL, di solito istruzioni `CREATE TABLE`, estrae tabelle, colonne, tipi, vincoli e relazioni, poi genera un diagramma ER o un formato intermedio renderizzabile.

Alcuni tool generano direttamente immagini o diagrammi web, altri producono output come PlantUML, Mermaid o DBML.

## Esempio d'uso

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL
);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id)
);
```

Da questo schema lo strumento puo generare un diagramma con due entita, `users` e `orders`, collegate dalla foreign key `orders.user_id -> users.id`.

## Punti forti

- **Documentazione rapida**: crea una vista visuale dello schema.
- **Utile in review**: aiuta a discutere modifiche database.
- **Versionabile**: se genera testo come PlantUML o Mermaid, il risultato si puo salvare in Git.
- **Adatto a reverse engineering**: parte da uno schema gia esistente.

## Limiti

- La qualita dipende da quanto lo schema SQL e esplicito.
- Senza foreign key dichiarate, molte relazioni non possono essere inferite con certezza.
- Dialetti SQL diversi possono avere sintassi non sempre supportata.
- Non sostituisce una buona modellazione dati: visualizza lo schema, non lo corregge.

## Checklist

- Verificare che le foreign key siano dichiarate nello schema.
- Controllare il dialetto SQL supportato dal tool.
- Preferire output testuale se vuoi versionare il diagramma.
- Non fidarti di relazioni inferite solo dai nomi delle colonne.
- Aggiornare il diagramma quando cambiano migrazioni o schema.

## Collegamenti

- [[TrailBase]]
- [[Programmi open source/Indice programmi open source]]
- https://github.com/wangyuheng/ddl2plantuml
- https://github.com/ystemsrx/sql_to_ER
