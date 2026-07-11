---
date: 2026-07-11
area: Linux
topic: Espansioni Bash
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [linux, bash, espansioni, glob, parameter-expansion]
aliases: [Shell expansion, Espansioni Bash]
prerequisites: [Bash, Variabili e quoting]
related: [Pipe e ridirezioni, Espressioni regolari]
---

# Espansioni della shell

## Sintesi

Prima di eseguire un comando, Bash trasforma le parole attraverso una sequenza di espansioni. Le principali sono brace expansion, tilde expansion, espansione di parametri, sostituzione di comando, espansione aritmetica, word splitting, filename expansion e rimozione del quoting.

Comprendere l'ordine è essenziale: il programma riceve gli argomenti risultanti, non il testo originariamente digitato.

## Quando usarlo

- Costruire nomi e serie di argomenti senza ripetizioni.
- Applicare valori predefiniti o controllare variabili mancanti.
- Acquisire l'output di un comando.
- Eseguire calcoli interi.
- Selezionare file con pattern glob.
- Evitare word splitting e filename expansion involontari.

## Come funziona

Bash applica, in ordine:

1. brace expansion;
2. tilde expansion;
3. espansione di parametri e variabili, espansione aritmetica e command substitution, da sinistra a destra;
4. word splitting;
5. filename expansion;
6. quote removal.

La process substitution, quando disponibile, avviene insieme al gruppo delle espansioni di parametro, aritmetiche e di comando. Soltanto brace expansion, word splitting e filename expansion possono normalmente aumentare il numero di parole, con eccezioni come `"$@"` e gli array.

Le doppie virgolette impediscono word splitting e globbing sul risultato della maggior parte delle espansioni. Per questo `"$variabile"` è la forma predefinita corretta quando si vuole ottenere un singolo argomento.

## API / Sintassi

Generare una sequenza testuale con brace expansion:

```bash
printf '%s\n' file{1..3}.txt
```

Espandere la home dell'utente corrente:

```bash
printf '%s\n' ~
```

Usare un valore predefinito senza modificare la variabile:

```bash
printf '%s\n' "${PORTA:-8080}"
```

Assegnare un valore predefinito se la variabile è nulla o assente:

```bash
printf '%s\n' "${PORTA:=8080}"
```

Interrompere con un messaggio se manca un parametro:

```bash
printf '%s\n' "${CONFIG:?CONFIG non definita}"
```

Rimuovere un suffisso corrispondente a un pattern:

```bash
printf '%s\n' "${nome%.txt}"
```

Acquisire l'output di un comando:

```bash
kernel=$(uname -r)
```

Eseguire aritmetica intera:

```bash
printf '%s\n' "$((2 + 3 * 4))"
```

Espandere i file che corrispondono a un glob:

```bash
printf '%s\n' ./*.md
```

## Esempio pratico

Definire un percorso eventualmente fornito dall'ambiente:

```bash
directory=${LOG_DIR:-/var/log}
```

Costruire un nome con la data prodotta da un comando:

```bash
backup="backup-$(date +%F).tar.gz"
```

Mostrare il percorso mantenendolo come un solo argomento:

```bash
printf 'Destinazione: %s\n' "$directory/$backup"
```

Verificare quanti argomenti produce un'espansione è spesso più utile che osservare soltanto il testo visualizzato. `printf '<%s>\n' ...` rende visibili confini, stringhe vuote e risultati multipli.

## Varianti

- `${var-default}` usa il default solo se la variabile è assente; `${var:-default}` anche se è vuota.
- `${#var}` restituisce la lunghezza; `${var#pattern}` e `${var##pattern}` rimuovono prefissi.
- `$(comando)` è preferibile ai backtick perché è leggibile e annidabile; rimuove le newline finali dall'output.
- `<(comando)` produce un riferimento leggibile come file; `>(comando)` riceve output tramite un riferimento analogo.
- `shopt -s nullglob` fa scomparire un glob senza corrispondenze; di default rimane invece letterale.
- `shopt -s globstar` abilita `**` per attraversamenti ricorsivi secondo le regole Bash.

## Errori comuni

- Lasciare non quotata una variabile contenente spazi o caratteri glob.
- Confondere i glob della shell con espressioni regolari: `*.log` non significa la stessa cosa di una regex.
- Aspettarsi che le parentesi graffe espandano valori contenuti in variabili: brace expansion avviene prima dell'espansione dei parametri.
- Usare output arbitrario di un comando come elenco di file, affidandosi al word splitting.
- Dimenticare che un glob senza corrispondenze resta normalmente invariato.
- Usare `for file in $(find ...)`, che perde i confini dei nomi contenenti whitespace.
- Confondere `${var:-x}` con `${var:=x}`, che modifica la variabile.

## Checklist

- Quante parole deve produrre l'espansione?
- Il risultato deve subire word splitting o globbing?
- La variabile può essere assente oppure vuota?
- Il pattern è un glob o un'espressione regolare?
- La command substitution può perdere newline finali rilevanti?
- I nomi di file possono contenere spazi, newline o caratteri speciali?
- Le opzioni `nullglob`, `failglob`, `dotglob` o `globstar` cambiano il comportamento previsto?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Bash|Bash]]
- [[Linux/Pagine/Variabili e quoting|Variabili e quoting]]
- [[Linux/Pagine/Pipe e ridirezioni|Pipe e ridirezioni]]
- [[Linux/Pagine/Espressioni regolari|Espressioni regolari]]

## Fonti

- [GNU Bash - Shell Expansions](https://www.gnu.org/software/bash/manual/html_node/Shell-Expansions.html)
- [GNU Bash - Shell Parameter Expansion](https://www.gnu.org/software/bash/manual/html_node/Shell-Parameter-Expansion.html)
- [GNU Bash - Filename Expansion](https://www.gnu.org/software/bash/manual/html_node/Filename-Expansion.html)
