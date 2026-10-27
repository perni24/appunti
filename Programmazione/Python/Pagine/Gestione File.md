---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - python
  - programming
  - file
aliases:
  - Gestione dei File
prerequisites: []
related: []
title: Gestione dei File in Python
---

# Gestione dei File in Python

## Sintesi

Un file di testo viene letto come `str` tramite una codifica; un file binario come `bytes`. Usa `with` per chiudere la risorsa, `encoding="utf-8"` per il testo UTF-8 e `pathlib.Path` per i percorsi.

Prima di scrivere, scegli una politica: **sostituire**, **aggiungere** oppure **rifiutare un file gia esistente**. Aprire in `w` tronca subito il file, anche se il codice successivo fallisce.

Riferimento: Python 3.12. Esempi verificabili con CPython 3.12.10; questa patch identifica l'ambiente di prova, non la versione da preferire per nuove installazioni.

## Quando usarlo

- Leggere configurazioni, esportazioni o file forniti dall'utente.
- Produrre report e trasformare testo senza caricarlo tutto in memoria.
- Copiare dati binari senza decodificarli.
- Distinguere errori di percorso, permessi e formato.

## Come funziona

### Percorsi e directory corrente

`Path("data.txt")` e relativo alla **directory corrente del processo**, non alla cartella dello script. L'IDE, il terminale e un servizio possono avviare lo stesso programma da directory diverse. `Path.cwd()` aiuta a diagnosticare il problema.

L'operatore `/` combina percorsi secondo la piattaforma. Non e una protezione contro path traversal: una componente assoluta puo sostituire la base, `..` puo risalire e i link simbolici cambiano la destinazione effettiva. Non concatenare percorsi ricevuti via HTTP e considerarli automaticamente sicuri.

### Chiusura ed errori

`with` chiude il file all'uscita normale e durante la propagazione delle eccezioni Python. Non promette il cleanup dopo un arresto forzato del processo o della macchina.

La chiusura **non annulla una scrittura parziale** e non equivale a una transazione o a una garanzia di persistenza su disco. Anche `flush()` trasferisce i buffer Python, senza garantire da solo la sopravvivenza a un guasto.

## API / Sintassi

| Modalita | Comportamento                                                         |
| -------- | --------------------------------------------------------------------- |
| `r`      | Legge; file assente: `FileNotFoundError`. E il default.               |
| `w`      | Crea o tronca immediatamente un file esistente.                       |
| `a`      | Crea o aggiunge in fondo; non sostituisce il contenuto iniziale.      |
| `x`      | Crea esclusivamente; se il percorso esiste solleva `FileExistsError`. |
| `b`      | Modificatore binario: `rb`, `wb`, `xb`; niente `encoding`.            |
| `t`      | Modificatore testo, implicito: lettura/scrittura di stringhe.         |
| `+`      | Aggiunge lettura e scrittura: `r+` non tronca, `w+` si.               |

- `read()` legge tutto il resto; `read(n)` legge al massimo `n` caratteri in testo o byte in binario.
- `readline()` legge una riga, normalmente conservando il terminatore; `readlines()` raccoglie tutte le righe restanti.
- Iterare sul file evita una lista completa, ma una singola riga enorme puo comunque occupare molta memoria.
- `write(text)` e `writelines(strings)` **non aggiungono** newline automaticamente.
- EOF e `""` in testo e `b""` in binario. Una riga vuota del file puo essere invece `"\n"`.
- In testo, `newline=None` riconosce i terminatori comuni in lettura e traduce `\n` secondo la piattaforma in scrittura; `newline="\n"` consente un output LF esplicito.

### Esempio autonomo: testo, righe e append

Il file viene creato in una directory temporanea e rimosso alla fine. `x` protegge da sovrascritture accidentali; `a` modifica quel file aggiungendo una riga.

```python
from pathlib import Path
from tempfile import TemporaryDirectory

with TemporaryDirectory() as directory:
    path = Path(directory) / "data.txt"
    with path.open("x", encoding="utf-8", newline="\n") as file:
        file.writelines(["  alpha  \n", "beta\n"])

    with path.open("a", encoding="utf-8", newline="\n") as file:
        file.write("gamma\n")

    with path.open(encoding="utf-8") as file:
        lines = [line.removesuffix("\n") for line in file]
        print(lines)
    print(file.closed)
```

Output: `['  alpha  ', 'beta', 'gamma']` e `True`. `strip()` eliminerebbe anche gli spazi significativi intorno ad `alpha`: usalo solo se la pulizia fa parte del contratto.

### Errori da distinguere

Non usare `exists()` come garanzia che una lettura successiva riuscira: il filesystem puo cambiare tra controllo e apertura. Tenta l'operazione e gestisci solo gli errori previsti.

