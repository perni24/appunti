---
date: 2026-07-11
area: Linux
topic: Elaborazione testi
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [linux, grep, sed, awk, testo, pipeline]
aliases: [grep sed awk, Strumenti Unix per il testo]
prerequisites: [Pipe e ridirezioni, Espressioni regolari]
related: [Bash, Variabili e quoting]
---

# Elaborazione testi con grep, sed e awk

## Sintesi

`grep`, `sed` e `awk` elaborano testo riga per riga e si combinano bene nelle pipeline, ma risolvono problemi diversi. `grep` seleziona righe, `sed` applica trasformazioni a un flusso e `awk` elabora record e campi con un piccolo linguaggio orientato ai dati.

La scelta dello strumento più semplice per il compito rende il comando più leggibile e riduce problemi di quoting e portabilità.

## Quando usarlo

- Cercare testo letterale o pattern in file e directory.
- Estrarre intervalli di righe o sostituire testo.
- Selezionare e aggregare colonne.
- Analizzare log e output di comandi.
- Preparare dati testuali per ulteriori elaborazioni.

## Come funziona

| Strumento | Modello | Uso tipico |
| --- | --- | --- |
| `grep` | seleziona righe che corrispondono | ricerca e filtro |
| `sed` | applica comandi a un pattern space | sostituzioni e modifiche di flusso |
| `awk` | esegue azioni su record e campi | estrazione, calcolo e report |

`grep` restituisce normalmente 0 se trova una corrispondenza, 1 se non ne trova e un valore maggiore in caso di errore. L'assenza di risultati non equivale quindi a un errore operativo.

`sed` legge una riga nel pattern space, esegue lo script e normalmente la stampa. L'opzione `-n` disabilita la stampa automatica; il comando `p` stampa soltanto ciò che viene selezionato.

`awk` divide l'input in record, per impostazione predefinita righe, e ogni record in campi. `$0` è il record completo, `$1` il primo campo, `NF` il numero di campi e `NR` il numero progressivo del record.

## API / Sintassi

Cercare una stringa letterale ignorando maiuscole e minuscole:

```bash
grep -Fi 'errore critico' applicazione.log
```

Mostrare numeri di riga e righe senza corrispondenza:

```bash
grep -nv '^#' configurazione.conf
```

Cercare ricorsivamente limitandosi ai file Markdown:

```bash
grep -RIn --include='*.md' 'TODO' .
```

Sostituire tutte le occorrenze nell'output senza modificare il file:

```bash
sed 's/vecchio/nuovo/g' input.txt
```

Stampare un intervallo di righe:

```bash
sed -n '10,20p' input.txt
```

Estrarre il primo campo separato da due punti:

```bash
awk -F: '{ print $1 }' /etc/passwd
```

Sommare la seconda colonna saltando l'intestazione:

```bash
awk 'NR > 1 { somma += $2 } END { print somma }' dati.txt
```

Formattare campi con un separatore di output esplicito:

```bash
awk -F, 'BEGIN { OFS="\t" } { print $1, $3 }' dati.csv
```

## Esempio pratico

Selezionare le richieste HTTP con stato 500:

```bash
awk '$9 == 500 { print $1, $7 }' access.log
```

Contare quante risposte 500 provengono da ciascun indirizzo:

```bash
awk '$9 == 500 { conteggio[$1]++ } END { for (ip in conteggio) print conteggio[ip], ip }' access.log
```

Ordinare il riepilogo numericamente in ordine decrescente:

```bash
awk '$9 == 500 { conteggio[$1]++ } END { for (ip in conteggio) print conteggio[ip], ip }' access.log | sort -nr
```

Questo esempio presuppone il formato di log atteso e campi separati da whitespace. Per CSV con quoting, JSON, XML o YAML è preferibile un parser consapevole del formato invece di una suddivisione testuale approssimativa.

## Varianti

- `grep -F` cerca testo letterale; `grep -E` usa ERE; `grep -P` usa PCRE dove supportato.
- `grep -q` produce soltanto lo stato di uscita, utile nelle condizioni.
- `sed -E` abilita espressioni regolari estese sulle implementazioni moderne.
- `sed -i` modifica file sul posto, ma sintassi e gestione del backup variano tra implementazioni.
- `awk -v nome=valore` passa una variabile senza concatenare codice e dati.
- `cut`, `sort`, `uniq`, `tr`, `paste` e `wc` sono spesso migliori per trasformazioni semplici e specifiche.
- `jq`, `yq` e parser dedicati sono adatti a dati strutturati.

## Errori comuni

- Usare una regex quando serve una ricerca letterale, dimenticando `grep -F`.
- Confondere lo stato 1 di `grep`, nessuna corrispondenza, con un errore del programma.
- Usare `sed -i` senza backup o controllo preliminare dell'output.
- Analizzare CSV o JSON con semplici separatori che non rispettano escaping e quoting del formato.
- Inserire direttamente input non fidato nel programma `awk` o nello script `sed`.
- Dimenticare che locale e codifica possono cambiare classi, ordinamento e corrispondenze.
- Costruire pipeline lunghe quando un singolo programma `awk` renderebbe chiara l'elaborazione.

## Checklist

- Serve selezionare, trasformare oppure elaborare campi?
- La ricerca è letterale o usa una regex?
- Il formato è realmente line-oriented e delimitato in modo semplice?
- Lo stato di uscita di `grep` viene interpretato correttamente?
- Prima di modificare sul posto è stato verificato l'output?
- Variabili esterne sono passate con opzioni sicure come `awk -v`?
- Un parser specifico sarebbe più corretto per il formato dei dati?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Pipe e ridirezioni|Pipe e ridirezioni]]
- [[Linux/Pagine/Espressioni regolari|Espressioni regolari]]
- [[Linux/Pagine/Variabili e quoting|Variabili e quoting]]
- [[Linux/Pagine/Bash|Bash]]

## Fonti

- [GNU Grep Manual](https://www.gnu.org/software/grep/manual/grep.html)
- [GNU sed Manual](https://www.gnu.org/software/sed/manual/sed.html)
- [GNU Awk User's Guide](https://www.gnu.org/software/gawk/manual/gawk.html)
- [GNU Coreutils Manual](https://www.gnu.org/software/coreutils/manual/coreutils.html)
