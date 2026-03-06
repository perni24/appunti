---
date: 2026-03-06
tags:
  - database
  - postgres
  - performance
  - indici
type: #permanent-note
status: evergreen
---

# Tipi di Indici in PostgreSQL

## 💡 Concetto Chiave
Gli **Indici** sono strutture di dati ausiliarie progettate per velocizzare il recupero delle righe filtrando i dati senza dover scansionare l'intera tabella (*Sequential Scan*). PostgreSQL offre una vasta gamma di tipi di indici, ognuno ottimizzato per specifici tipi di dati e operatori di confronto.

---

## 🏗️ Panoramica dei Tipi di Indici

### 1. B-Tree (Balanced Tree)
È il tipo di indice predefinito. È estremamente versatile e gestisce la maggior parte dei tipi di dati comuni.
- **Utilizzo**: Operatori di confronto standard (`<`, `<=`, `=`, `>=`, `>`).
- **Ottimale per**: Ricerche puntuali e ordinamenti (range queries).

### 2. Hash
Memorizza un hash a 32 bit del valore della colonna indicizzata.
- **Utilizzo**: Solo per operatori di uguaglianza (`=`).
- **Nota**: In passato erano sconsigliati, ma dalla versione 10+ sono robusti e performanti. Non supportano l'ordinamento.

### 3. GIN (Generalized Inverted Index)
Fondamentale per dati "multivalore" dove una singola colonna contiene più elementi ricercabili.
- **Utilizzo**: [[Pagine/Tipi di Dato|Array]], [[Pagine/Full Text Search|Full Text Search]], `JSONB`.
- **Punto di forza**: Ideale quando si ha bisogno di indicizzare le chiavi o i valori all'interno di un documento JSON.

### 4. GiST (Generalized Search Tree)
Una struttura ad albero bilanciata che permette di implementare schemi di indicizzazione personalizzati.
- **Utilizzo**: Dati geometrici (punti, poligoni), range types, Full Text Search.
- **Operatori**: "contiene", "all'interno di", "distanza minima".

### 5. BRIN (Block Range Index)
Invece di indicizzare ogni riga, BRIN memorizza i valori minimi e massimi di ogni blocco di pagine.
- **Utilizzo**: Tabelle gigantesche (miliardi di righe) dove i dati hanno una correlazione naturale con l'inserimento fisico (es. log cronologici, sensori).
- **Vantaggio**: Occupano uno spazio infinitesimale rispetto a un B-Tree.

### 6. SP-GiST (Space-Partitioned GiST)
Ottimizzato per partizionare spazi non bilanciati.
- **Utilizzo**: Strutture a prefisso (Trie), alberi quadrati, dati con distribuzioni molto irregolari.

---

## ⚙️ Logic Layer: Quale indice scegliere?

> [!IMPORTANT] Criteri di Selezione
> 1. **Dati standard (Stringhe, Numeri)**: Sempre **B-Tree**.
> 2. **Dati JSONB**: Quasi sempre **GIN** per permettere ricerche veloci sulle chiavi interne.
> 3. **Dati Geografici (PostGIS)**: Sempre **GiST**.
> 4. **Tabelle di Log enormi (Time Series)**: Considera **BRIN** per risparmiare spazio su disco pur mantenendo prestazioni di scansione accettabili.

---

## ⚠️ Best Practices
- **Non indicizzare tutto**: Ogni indice rallenta le operazioni di scrittura (`INSERT`, `UPDATE`, `DELETE`) perché Postgres deve aggiornare anche l'indice.
- **Indici su Foreign Keys**: Postgres non crea automaticamente indici sulle chiavi esterne; ricordati di crearli se prevedi frequenti `JOIN`.
- **Monitoraggio**: Usa `pg_stat_user_indexes` per identificare indici mai utilizzati che consumano spazio e risorse inutilmente.
- **CREATE INDEX CONCURRENTLY**: In ambienti di produzione, usa questa keyword per creare un indice senza bloccare le scritture sulla tabella.

---
