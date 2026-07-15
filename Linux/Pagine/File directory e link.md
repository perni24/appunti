---
date: 2026-07-11
area: Linux
topic: File e filesystem
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [linux, filesystem, file, directory, inode, link]
aliases: [File directory e collegamenti, Hard link e symbolic link]
prerequisites: [Filesystem Hierarchy Standard, Terminale e comandi fondamentali]
related: [Permessi chmod chown e umask, Gestione utenti]
---

# File, directory e link

## Sintesi

In Linux quasi ogni risorsa viene esposta come file. Un nome contenuto in una directory identifica un oggetto del filesystem tramite un inode; l'inode conserva metadati e riferimenti ai dati, ma non il nome del file. Questa distinzione permette a più nomi, chiamati hard link, di riferirsi allo stesso inode.

Un link simbolico è invece un file speciale che contiene un pathname. Può puntare a directory o attraversare filesystem diversi, ma può anche rimanere pendente se il percorso di destinazione non esiste più.

## Quando usarlo

- Navigare e organizzare file e directory.
- Capire perché rinominare o rimuovere un file non equivale sempre a eliminare subito i dati.
- Creare alias stabili con link simbolici.
- Condividere lo stesso file mediante più nomi con hard link.
- Diagnosticare link interrotti, percorsi errati e spazio disco ancora occupato.

## Come funziona

Un pathname assoluto parte da `/`; un pathname relativo viene risolto dalla directory corrente. Ogni componente intermedio deve essere una directory attraversabile. `.` indica la directory corrente e `..` quella superiore.

Una directory associa nomi a inode. Un file regolare viene eliminato realmente quando non restano hard link al suo inode e nessun processo lo mantiene aperto. Per questo un processo può continuare a usare un file già rimosso dalla directory.

| Elemento | Caratteristica |
| --- | --- |
| File regolare | contiene dati, testo o codice |
| Directory | contiene associazioni tra nomi e inode |
| Hard link | altro nome dello stesso inode |
| Link simbolico | file che contiene il pathname di un'altra risorsa |

Un hard link non può normalmente riferirsi a una directory e non può attraversare filesystem. Un link simbolico non ha questi limiti, ma dipende dalla validità del pathname memorizzato.

## API / Sintassi

Mostrare tipo, permessi e destinazione dei link:

```bash
ls -l percorso
```

Mostrare inode e numero di hard link:

```bash
stat documento.txt
```

Elencare i file mostrando il numero di inode:

```bash
ls -li
```

Creare una directory, incluse quelle intermedie mancanti:

```bash
mkdir -p progetto/src
```

Creare un hard link:

```bash
ln documento.txt copia-logica.txt
```

Creare un link simbolico:

```bash
ln -s /opt/app/config.yml config.yml
```

Leggere il pathname memorizzato in un link simbolico:

```bash
readlink config.yml
```

Risolvere un percorso nella forma canonica:

```bash
realpath config.yml
```

Rimuovere un nome o un link senza seguire la destinazione:

```bash
rm config.yml
```

## Esempio pratico

Creare una struttura per una release:

```bash
mkdir -p /tmp/esempio-link/releases/1.0
```

Creare il file di configurazione della release:

```bash
touch /tmp/esempio-link/releases/1.0/config.yml
```

Creare un link simbolico relativo chiamato `current`:

```bash
ln -s releases/1.0 /tmp/esempio-link/current
```

Verificare sia il link sia la destinazione risolta:

```bash
readlink -f /tmp/esempio-link/current
```

Un link relativo è risolto rispetto alla directory che contiene il link, non rispetto alla directory corrente del processo che lo usa. È spesso preferibile quando un intero albero di directory deve poter essere spostato.

## Varianti

- `cp` crea nuovi dati; `ln` crea un altro riferimento o un pathname indiretto.
- `mv` nello stesso filesystem rinomina o sposta una voce di directory; tra filesystem deve copiare e poi rimuovere l'origine.
- `unlink` rimuove un singolo nome; `rm` offre un'interfaccia più pratica anche per più file e directory.
- `find -L` segue i link simbolici durante la ricerca e va usato conoscendone le implicazioni.
- Bind mount e mount point collegano alberi di filesystem, ma non sono link.

## Errori comuni

- Confondere un hard link con una copia: modificando il contenuto attraverso un nome, il cambiamento è visibile tramite tutti gli hard link.
- Creare un link simbolico relativo calcolandolo dalla directory corrente invece che dalla posizione del link.
- Usare `rm -r` su un percorso senza verificarlo prima.
- Credere che i permessi mostrati sul link simbolico regolino l'accesso alla destinazione: normalmente contano i permessi del percorso e dell'oggetto raggiunto.
- Dimenticare che un file rimosso ma ancora aperto da un processo può continuare a occupare spazio.
- Usare operazioni ricorsive che seguono link senza valutarne la destinazione.

## Checklist

- Il percorso è assoluto o relativo, e rispetto a quale directory viene risolto?
- Serve una copia, un hard link o un link simbolico?
- Origine e destinazione sono sullo stesso filesystem?
- Il link deve continuare a funzionare se l'albero viene spostato?
- La destinazione del link esiste ed è accessibile?
- Prima di rimuovere ricorsivamente, il percorso è stato controllato con `ls` o `realpath`?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Filesystem Hierarchy Standard|Filesystem Hierarchy Standard]]
- [[Linux/Pagine/Terminale e comandi fondamentali|Terminale e comandi fondamentali]]
- [[Linux/Pagine/Permessi chmod chown e umask|Permessi chmod, chown e umask]]

## Fonti

- [Linux man-pages - inode(7)](https://man7.org/linux/man-pages/man7/inode.7.html)
- [Linux man-pages - symlink(7)](https://man7.org/linux/man-pages/man7/symlink.7.html)
- [Linux man-pages - path_resolution(7)](https://man7.org/linux/man-pages/man7/path_resolution.7.html)
- [GNU Coreutils](https://www.gnu.org/software/coreutils/manual/coreutils.html)
