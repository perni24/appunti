# AGENTS.md

Questo repository e un vault Obsidian usato come base di conoscenza personale.

Contiene appunti tecnici, indici tematici, note operative, riferimenti di studio e documentazione personale. Le note sono organizzate per aree di conoscenza, per esempio:

- `Programmazione`
- `Elettronica`
- `Linux`
- `AI`
- `Trading`
- `Home assistant`
- `Stampante 3D`
- `Programmi open source`
- `Progetti`

L'obiettivo del repository e mantenere conoscenza consultabile sia da una persona sia da un modello LLM.

---

## Regole generali

- Scrivi le note in italiano.
- Mantieni codice, nomi di variabili, API e riferimenti tecnici in inglese quando sono standard del settore.
- Usa Markdown compatibile con Obsidian.
- Usa collegamenti wiki quando colleghi note interne.
- Aggiorna l'indice dell'area quando crei una nuova pagina.
- Ogni macro argomento deve essere collegato in `Home.md`, che funge da indice generale del vault.
- Mantieni gli indici schematici e leggibili.
- Evita duplicati: prima di creare una nota, controlla se esiste gia una pagina correlata.
- Non rimuovere contenuti esistenti senza richiesta esplicita.
- Se una informazione non e presente nei materiali forniti o negli appunti esistenti, non inventarla: segnala che manca o che va verificata.
- Usa nomi pagina chiari e descrittivi. Evita abbreviazioni non necessarie.
- Usa preferibilmente `Pagine/` con `P` maiuscola per le cartelle di note.

---

## Template obbligatori

Quando crei una nuova nota, usa come base uno dei template presenti in:

```text
_Template/
```

Template disponibili:

- `_Template/Nota teorica.md`
- `_Template/Nota tecnica.md`
- `_Template/Nota operativa.md`

Scegli il template in base al tipo di contenuto.

### Nota teorica

Usa `_Template/Nota teorica.md` per concetti, modelli mentali, spiegazioni teoriche e argomenti da studiare.

Esempi:

- Event Loop
- Ownership
- MVCC
- Architettura Fiber

### Nota tecnica

Usa `_Template/Nota tecnica.md` per API, linguaggi, strumenti, feature tecniche e implementazioni.

Esempi:

- Fetch API
- AbortController
- Context Managers
- Zicsr

### Nota operativa

Usa `_Template/Nota operativa.md` per procedure pratiche, snippet, checklist, troubleshooting e soluzioni consultabili rapidamente durante il lavoro.

Esempi:

- Debug CORS
- Creare un ambiente virtuale Python
- Checklist sicurezza frontend
- Procedura backup PostgreSQL

---

## Frontmatter

Ogni nuova nota deve iniziare con frontmatter YAML.

Campi consigliati:

```yaml
---
date: YYYY-MM-DD
area:
topic:
type:
status:
difficulty:
tags: []
aliases: []
prerequisites: []
related: []
---
```

Valori comuni per `type`:

- `theory-note`
- `technical-note`
- `operational-note`
- `permanent-note`
- `literature-note`

Valori ammessi per `status`:

- `"non revisionato"`: nota creata o modificata, ma non ancora controllata dall'utente.
- `"revisionato (da me)"`: nota controllata e approvata dall'utente.

Se modifichi una nota che ha `status: "revisionato (da me)"`, imposta lo status a:

```yaml
status: "non revisionato"
```

Una nota modificata da un modello deve essere considerata non revisionata finche l'utente non la controlla di nuovo.

---

## Struttura delle aree

Ogni area dovrebbe avere un indice principale.

Esempio:

```text
Programmazione/
  JavaScript/
    Indice javascript.md
    Pagine/
      Nome pagina.md
```

Le pagine di contenuto vanno preferibilmente nella cartella `Pagine`.

Gli indici devono servire da mappa di navigazione, non da spiegazione estesa.

`Home.md` e l'indice generale del vault. Quando viene creata una nuova macro area o un nuovo macro argomento, aggiungi un link al relativo indice anche in `Home.md`.

---

## Cartella Raw

La cartella `Raw/` contiene materiali grezzi da analizzare e assimilare nel vault.

I file in `Raw/` possono essere in formati diversi, per esempio:

- `.md`
- `.txt`
- `.pdf`
- `.docx`
- `.html`
- immagini
- estratti copiati da documentazione
- appunti temporanei

I contenuti in `Raw/` non sono note definitive.

Distinzione importante:

