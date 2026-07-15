---
date: 2026-07-11
area: Linux
topic: Espressioni regolari
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [linux, regex, grep, sed, awk]
aliases: [Regex, Regular expression]
prerequisites: [Bash, Elaborazione testi con grep sed e awk]
related: [Espansioni della shell, Pipe e ridirezioni]
---

# Espressioni regolari

## Sintesi

Un'espressione regolare descrive un insieme di stringhe. Gli strumenti Unix non usano tutti lo stesso dialetto: `grep` usa per impostazione predefinita le Basic Regular Expressions, `grep -E` usa le Extended Regular Expressions e `grep -P`, quando disponibile, usa una sintassi compatibile con PCRE.

Le regex non sono glob della shell. Una regex viene interpretata dal programma che la riceve; per evitare che Bash ne elabori caratteri speciali, va normalmente racchiusa tra apici singoli.

## Quando usarlo

- Validare la forma generale di righe o campi.
- Cercare famiglie di stringhe con parti variabili.
- Estrarre righe delimitate da prefissi o suffissi.
- Applicare sostituzioni basate su gruppi.
- Separare record che rispettano pattern testuali.

## Come funziona

Elementi comuni:

| Pattern | Significato |
| --- | --- |
| `^` | inizio della riga |
| `$` | fine della riga |
| `.` | un carattere qualsiasi, salvo regole specifiche |
| `[abc]` | un carattere tra quelli indicati |
| `[^abc]` | un carattere escluso dall'insieme |
| `[[:digit:]]` | classe POSIX delle cifre |
| `*` | zero o più ripetizioni dell'elemento precedente |

Nelle ERE, `+` significa una o più ripetizioni, `?` zero o una, `{m,n}` un intervallo, `(...)` un gruppo e `|` un'alternativa. Nelle BRE molti di questi operatori richiedono un backslash e alcuni dettagli dipendono dall'implementazione.

Una regex cerca normalmente una corrispondenza in qualsiasi parte della riga. Gli anchor `^` e `$` servono quando deve corrispondere l'intera struttura. Le classi POSIX sono spesso preferibili a intervalli come `[A-Z]` quando locale e insieme di caratteri sono rilevanti.

## API / Sintassi

Cercare righe che iniziano con `errore`:

```bash
grep '^errore' applicazione.log
```

Cercare righe vuote o contenenti soltanto whitespace:

```bash
grep -E '^[[:space:]]*$' input.txt
```

Validare una sequenza composta soltanto da cifre:

```bash
grep -E '^[[:digit:]]+$' input.txt
```

Cercare due alternative con ERE:

```bash
grep -E 'warning|error' applicazione.log
```

Estrarre parole intere con l'opzione GNU `-w`:

```bash
grep -w 'root' /etc/passwd
```

Sostituire gruppi catturati con `sed -E`:

```bash
sed -E 's/^([^:]+):.*/utente=\1/' /etc/passwd
```

Usare una regex come pattern di una regola `awk`:

```bash
awk '/^[[:space:]]*#/ { print NR, $0 }' configurazione.conf
```

Testare una stringa con l'operatore Bash `=~`:

```bash
[[ $valore =~ ^[[:digit:]]+$ ]]
```

## Esempio pratico

Selezionare righe nel formato `chiave=valore`, ignorando commenti e righe vuote:

```bash
grep -E '^[[:space:]]*[[:alnum:]_]+[[:space:]]*=' configurazione.env
```

Estrarre soltanto il nome della chiave:

```bash
sed -E -n 's/^[[:space:]]*([[:alnum:]_]+)[[:space:]]*=.*$/\1/p' configurazione.env
```

Questa elaborazione è adatta soltanto a un formato semplice. Se valori, commenti o escaping hanno una grammatica propria, serve un parser del formato anziché una regex isolata.

## Varianti

- BRE è il default di `grep` e la sintassi storica di molti usi di `sed`.
- ERE, attivata con `grep -E` e spesso `sed -E`, rende gruppi, alternative e quantificatori più leggibili.
- PCRE offre lookaround, gruppi non catturanti e altre funzionalità, ma `grep -P` non è definito da POSIX e non è disponibile ovunque.
- `grep -F` disabilita le regex e cerca stringhe letterali.
- In Bash, il lato destro di `[[ stringa =~ regex ]]` ha regole di quoting particolari: quotare l'intera variabile del pattern può renderla letterale.
- Le regex multilinea richiedono strumenti e modalità specifiche; i normali `grep`, `sed` e `awk` ragionano principalmente per record o righe.

## Errori comuni

- Usare `*.txt` come regex: significa zero o più punti seguiti da `txt`, non un qualsiasi nome con estensione.
- Dimenticare gli anchor e accettare una sottostringa quando serviva l'intera riga.
- Non quotare la regex nella shell, consentendo globbing o interpretazioni di metacaratteri.
- Copiare sintassi PCRE in uno strumento configurato per BRE o ERE.
- Usare `\d` aspettandosi che sia portabile; `[[:digit:]]` è la forma POSIX.
- Costruire regex complesse per analizzare linguaggi annidati o formati strutturati.
- Ignorare effetti di locale, codifica e backreference sulle prestazioni e sulle corrispondenze.

## Checklist

- Quale motore e quale dialetto usa il comando?
- La ricerca deve essere letterale, BRE, ERE o PCRE?
- Deve corrispondere una sottostringa o l'intera riga?
- La regex è protetta dall'interpretazione della shell?
- Le classi di caratteri sono adatte al locale?
- Il formato richiede un parser invece di una regex?
- Il pattern è abbastanza semplice da essere mantenuto e testato?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Elaborazione testi con grep sed e awk|Elaborazione testi con grep, sed e awk]]
- [[Linux/Pagine/Espansioni della shell|Espansioni della shell]]
- [[Linux/Pagine/Variabili e quoting|Variabili e quoting]]
- [[Linux/Pagine/Pipe e ridirezioni|Pipe e ridirezioni]]

## Fonti

- [GNU Grep - Regular Expressions](https://www.gnu.org/software/grep/manual/html_node/Regular-Expressions.html)
- [GNU sed - Regular Expressions](https://www.gnu.org/software/sed/manual/html_node/Regular-Expressions.html)
- [GNU Awk - Regular Expressions](https://www.gnu.org/software/gawk/manual/html_node/Regexp.html)
- [GNU Bash - Pattern Matching](https://www.gnu.org/software/bash/manual/html_node/Pattern-Matching.html)
