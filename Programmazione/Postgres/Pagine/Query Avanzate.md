---
tags:
  - programmazione
  - postgres
  - teoria
argomento: "Query Avanzate e Joins"
data: "2025-12-21"
stato: 📝 in_elaborazione
---

# Query Avanzate e Joins

## 💡 Concetto Chiave
Le query avanzate permettono di combinare dati da più tabelle (**JOIN**), aggregare informazioni (**GROUP BY**) e filtrare sui risultati aggregati (**HAVING**). Queste operazioni trasformano i dati grezzi in informazioni utili.

---

## 📝 Sintassi

### JOINS
```sql
SELECT t1.colonna, t2.colonna
FROM tabella1 t1
JOIN tabella2 t2 ON t1.id = t2.t1_id;
```
Tipi principali:
- `INNER JOIN`: Solo righe con corrispondenza in entrambe.
- `LEFT JOIN`: Tutte le righe di sinistra, più le corrispondenze di destra (o NULL).
- `RIGHT JOIN`: Tutte le righe di destra (raro).
- `FULL OUTER JOIN`: Tutto da entrambe (unione).

### Aggregazione
```sql
SELECT categoria, COUNT(*)
FROM prodotti
GROUP BY categoria
HAVING COUNT(*) > 5;
```

---

## 💻 Esempi Pratici

Immaginiamo due tabelle: `autori` e `libri`.

### Inner Join (Libri con i loro autori)
```sql
SELECT libri.titolo, autori.nome
FROM libri
INNER JOIN autori ON libri.autore_id = autori.id;
```
*Restituisce solo i libri che hanno un autore valido collegato.*

### Left Join (Tutti gli autori, anche senza libri)
```sql
SELECT autori.nome, COUNT(libri.id) as numero_libri
FROM autori
LEFT JOIN libri ON autori.id = libri.autore_id
GROUP BY autori.nome;
```
*Restituisce tutti gli autori. Se un autore non ha libri, `numero_libri` sarà 0 (grazie al `COUNT` su una colonna che sarebbe NULL).*

### Subquery (Query annidate)
```sql
-- Trova i libri che costano più della media
SELECT titolo, prezzo 
FROM libri 
WHERE prezzo > (SELECT AVG(prezzo) FROM libri);
```

### Window Functions (Analisi su finestre di dati)
Postgres eccelle nelle window functions. Esempio: Classifica dei libri per prezzo all'interno di ogni categoria.
```sql
SELECT 
    titolo, 
    categoria, 
    prezzo,
    RANK() OVER (PARTITION BY categoria ORDER BY prezzo DESC) as posizione
FROM libri;
```

---

## ⚙️ Funzionamento Interno (Teoria)
- **Hash Join vs Nested Loop:** Il pianificatore di query sceglie l'algoritmo di join. `Nested Loop` è buono per pochi dati, `Hash Join` per grandi dataset non ordinati, `Merge Join` per grandi dataset ordinati.
- **Window Functions:** A differenza di `GROUP BY` che collassa le righe, le window functions mantengono le righe originali ma aggiungono una colonna calcolata basata su un set di righe correlate ("window").

---

## ⚠️ Best Practices & "Gotchas"
- ✅ **Da fare:** Usa alias corti per le tabelle (`FROM tabella t`) per rendere le query leggibili.
- ✅ **Da fare:** Indicizza le colonne usate nelle `JOIN` (foreign keys) per migliorare drasticamente le performance.
- ❌ **Da evitare:** `DISTINCT` su query complesse se puoi risolvere con una logica migliore; è spesso costoso.
- 💣 **Errori comuni:** Confondere `WHERE` (filtra righe prima dell'aggregazione) con `HAVING` (filtra gruppi dopo l'aggregazione).

---

## 📚 Riferimenti
- [Documentazione Ufficiale Joins](https://www.postgresql.org/docs/current/queries-table-expressions.html)
- [[Comandi Base]]