- `Raw/` = materiale sorgente grezzo.
- `Pagine/` = conoscenza assimilata in Markdown.
- `Indice ...md` = navigazione di un'area.
- `Home.md` = indice generale del vault.

Quando analizzi un file in `Raw/`:

1. Leggi e comprendi il contenuto.
2. Identifica l'area corretta del vault in cui assimilare le informazioni.
3. Controlla se esiste gia una nota correlata.
4. Se esiste, integra il contenuto utile nella nota esistente.
5. Se non esiste, crea una nuova nota usando il template appropriato in `_Template/`.
6. Converti il contenuto utile in Markdown pulito e strutturato.
7. Aggiungi collegamenti interni verso note correlate.
8. Aggiorna l'indice dell'area interessata.
9. Se il contenuto crea un nuovo macro argomento, aggiungi il link anche in `Home.md`.
10. Non copiare tutto automaticamente: sintetizza, organizza e conserva solo cio che e utile.
11. Aggiungi una voce nel file `Raw/log.md` indicando cosa e stato analizzato, quando e dove e stato assimilato.

Regola importante: `Raw/` e una inbox, non una destinazione finale.

Dopo che un file in `Raw/` e stato analizzato e assimilato negli appunti, rinominalo aggiungendo il prefisso:

```text
completato - 
```

Esempio:

```text
documentazione fetch.pdf
```

diventa:

```text
completato - documentazione fetch.pdf
```

I file che iniziano con `completato - ` non devono essere analizzati di nuovo, salvo richiesta esplicita dell'utente.

Non modificare o cancellare automaticamente i file originali in `Raw/`, tranne per l'aggiunta del prefisso `completato - ` dopo l'assimilazione.

### Log dei file Raw

Il file `Raw/log.md` registra i documenti analizzati.

Ogni volta che un file in `Raw/` viene assimilato negli appunti, aggiungi una voce con questa struttura:

```md
## YYYY-MM-DD - nome-file-originale.ext

- Stato: completato
- File raw: `Raw/completato - nome-file-originale.ext`
- Assimilato in:
  - [[Percorso/Nota]]
- Sintesi: breve descrizione di cosa e stato estratto o integrato.
```

Il log serve a evitare doppie analisi e a mantenere tracciabilita tra materiale sorgente e note finali.

---

## Storico recente

Usa `_Meta/Storico recente.md` per registrare un breve riepilogo delle modifiche importanti al vault.

Lo storico recente serve a dare contesto operativo all'utente e ai modelli LLM tra una sessione e l'altra.

Aggiornalo quando:

- crei o modifichi file di struttura;
- aggiungi nuove macro aree;
- cambi convenzioni del vault;
- assimili documenti importanti da `Raw/`;
- completi molte note in una sessione.

Non registrare ogni piccola modifica. Scrivi solo cio che aiuta a riprendere il contesto.

Mantieni solo le ultime 10 voci operative.

Quando aggiungi una nuova voce e il file supera 10 voci, elimina o archivia la voce piu vecchia.

Formato consigliato:

```md
## YYYY-MM-DD - Titolo breve

### Fatto
- Modifica importante.

### Decisioni
- Decisione presa.

### Prossimi passi
- Possibile attivita successiva.
```

---

## Collegamenti

Quando possibile, collega note correlate nella sezione `Collegamenti`.

Esempio:

```md
## Collegamenti

- [[Fetch API]]
- [[Promises]]
- [[CORS]]
```

I collegamenti devono essere utili per navigare il vault e per aiutare un LLM a ricostruire il contesto.

I link a note non ancora esistenti sono ammessi solo se rappresentano argomenti realmente previsti. Non creare link vaghi o casuali.

---

## Stile delle note

Una buona nota dovrebbe contenere:

- una sintesi iniziale;
- spiegazione del concetto o procedura;
- esempi pratici quando utili;
- errori comuni;
- checklist o limiti quando rilevanti;
- collegamenti interni.

Per note tecniche, non limitarti a spiegare cosa fa una API: spiega anche quando usarla, perche usarla e quali errori evitare.

---

## Uso da parte di un LLM

Quando lavori su questo repository:

1. Leggi prima `AGENTS.md`.
2. Controlla l'indice dell'area interessata.
3. Controlla se esiste gia una pagina correlata.
4. Usa il template corretto da `_Template`.
5. Crea o aggiorna la nota.
6. Aggiorna l'indice.
7. Mantieni coerenza con stile, struttura e collegamenti gia presenti.

L'obiettivo e rendere ogni nota utile sia per lettura umana sia per recupero contestuale da parte di modelli LLM.