```python
from pathlib import Path
from tempfile import TemporaryDirectory

with TemporaryDirectory() as directory:
    path = Path(directory) / "optional.txt"
    try:
        content = path.read_text(encoding="utf-8")
    except FileNotFoundError:
        content = None
    print(content)
```

Qui solo l'assenza significa "configurazione opzionale". `PermissionError`, `IsADirectoryError` e `UnicodeDecodeError` non vanno nascosti con lo stesso fallback. `errors="ignore"` puo perdere dati senza avvertire.

## Esempio pratico

Questa funzione rimuove spazi esterni e righe vuote, converte in minuscolo e scrive LF. Sono scelte deliberate, non una pulizia universale. La destinazione deve essere nuova; la directory genitore deve gia esistere.

```python
from pathlib import Path
from tempfile import TemporaryDirectory


def normalize_lines(source: Path, target: Path) -> int:
    count = 0
    with source.open(encoding="utf-8") as reader:
        with target.open("x", encoding="utf-8", newline="\n") as writer:
            for line in reader:
                cleaned = line.strip()
                if cleaned:
                    writer.write(cleaned.lower() + "\n")
                    count += 1
    return count


with TemporaryDirectory() as directory:
    source = Path(directory) / "input.txt"
    target = Path(directory) / "output.txt"
    source.write_text(" ALPHA \n\n Beta \n", encoding="utf-8")
    count = normalize_lines(source, target)
    print(count)
    print(repr(target.read_text(encoding="utf-8")))
```

Output: `2` e `'alpha\nbeta\n'`. L'uso di `write_text` per la fixture e sicuro rispetto ai dati dell'utente solo perche il percorso appartiene a una nuova directory temporanea.

Limiti: un errore a meta trasformazione puo lasciare un output incompleto. `x` evita di sostituire un file esistente, ma non rende l'intera elaborazione atomica. Per pubblicare un risultato solo a lavoro concluso serve un file temporaneo nello stesso filesystem e una politica esplicita di sostituzione; atomicita, durabilita e accessi concorrenti sono problemi distinti.

## Varianti

### Copia binaria a blocchi

Non decodificare un'immagine o un archivio come testo. La lettura binaria non traduce newline.

```python
from pathlib import Path
from tempfile import TemporaryDirectory


def copy_binary(source: Path, target: Path) -> None:
    with source.open("rb") as reader:
        with target.open("xb") as writer:
            while chunk := reader.read(64 * 1024):
                writer.write(chunk)


with TemporaryDirectory() as directory:
    source = Path(directory) / "source.bin"
    target = Path(directory) / "copy.bin"
    source.write_bytes(b"\x00\xff\r\n")
    copy_binary(source, target)
    print(target.read_bytes() == source.read_bytes())
```

Output: `True`. Il buffer e limitato a un blocco per lettura; anche qui un errore puo lasciare un file parziale. Per copie con metadati valuta `shutil.copy2`; non implica la copia di ogni metadato su ogni piattaforma.

`Path.read_text` / `read_bytes` e `write_text` / `write_bytes` sono scorciatoie che aprono e chiudono il file. Leggono/scrivono l'intero contenuto; le due scritture **sovrascrivono**. Per JSON, CSV e TOML usa i parser dedicati nella nota Standard Library.

## Errori comuni

- Aprire in `w` prima di aver verificato la politica di sostituzione.
- Confondere una directory mancante con un file opzionale assente.
- Usare `strip()` quando vanno conservati spazi e tab.
- Considerare `with` una transazione o una protezione dai crash.
- Passare `bytes` a uno stream di testo, o `str` a uno binario.
- Pensare che una funzione di copia autorizzi percorsi provenienti da utenti non fidati.

## Checklist

- Directory corrente, encoding e formato sono noti?
- La destinazione deve essere nuova, sostituita o estesa?
- I dati stanno in memoria? Esistono limiti anche sulla dimensione delle righe?
- Gli errori di permesso e decodifica restano visibili?
- Che cosa succede a un output parziale?
- I percorsi sono fidati e le risorse vengono chiuse?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Context Managers|Context Managers]]
- [[Programmazione/Python/Pagine/Error Handling|Error Handling]]
- [[Programmazione/Python/Pagine/Generatori|Generatori]]
- [[Programmazione/Python/Pagine/Standard Library|Standard Library]]

## Fonti

- [Python 3.12: open e modalita di I/O](https://docs.python.org/3.12/library/functions.html#open).
- [Python 3.12: pathlib](https://docs.python.org/3.12/library/pathlib.html).
- [Python 3.12: tempfile](https://docs.python.org/3.12/library/tempfile.html).
- [Python 3.12: shutil e limiti delle copie](https://docs.python.org/3.12/library/shutil.html).
