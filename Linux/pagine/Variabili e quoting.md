---
date: 2026-07-11
area: Linux
topic: Variabili e quoting Bash
type: technical-note
status: "non revisionato"
difficulty: base
tags: [linux, bash, variabili, quoting, ambiente]
aliases: [Quoting Bash, Variabili Bash]
prerequisites: [Bash, Variabili ambiente e PATH]
related: [Espansioni della shell, Pipe e ridirezioni]
---

# Variabili e quoting

## Sintesi

Le variabili della shell appartengono al processo Bash; solo quelle esportate vengono incluse nell'ambiente ereditato dai processi figli. Il quoting controlla quali caratteri vengono interpretati dalla shell e quali espansioni possono avvenire.

Come regola generale, le espansioni di variabili devono essere racchiuse tra doppie virgolette, salvo quando si desidera consapevolmente ottenere più parole o applicare un glob.

## Quando usarlo

- Conservare configurazioni e risultati temporanei.
- Passare valori ai processi figli tramite l'ambiente.
- Gestire argomenti contenenti spazi o caratteri speciali.
- Distinguere testo letterale da testo con espansioni.
- Elaborare in sicurezza parametri posizionali e array.

## Come funziona

Un'assegnazione semplice non contiene spazi intorno a `=`. Il nome deve iniziare con una lettera o underscore e proseguire con lettere, cifre o underscore.

| Forma | Comportamento |
| --- | --- |
| `'testo'` | tutto letterale; non può contenere un apice singolo direttamente |
| `"testo"` | mantiene una parola ma consente espansioni di parametro, comando e aritmetiche |
| `\carattere` | rimuove il significato speciale del carattere successivo |
| `$'testo\n'` | quoting ANSI-C di Bash, interpreta sequenze di escape |

`"$@"` espande ogni parametro posizionale come argomento separato e ne preserva i confini. `"$*"` produce invece una sola parola, unendo i parametri con il primo carattere di `IFS`.

Una variabile esportata viene copiata nell'ambiente dei nuovi processi. Un processo figlio non può modificare direttamente le variabili del processo padre.

## API / Sintassi

Assegnare una variabile di shell:

```bash
nome='Luca Bellini'
```

Leggerla senza perdere i confini del valore:

```bash
printf '%s\n' "$nome"
```

Esportare una variabile nell'ambiente:

```bash
export APP_ENV=production
```

Rimuovere una variabile:

```bash
unset APP_ENV
```

Mostrare la dichiarazione Bash di una variabile:

```bash
declare -p nome
```

Creare un array indicizzato:

```bash
file=('primo file.txt' 'secondo.txt')
```

Espandere ogni elemento dell'array come argomento separato:

```bash
printf '<%s>\n' "${file[@]}"
```

Leggere una riga senza interpretare backslash:

```bash
IFS= read -r riga
```

Mostrare un testo letterale contenente il simbolo del dollaro:

```bash
printf '%s\n' 'Il valore è $HOME'
```

## Esempio pratico

Definire una funzione che preserva tutti gli argomenti ricevuti:

```bash
mostra_argomenti() { printf '<%s>\n' "$@"; }
```

Chiamarla con due argomenti, il primo contenente uno spazio:

```bash
mostra_argomenti 'primo valore' secondo
```

Memorizzare un percorso in modo letterale:

```bash
destinazione='/tmp/cartella con spazi'
```

Creare la directory passando un solo argomento:

```bash
mkdir -p -- "$destinazione"
```

`--` segnala la fine delle opzioni nei programmi che lo supportano, proteggendo nomi che iniziano con `-`; il quoting protegge invece i confini e impedisce globbing involontario.

## Varianti

- `readonly nome=valore` impedisce successive assegnazioni nella shell corrente.
- `local nome=valore` limita una variabile alla funzione Bash e alle funzioni chiamate dinamicamente.
- `declare -i numero` applica valutazione aritmetica alle assegnazioni, ma non sostituisce la validazione dell'input.
- Gli array associativi si dichiarano con `declare -A` e sono un'estensione Bash.
- Un'assegnazione anteposta a un comando, come `LC_ALL=C comando`, modifica l'ambiente soltanto per quell'invocazione.
- `printf` è normalmente preferibile a `echo` per output prevedibile e formattato.

## Errori comuni

- Scrivere `nome = valore`, facendo interpretare `nome` come comando.
- Usare `$variabile` non quotata e ottenere word splitting o filename expansion.
- Usare apici singoli aspettandosi che `$HOME` venga espansa.
- Perdere gli argomenti originali usando `$*` invece di `"$@"`.
- Conservare liste in una stringa separata da spazi invece di usare un array.
- Usare `for file in $lista` con nomi che possono contenere whitespace.
- Passare segreti tramite variabili d'ambiente senza considerare eredità, log e visibilità ai processi autorizzati.

## Checklist

- La variabile deve restare locale alla shell o essere esportata?
- Il valore deve essere letterale oppure contenere espansioni?
- L'espansione è racchiusa tra doppie virgolette?
- Serve una stringa o un array?
- Gli argomenti posizionali vengono inoltrati con `"$@"`?
- Il comando supporta `--` per terminare le opzioni?
- L'input letto con `read` deve preservare backslash e whitespace?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Bash|Bash]]
- [[Linux/Pagine/Variabili ambiente e PATH|Variabili d'ambiente e PATH]]
- [[Linux/Pagine/Espansioni della shell|Espansioni della shell]]
- [[Linux/Pagine/Pipe e ridirezioni|Pipe e ridirezioni]]

## Fonti

- [GNU Bash - Shell Parameters](https://www.gnu.org/software/bash/manual/html_node/Shell-Parameters.html)
- [GNU Bash - Quoting](https://www.gnu.org/software/bash/manual/html_node/Quoting.html)
- [GNU Bash - Bourne Shell Builtins](https://www.gnu.org/software/bash/manual/html_node/Bourne-Shell-Builtins.html)
