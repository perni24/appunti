---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - clean-code
  - profiling
  - performance
aliases:
  - Profiling prima del refactoring
  - Profile before refactoring
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Performance e leggibilita]]"
  - "[[Programmazione/Clean Code/Pagine/Refactoring sicuro]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Hot path]]"
  - "[[Programmazione/Clean Code/Pagine/Ottimizzazione prematura]]"
  - "[[Programmazione/Clean Code/Pagine/Codice testabile]]"
title: Profiling prima del refactoring
---

# Profiling prima del refactoring

## Sintesi

Un **profilo** aiuta a localizzare il costo; un **benchmark** confronta alternative; un test di comportamento verifica che diano ancora il risultato giusto. Non serve profilare prima di rinominare una variabile. Serve una diagnosi quando la ragione dichiarata del cambiamento è «questa operazione è troppo lenta».

## Partire dal sintomo

| Sintomo | Prima osservazione utile | Cosa non puoi concludere |
| --- | --- | --- |
| Richieste lente, CPU poco occupata | Durata dall'ingresso alla risposta, attese per pool, query e rete | Che la funzione più lunga nel sorgente consumi più CPU |
| Processo spesso occupato in calcolo | Profilo CPU campionato con carico rappresentativo | Che la larghezza di un frame misuri anche l'attesa di rete |
| Memoria che cresce tra lotti | Allocazioni e oggetti che restano raggiungibili dopo il lotto | Che il picco di un solo lotto sia un leak |

## Esempio: localizzare le query N+1

Due implementazioni per `DatabaseSync` di Node. Le tabelle sono `projects(id INTEGER PRIMARY KEY)` e `tasks(id INTEGER PRIMARY KEY, project_id INTEGER NOT NULL)`. Ogni risultato contiene l'ID e il numero di attività, **anche per i progetti senza attività**. Per confrontare gli esiti usiamo dati fermi; con scritture concorrenti, più letture separate non sono necessariamente una singola fotografia dei dati.

```js
function countsByProject(db) {
  const projects = db.prepare("SELECT id FROM projects ORDER BY id").all();
  const count = db.prepare("SELECT count(*) AS n FROM tasks WHERE project_id = ?");
  return projects.map(({ id }) => ({ id, n: count.get(id).n }));
}

function countsByJoin(db) {
  return db.prepare(
    "SELECT p.id, count(t.id) AS n FROM projects AS p " +
    "LEFT JOIN tasks AS t ON t.project_id = p.id GROUP BY p.id ORDER BY p.id"
  ).all();
}
```

Con tre progetti, la prima versione **esegue** quattro query, anche se prepara la seconda istruzione una sola volta; la seconda ne esegue una. `LEFT JOIN` conserva il progetto vuoto e `count(t.id)` non conta la riga con `NULL` prodotta dal join. Usare `count(*)` nel join darebbe uno anziché zero. È una spiegazione del numero di query, **non** una misura della percentuale di tempo trascorsa nel database.

## Confronto prima e dopo

1. Fissa volumi, distribuzione delle attività, indici e concorrenza. Raccogli latenza dell'intera richiesta, conteggio query ed errori; non escludere dal confronto le richieste fallite senza segnalarlo.
2. Osserva se i ripetuti accessi sono davvero sul percorso lento. Un SQLite locale evita i viaggi di rete di un database remoto. Un join può comunque richiedere scansioni e memoria: esamina anche il piano.
3. Ripeti sullo stesso carico, distinguendo avvio a freddo da esecuzioni a caldo. Il p95 è il valore entro cui cade circa il 95% delle osservazioni: specifica finestra e numerosità, non chiamarlo «media» né sommare i p95 dei singoli passaggi.

Una query al posto di quattro è un fatto verificabile sul caso sopra. Un miglioramento del p95 va misurato nel sistema a cui interessa quella latenza.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Performance e leggibilita|Performance e leggibilita]]
- [[Programmazione/Clean Code/Pagine/Ottimizzazione prematura|Ottimizzazione prematura]]
- [[Programmazione/Clean Code/Pagine/Hot path|Hot path]]
- [[Programmazione/Clean Code/Pagine/Refactoring sicuro|Refactoring sicuro]]
- [[Programmazione/Clean Code/Pagine/Codice testabile|Codice testabile]]

## Fonti

- Brendan Gregg, *Systems Performance*
- Martin Fowler, *Refactoring*
- Michael Nygard, *Release It!*
- [SQLite: semantica di SELECT e LEFT JOIN](https://www.sqlite.org/lang_select.html)
- [SQLite: differenza tra count(X) e count(*)](https://www.sqlite.org/lang_aggfunc.html#count)
- [Brendan Gregg: interpretare un profilo CPU campionato](https://www.brendangregg.com/FlameGraphs/cpuflamegraphs.html)
