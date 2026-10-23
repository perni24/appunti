# Revisione dei contenuti

Registro della revisione tecnica avviata dopo la ristrutturazione del vault. I controlli di YAML, collegamenti e build non certificano la correttezza degli argomenti.

## 2026-09-14 - Fondamenti JavaScript

### Perimetro

Lette integralmente e corrette le otto note del blocco `Percorso Base > Fondamenti del Linguaggio`. Confrontati i punti dubbi con la documentazione ufficiale MDN; le fonti sono riportate nelle singole note.

Questo controllo e svolto dal modello. Lo stato YAML resta `non revisionato` fino all'approvazione dell'utente; le date originarie delle note non sono state usate come date di revisione.

### Correzioni

| Nota                                                                                | Intervento principale                                                                                                                             |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/JavaScript/Pagine/Variabili\|Variabili]]                           | Distinti binding e mutazione, TDZ e contesto globale/modulo; esempio pratico con dati locali.                                                     |
| [[Programmazione/JavaScript/Pagine/Tipi di Dati\|Tipi di Dati]]                     | Precisione Number, BigInt, Symbol e identita degli oggetti; `parseAge` ora rifiuta input vuoti, booleani e numeri non sicuri.                     |
| [[Programmazione/JavaScript/Pagine/Operatori\|Operatori]]                           | Chiariti short-circuit, optional chaining e precedenza; paginazione con default separati dalla validazione.                                       |
| [[Programmazione/JavaScript/Pagine/Strutture Condizionali\|Strutture Condizionali]] | Distinti truthiness e validazione; scope condiviso dei case e guard clause con contratto esplicito.                                               |
| [[Programmazione/JavaScript/Pagine/Cicli\|Cicli]]                                   | Proprieta ereditate, limiti di `forEach` asincrono e `Promise.all`; salvataggio sequenziale con dipendenza esplicita.                             |
| [[Programmazione/JavaScript/Pagine/Funzioni\|Funzioni]]                             | Passaggio per valore, default e `return`; sconto espresso come frazione e validazione di valori finiti/intervallo.                                |
| [[Programmazione/JavaScript/Pagine/Strict Mode\|Strict Mode]]                       | Distinti script, moduli e classi; corretto il significato di `this` e documentato il conflitto tra direttiva interna e parametri non semplici.    |
| [[Programmazione/JavaScript/Pagine/Error Handling\|Error Handling]]                 | Causa degli errori, limiti di `finally` e cattura asincrona; esempio HTTP con id codificato, annullamento e distinzione tra stato HTTP e rifiuto. |

### Verifica degli esempi

Eseguiti **32 test, tutti superati**, con Node.js `v24.14.0`:

```powershell
node --test _Meta/tests/javascript-fondamenti.test.mjs
```

I test estraggono i blocchi JavaScript dalle note tramite il parser Markdown del repository. Non mantengono una seconda copia delle funzioni da verificare. Gli esempi negativi vengono controllati aspettandosi il relativo errore.

- Copertura: mutazione e scope, BigInt, identita, validazione dell'eta, paginazione, operatori, condizioni, iterazione delle proprieta, sequenzialita dei salvataggi, argomenti, sconti, strict mode e gestione degli errori.
- HTTP: risposte `200`, `404`, `500`, JSON invalido, errore di rete, annullamento e inoltro del segnale, mediante `fetch` simulata. Nessuna richiesta a un backend reale.
- Limiti: non tutti i frammenti delle otto note sono eseguiti; gli schemi richiedono valori applicativi e sono indicati come tali. I test non costituiscono una matrice di compatibilita browser o di versioni Node.js.

### Verifica del vault

- `content:check -- --report`: 911 documenti raggiungibili, zero errori strutturali.
- `content:test`: 9 test della trasformazione superati, distinti dai 32 test degli esempi.
- Al termine del primo blocco: 672 avvisi editoriali per fonti non esplicite nel vault, non 672 errori tecnici accertati. Il dettaglio aggiornato e in [[_Meta/Controllo del vault|Controllo del vault]].

### Passaggio successivo

La revisione e proseguita con il blocco DOM e Browser Base, documentato di seguito.

## 2026-09-14 - DOM e Browser Base

### Perimetro e correzioni

Lette integralmente e corrette altre cinque note, con fonti MDN nelle pagine. Stato YAML ancora `non revisionato` in attesa dell'utente.

| Nota                                                                                          | Intervento principale                                                                                                                                                                      |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [[Programmazione/JavaScript/Pagine/Manipolazione del DOM\|Manipolazione del DOM]]             | Selezioni statiche, elementi assenti, attributi/proprieta, limiti di innerHTML e DocumentFragment; rendering di nomi non fidati come testo e inizializzazione anche dopo DOMContentLoaded. |
| [[Programmazione/JavaScript/Pagine/Gestione Eventi\|Gestione Eventi]]                         | Propagazione distinta da azione predefinita, durata di currentTarget, callback asincrone e cleanup; delegazione con righe dinamiche, liste annidate e rimozione solo locale esplicita.     |
| [[Programmazione/JavaScript/Pagine/BOM\|BOM]]                                                 | Vincoli di History API, popstate, refresh di route statiche, limiti di navigator.onLine e timer; URL e testo riallineati anche con Indietro/Avanti.                                        |
| [[Programmazione/JavaScript/Pagine/Browser Storage\|Browser Storage]]                         | Origine diversa da percorso, persistenza non garantita, quote/blocchi, sessionStorage e opener, cookie e cache; preferenze validate con fallback e risultato di salvataggio esplicito.     |
| [[Programmazione/JavaScript/Pagine/Form Handling e Validazione\|Form Handling e Validazione]] | Aggiunto POST al form con password; corretti campi inviabili e checkbox, validazione e requestSubmit; esempio completo con feedback, doppi submit, errori gestiti e campi conservati.      |

### Verifica degli esempi

Eseguiti **13 test browser, tutti superati**, tramite Playwright e Chrome `153.0.8010.37`. Totale dei due blocchi: **45 test sugli esempi** (32 Node.js e 13 browser).

Il test browser usa i frammenti HTML/JavaScript estratti dalle note, profili temporanei isolati e risposte HTTP simulate. Nessun dato del profilo personale e nessun endpoint reale vengono usati.

Copertura: rendering testuale e sostituzione della lista, DOM ready in entrambe le condizioni, delegazione e cleanup, preferenze tra reload, SecurityError e quota simulati, navigazione nella cronologia, submit invalido, POST JSON e successo 204, errori HTTP/rete, campi multipli/disabilitati e file non selezionato.

Limiti: non sono collaudati un backend reale, Safari/Firefox, la matrice dei permessi/storage dei browser, una strategia CSRF completa, IndexedDB o il ciclo di vita di un Service Worker. Le parti non coperte da esecuzione sono state controllate nella documentazione, non presentate come testate.

Il comando e i prerequisiti riproducibili sono descritti in `_Meta/tests/README.md`. Il rapporto strutturale aggiornato conta 911 documenti raggiungibili, zero errori e 668 avvisi editoriali; il numero non misura la copertura tecnica.

### Pubblicazione locale

- Build Quartz completata sui 911 documenti: 2.003 HTML, 168 redirect e 134.114 riferimenti interni verificati, zero errori.
- Controllate nell'anteprima le note Form Handling e Validazione su desktop (1440 px) e Browser Storage su mobile (390 px): esempi aggiornati presenti, nessun errore JavaScript e nessun overflow orizzontale della pagina. I blocchi di codice lunghi scorrono internamente.
- Restano gli avvisi preesistenti del generatore su `eval` nel plugin note-properties e metadati Git della copia temporanea; non impediscono la build.
- Nessun commit, push o deploy remoto eseguito in questa revisione.

### Passaggio successivo

La revisione e proseguita con JavaScript Moderno, documentato di seguito.

## 2026-09-14 - JavaScript Moderno

### Perimetro e correzioni

Lette integralmente e corrette le sette note del blocco. Le fonti MDN, Node.js e Vite sono indicate nelle pagine; le note restano `non revisionato` fino all'approvazione dell'utente. Totale di questa passata: 20 note JavaScript.

| Nota                                                                                  | Intervento principale                                                                                                                                                    |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [[Programmazione/JavaScript/Pagine/Arrow Functions\|Arrow Functions]]                 | Corretto this al top-level ESM, chiariti arguments lessicale e call; timer con stop e avvio idempotente, callback con dati completi.                                     |
| [[Programmazione/JavaScript/Pagine/Template Literals\|Template Literals]]             | Distinti stringhe e tagged template, interpolazione istantanea, escape/raw e sicurezza; esempio DOM testuale completo.                                                   |
| [[Programmazione/JavaScript/Pagine/Default Parameters\|Default Parameters]]           | Default lazy, nuovi oggetti per chiamata, scope/TDZ e null; distinti URL/configurazione da connessione HTTP e timeout effettivamente applicato.                          |
| [[Programmazione/JavaScript/Pagine/Destructuring\|Destructuring]]                     | Iterabili, rinomina e assegnazione, null e livelli annidati; separate dichiarazioni incompatibili nello stesso scope e validata la forma dell'utente nell'esempio.       |
| [[Programmazione/JavaScript/Pagine/Spread & Rest Operators\|Spread & Rest Operators]] | Proprieta proprie enumerabili, limite argomenti, copie superficiali e merge con undefined; sostituita la falsa garanzia di oggetto pubblico con campi ammessi espliciti. |
| [[Programmazione/JavaScript/Pagine/Moduli\|Moduli]]                                   | Distinti browser e Node, formato ESM e risoluzione, cache e live binding; re-export e esempio multi-file con controllo email dichiaratamente parziale.                   |
| [[Programmazione/JavaScript/Pagine/Dynamic Import\|Dynamic Import]]                   | Corretti async catch, mappa dei moduli consentiti, cache e assunzioni sul download; aggiunto report completo con loading, guardia ai doppi click ed errori.              |

### Verifica degli esempi

- Aggiunti 26 test Node e 4 test browser: **75 test totali superati**, 58 Node.js `24.14.0` e 17 Chrome `153.0.8010.37`.
- ESM verificato mediante veri file temporanei estratti dai Markdown: risoluzione relativa, re-export, binding vivo, cache, import mancanti e rifiuti asincroni. Directory isolate e rimosse dopo controllo del percorso.
- Nel browser eseguiti tutti e tre i file del report: modulo non richiesto prima del click, stato di attesa, blocco dei doppi avvii, riuso della cache, errore di rete ed errore durante la valutazione.
- Verificati anche input null/falsy, default lazy, array condivisi, riferimenti annidati, campi pubblici, dati malformati, buchi negli array e overflow del totale.
- Limiti: test mirati, non esecuzione di ogni frammento; rete intercettata, nessun backend reale e nessuna matrice di browser, versioni Node o bundler. Le prestazioni del code splitting sono spiegate e da misurare nel progetto, non certificate da questi test.

### Verifica del vault

- `content:check -- --report`: 911 documenti raggiungibili, zero errori strutturali, 662 avvisi editoriali per fonti non esplicite nel vault.
- `content:test`: 9 test della trasformazione superati, distinti dai 75 test degli esempi.
- Comandi e prerequisiti in `_Meta/tests/README.md`; rapporto aggiornato in [[_Meta/Controllo del vault|Controllo del vault]].

### Pubblicazione locale

- Build completa riuscita: 911 documenti, 2.003 HTML, 168 redirect e 134.163 riferimenti interni verificati, zero errori.
- Ispezionate le sezioni aggiornate di Dynamic Import su desktop (1440 px) e Moduli su mobile (390 px): codice leggibile, nessun overflow orizzontale della pagina, nessun errore JavaScript o risposta HTTP fallita nell'anteprima.
- Restano soltanto gli avvisi preesistenti di build su `eval` del plugin note-properties e metadati Git della copia temporanea.
- L'anteprima locale serve i nuovi HTML; nessun commit, push o deploy remoto eseguito.

### Passaggio successivo

La revisione e proseguita con Strutture Dati e Manipolazione, documentato di seguito.

## 2026-09-15 - Strutture Dati e Manipolazione

### Perimetro e correzioni

Lette integralmente e corrette le sei note del blocco. Con questo intervento la passata tecnica comprende le 26 note del Percorso Base JavaScript; non i capitoli Intermedio e Avanzato. Il controllo e del modello: tutte le note modificate restano `non revisionato` fino all'approvazione dell'utente.

| Nota                                                                          | Intervento principale                                                                                                                                                                                       |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/JavaScript/Pagine/Array Methods\|Array Methods]]             | Distinti contenitori nuovi e riferimenti condivisi, callback e mutazioni, buchi e array vuoti; corretto accumulatore per chiavi arbitrarie, chiariti sort, slice/splice/fill e limiti delle callback async. |
| [[Programmazione/JavaScript/Pagine/Oggetti Avanzati\|Oggetti Avanzati]]       | Precisati enumerabilita, simboli, ereditarieta, ordine delle chiavi, target/setter di assign e freeze superficiale; contratto esplicito per removeEmptyFields.                                              |
| [[Programmazione/JavaScript/Pagine/Map e Set\|Map e Set]]                     | Identita, SameValueZero, ordine e proprieta size; deduplicazione per id, operazioni tra insiemi, perdite nelle conversioni e riferimenti forti; esempio di raggruppamento con input controllati.            |
| [[Programmazione/JavaScript/Pagine/JSON\|JSON]]                               | Separati formato, conversione e schema; omissioni/null/errori di stringify, reviver di date, controlli HTTP e selezione dei campi ammessi nell'esempio di preferenze.                                       |
| [[Programmazione/JavaScript/Pagine/Date & Time\|Date & Time]]                 | Distinti istante, data civile e durata, secondi/millisecondi e UTC/locale; parsing canonico, date invalide, normalizzazione, ora legale e misurazione monotona.                                             |
| [[Programmazione/JavaScript/Pagine/Regular Expressions\|Regular Expressions]] | Corretto risultato falso di /js/i su JavaScript; aggiunti escape, sintassi, g/y e lastIndex, matchAll, Unicode, RegExp.escape e limiti di validazione/ReDoS.                                                |

### Verifica degli esempi

- Aggiunti **34 test Node e 2 test browser**, tutti superati. Totale aggiornato: **111 test sugli esempi**, 92 Node.js `24.14.0` e 19 Chrome `153.0.8010.37`.
- Gli esempi sono estratti dai Markdown originali. Testate sia uscite attese sia errori intenzionali; HTTP simulato, senza backend reale.
- I test delle date usano processi Node con UTC, Europe/Rome e America/New_York e contesti Chrome con UTC/Europe-Rome. Verificati cambio d'ora primaverile, distinzione tra giorno locale e 24 ore, formato con fuso esplicito, anni bisestili e date inesistenti.
- Le regex sono provate con risultati positivi/negativi, input non stringa, newline finali, metacaratteri letterali, stato globale e Unicode composto/decomposto. Non sono eseguiti attacchi ReDoS o benchmark di sicurezza.
- Limiti: non ogni frammento e eseguito; nessuna matrice completa di runtime, fusi, transizioni storiche o librerie calendario. Temporal e descritto come alternativa da verificare, non implementato o collaudato qui.

### Verifica del vault

- `content:check -- --report`: 911 documenti raggiungibili, zero errori strutturali, 656 avvisi editoriali per fonti non esplicite nel vault.
- `content:test`: 9 test della trasformazione superati, separati dai test degli esempi.
- Comandi riproducibili in `_Meta/tests/README.md`; rapporto aggiornato in [[_Meta/Controllo del vault|Controllo del vault]].

### Pubblicazione locale

- Build Quartz completa riuscita: 911 documenti, 2.003 HTML, 168 redirect e 134.225 riferimenti interni verificati, zero errori.
- Ispezionate Date & Time su desktop (1440 px), Regular Expressions e JSON su mobile (390 px). Tabelle e testo leggibili, nessun overflow orizzontale della pagina e nessun errore JavaScript o risposta HTTP fallita.
- Riavviata l'anteprima locale sulla porta 8082, che non era piu attiva; serve gli HTML rigenerati sotto `/appunti/`.
- Restano gli avvisi preesistenti di Quartz su eval del plugin note-properties e metadati Git della directory temporanea. Nessun commit, push o deploy remoto eseguito.

### Passaggio successivo

La revisione e proseguita con Logica Interna, documentato di seguito.

## 2026-09-15 - Logica Interna JavaScript

### Perimetro e correzioni

Lette integralmente e corrette le cinque note del primo blocco intermedio. La passata comprende ora **31 note JavaScript**: le 26 del Percorso Base e queste cinque. Le note restano `non revisionato` fino al controllo dell'utente.

| Nota                                                        | Intervento principale                                                                                                                                                                                                                             |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/JavaScript/Pagine/Scope\|Scope]]           | Distinti identificatori e proprieta, scope globale e top-level di modulo, binding e inizializzazione. Corretto il caso window.name; aggiunti chiamante/definizione lessicale, shadowing in TDZ e contatori indipendenti.                          |
| [[Programmazione/JavaScript/Pagine/Hoisting\|Hoisting]]     | Separati modello concettuale ed esecuzione, dichiarazione e inizializzazione. Precisati typeof in TDZ, chiamata differita, funzioni nei blocchi strict, import statici e limite delle dipendenze circolari.                                       |
| [[Programmazione/JavaScript/Pagine/Closures\|Closures]]     | Distinti binding condivisi, stato per invocazione e valori derivati. Corretti sessione senza token e output Intl; aggiunti logout, controlli di formato, handle del timer e listener con smontaggio. Chiariti i limiti di riservatezza e memoria. |
| [[Programmazione/JavaScript/Pagine/Context\|Context]]       | Distinti execution context e this; specificati script classico, ESM e CommonJS, strictness della funzione, receiver/arrow/bind/new. Corretti metodo estratto, arrow su object literal e listener DOM, con riferimenti riutilizzabili per cleanup. |
| [[Programmazione/JavaScript/Pagine/Prototypes\|Prototypes]] | Corretta confusione fra prototipo del costruttore e delle istanze; spiegati null, shadowing, array condivisi, campi/metodi/static, limiti di instanceof e sostituzione del prototype. Esempio Counter con contratto e limiti numerici.            |

### Verifica degli esempi

- Aggiunti **36 test Node e 4 test Chrome**, tutti superati. Totale della suite: **151 test**, 128 Node.js `24.14.0` e 23 Chrome `153.0.8010.37`.
- Codice estratto dalle note originali; esempi ESM/CommonJS eseguiti in file nativi temporanei, non simulati come script globali.
- Verificati casi positivi ed errori intenzionali, binding di loop, input invalidi e token con newline, limiti numerici, rimozione/rimontaggio dei listener e collisione con window.name.
- I timer sono simulati nei test Node; i contesti browser sono temporanei e intercettano le richieste. Nessuna credenziale reale, autenticazione remota o modifica del browser personale.
- Limiti: non eseguiti tutti i frammenti delle note, nessuna matrice completa di motori/browser, misurazione della garbage collection o audit generale di sicurezza. La sessione della nota dimostra incapsulamento e formato, non verifica firma, scadenza o autorizzazioni.

### Verifica del vault

- `content:check -- --report`: 911 documenti raggiungibili, zero errori strutturali, 652 avvisi editoriali nel vault.
- `content:test`: 9 test della trasformazione superati, separati dai 151 test degli esempi.
- Comandi riproducibili in `_Meta/tests/README.md`; rapporto aggiornato in [[_Meta/Controllo del vault|Controllo del vault]].

### Pubblicazione locale

- Build Quartz completa riuscita: 911 documenti, 2.003 HTML, 168 redirect e 134.269 riferimenti interni verificati, zero errori.
- Ispezionati Context su desktop (1440 px), Closures e Prototypes su mobile (390 px): testo e gerarchie leggibili, blocchi di codice scorrevoli, nessun overflow della pagina, errore JavaScript o risposta HTTP fallita.
- Anteprima gia attiva su `http://localhost:8082/appunti/`, aggiornata con i nuovi HTML. Nessun commit, push o deploy remoto eseguito.
- Restano gli avvisi preesistenti di Quartz su eval del plugin note-properties e metadati Git della copia temporanea.

### Passaggio successivo

La revisione e proseguita con Programmazione ad Oggetti, documentato di seguito.

## 2026-09-18 - Programmazione ad Oggetti JavaScript

### Perimetro e correzioni

Lette integralmente e corrette le cinque note del blocco. La passata comprende ora **36 note JavaScript**: le 26 del Percorso Base e le 10 dei primi due blocchi intermedi. Le note restano `non revisionato` fino al controllo dell'utente.

| Nota                                                                                                | Intervento principale                                                                                                                                                                                                                                             |
| --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/JavaScript/Pagine/Classi\|Classi]]                                                 | Precisati new, TDZ, strictness, campi e metodi sul prototipo. Rettangolo con dimensioni validate e aggiornamenti coerenti; metodo estratto con receiver corretto. Sessione con hasToken, formato controllato e assenza del token distinta dall'autenticazione.    |
| [[Programmazione/JavaScript/Pagine/Ereditarietà\|Ereditarieta]]                                     | Chiariti super, receiver e campi propri, catene di costruttori e istanze, ordine di inizializzazione e metodi sovrascritti. Esempi di composizione e gerarchia Error con cause e status HTTP controllati.                                                         |
| [[Programmazione/JavaScript/Pagine/Incapsulamento\|Incapsulamento]]                                 | Distinte privacy, invarianti e immutabilita. Conto in centesimi interi con limiti numerici; carrello con campi ammessi, copie in ingresso/uscita e totale protetto da overflow. Conservato e segnalato il controesempio incompleto con riferimenti condivisi.     |
| [[Programmazione/JavaScript/Pagine/Private Fields e Static Blocks\|Private Fields e Static Blocks]] | Corretta equivalenza fra campi pubblici e assegnazioni tramite setter. Approfonditi private brand, static privati ereditati, ordine dei campi e blocchi statici. Registry con dati copiati/congelati e limiti espliciti di freeze, Proxy e serializzazione.       |
| [[Programmazione/JavaScript/Pagine/Property Descriptors\|Property Descriptors]]                     | Corretti default su proprieta nuove/esistenti, attributi non configurabili e accessor. Esplicitati errori strict, simboli, copie superficiali, JSON con replacer e definizioni non atomiche. Aggiunto il target mancante all'esempio che deve produrre TypeError. |

### Verifica degli esempi

- Aggiunti **43 test Node e 2 test Chrome**, tutti superati. Suite completa rieseguita: **196 test**, 171 Node.js `24.14.0` e 25 Chrome `153.0.8010.52`.
- Frammenti estratti dai Markdown originali; verificati risultati attesi, SyntaxError/TypeError intenzionali, overflow, stato invariato dopo input respinti e assenza di alias mutabili negli esempi del carrello e del registry.
- Provati campi rispetto ai setter, receiver, ereditarieta statica, private brand, ordine di inizializzazione, descrittori non configurabili e aggiornamenti parziali di defineProperties.
- I contesti browser sono temporanei e le richieste sono intercettate: nessun backend, credenziale reale o modifica del browser personale.
- Limiti: test mirati, non esecuzione di tutti i frammenti o matrice completa dei motori. Privacy e formato del token non certificano autenticazione, riservatezza, sicurezza applicativa o correttezza di un sistema contabile.

### Verifica del vault

- `content:check -- --report`: 911 documenti raggiungibili, zero errori strutturali, 648 avvisi editoriali nel vault.
- `content:test`: 9 test della trasformazione superati, separati dai 196 test degli esempi.
- Comandi riproducibili e prerequisiti in `_Meta/tests/README.md`; rapporto aggiornato in [[_Meta/Controllo del vault|Controllo del vault]].

### Pubblicazione locale

- Build Quartz completa riuscita: 911 documenti, 2.003 HTML, 168 redirect e 134.308 riferimenti interni verificati, zero errori.
- Ispezionate le sezioni aggiornate di Private Fields e Static Blocks su desktop (1440 px), Incapsulamento e Property Descriptors su mobile (390 px). Nessun overflow della pagina, errore JavaScript o risposta HTTP fallita; blocchi di codice scorrevoli e testo leggibile.
- Riavviata l'anteprima locale su `http://localhost:8082/appunti/`, che non era piu attiva. Nessun commit, push o deploy remoto eseguito.
- Restano gli avvisi preesistenti di Quartz su eval del plugin note-properties e metadati Git della copia temporanea.

### Passaggio successivo

La revisione e proseguita con le prime tre note di Asincronia e Networking, documentate di seguito.

## 2026-09-22 - Event Loop, Callback e Promises

### Perimetro e correzioni

Lette integralmente e corrette le tre note introduttive del blocco Asincronia e Networking. La passata comprende ora **39 note JavaScript**: le 26 del Percorso Base e 13 del Percorso Intermedio. Non e una revisione dell'intero capitolo asincrono. Le note restano `non revisionato` fino al controllo dell'utente.

| Nota                                                        | Intervento principale                                                                                                                                                                                                                                                                          |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/JavaScript/Pagine/Event Loop\|Event Loop]] | Distinti task, microtask, servizi del browser e opportunita di rendering; eliminata l'idea di un paint a ogni giro e di una coda FIFO universale. Corretto il busy wait, chiariti limiti dei timer e differenze Node/browser. Aggiunto esempio di elaborazione a blocchi con errori propagati. |
| [[Programmazione/JavaScript/Pagine/Callback\|Callback]]     | Separati ruolo della callback e momento di invocazione, return sincrono e risultato futuro, dispatchEvent e input utente. Completati filtro, listener con cleanup e lettura JSON error-first in Node; documentati errori sincroni/asincroni e rischio di callback richiamate due volte.        |
| [[Programmazione/JavaScript/Pagine/Promises\|Promises]]     | Precisati resolved/settled, esecutore sincrono, adozione dell'esito e nuova Promise di then. Chiariti return, catch di recupero, errori del ramo e finally. Completati timer con input validati, adattatore error-first e Fetch con errori HTTP, parsing e schema distinti.                    |

### Verifica degli esempi

- Aggiunti **33 test Node e 7 test Chrome**, tutti superati. Totale della suite: **236 test**, 204 Node.js `24.14.0` e 32 Chrome `153.0.8010.52`.
- Codice estratto dai Markdown, senza copie delle implementazioni nei test. Verificati output e ordine delle callback, stati adottati, percorsi di errore, array vuoti/sparsi, overflow e input non validi.
- Lettura e adattatore Promise eseguiti come ESM reali con file temporanei: successo UTF-8, JSON malformato, file mancante e argomenti invalidi. Verificato in un processo isolato che il throw del consumatore non provochi una seconda callback.
- Timer simulati per i contratti delle funzioni, timer e microtask reali nei test browser. Fetch intercettato con status HTTP, JSON e dati validi/invalidi; nessun backend o credenziale reale.
- Limiti: non ogni frammento e eseguito. Nessun benchmark di latenza, paint, frequenza dei frame o throttling; il busy wait intenzionalmente bloccante non e eseguito. Nessuna matrice completa di runtime e nessuna verifica delle restanti sei note del capitolo.

### Verifica del vault

- `content:check -- --report`: 911 documenti raggiungibili, zero errori strutturali, 645 avvisi editoriali nel vault.
- `content:test`: 9 test della trasformazione superati, separati dai test degli esempi.
- Comandi e limiti in `_Meta/tests/README.md`; rapporto aggiornato in [[_Meta/Controllo del vault|Controllo del vault]].

### Pubblicazione locale

- Build Quartz completa riuscita: 911 documenti, 2.003 HTML, 168 redirect e 134.362 riferimenti verificati, zero errori.
- Ispezionate Event Loop su desktop (1440 px) e mobile (390 px), Callback e Promises su mobile. Testo leggibile, nessun overflow della pagina, errore JavaScript o risposta HTTP fallita. Verificato anche lo scorrimento della tabella fino alla colonna Attenzione.
- Anteprima riavviata su `http://localhost:8082/appunti/` e aggiornata con gli HTML generati. Nessun commit, push o deploy remoto.
- Restano gli avvisi preesistenti di Quartz su eval del plugin note-properties e metadati Git della copia temporanea.

### Da proseguire

La revisione e proseguita con Promise avanzate e Async Await, documentate di seguito.

## 2026-10-05 - Promise avanzate e Async Await

### Perimetro e correzioni

Lette integralmente e corrette le due note. La passata comprende ora **41 note JavaScript**: le 26 del Percorso Base e 15 del Percorso Intermedio. Le note restano `non revisionato` fino al controllo dell'utente.

| Nota                                                                    | Intervento principale                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [[Programmazione/JavaScript/Pagine/Promise avanzate\|Promise avanzate]] | Chiariti combinatori, ordine dei risultati, input vuoti e fallimenti parziali. Separati timeout dell'attesa e abort della richiesta, con cleanup dei timer e controllo HTTP. Corretto il pool che creava rifiuti non gestiti tramite finally: ora limita i lavori attivi, non avvia altri elementi dopo il primo errore e attende quelli gia partiti prima di propagare il rifiuto. Esplicitati input, limiti e assenza di rollback. |
| [[Programmazione/JavaScript/Pagine/Async Await\|Async Await]]           | Precisati esecuzione sincrona iniziale, sospensione e propagazione degli errori. Distinti return e return await dentro try/catch/finally, avvio concorrente e attesa sequenziale, top-level await e moduli dipendenti. Completato loadUser con validazione di input e risposta, abort, timer mantenuto durante la lettura del corpo e cleanup; aggiunto il contesto degli errori senza nascondere la causa.                          |

### Verifica degli esempi

- Aggiunti **28 test Node e 5 test Chrome** sui frammenti estratti dai Markdown. Suite completa rieseguita il 5 ottobre: **269 test superati**, 232 Node.js `24.14.0` e 37 Chrome `154.0.8037.93`.
- Verificati ordine dei risultati, successo/errori dei combinatori, cleanup dei timer, errori HTTP/parsing/schema, input invalidi e differenza fra return e return await.
- Provati limite di concorrenza, arresto dei nuovi avvii, attesa dei lavori attivi, array vuoti/sparsi, copie superficiali e motivi di rifiuto anche undefined o zero. Nel browser verificata l'assenza di unhandledrejection con fallimenti multipli.
- Test browser con Fetch reale e richieste intercettate, abort prima della risposta e import di moduli reali con top-level await, sia riuscito sia fallito. Contesti temporanei, nessun backend o credenziale reale.
- Limiti: non tutti i frammenti sono eseguiti. Il caso abort durante la lettura del corpo usa una fixture Node. Nessuna misura di deadline, prestazioni, rate limit o carico; nessuna verifica di rollback o annullamento degli effetti lato server. I test non equivalgono alla revisione delle quattro note rimanenti del capitolo.

### Verifica del vault

- `content:check -- --report`: 911 documenti raggiungibili, zero errori strutturali, 644 avvisi editoriali nel vault.
- `content:test`: 9 test della trasformazione superati, separati dai test degli esempi.
- Comandi e limiti aggiornati in `_Meta/tests/README.md`; rapporto in [[_Meta/Controllo del vault|Controllo del vault]].

### Pubblicazione locale

- Recuperato e verificato l'esito della build Quartz completata prima dell'interruzione: 911 documenti, 2.003 HTML, 168 redirect e 134.394 riferimenti verificati, zero errori.
- Ispezionate entrambe le note su desktop (1440 px) e mobile (390 px), comprese concorrenza controllata, tabella degli input vuoti, return await e caricamento con timeout. Testo e codice leggibili, nessun overflow della pagina, errore JavaScript o risposta HTTP fallita.
- Anteprima riavviata su `http://localhost:8082/appunti/`. Nessun commit, push o deploy remoto.
- Restano gli avvisi preesistenti di Quartz su eval del plugin note-properties e metadati Git della copia temporanea.

### Da proseguire

La revisione e proseguita con Fetch API e AbortController, documentate di seguito.

## 2026-10-05 - Fetch API e AbortController

### Perimetro e correzioni

Lette integralmente e corrette le due note. La passata comprende ora **43 note JavaScript**: 26 del Percorso Base e 17 del Percorso Intermedio. Le note restano `non revisionato` fino al controllo dell'utente.

| Nota                                                                  | Intervento principale                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/JavaScript/Pagine/Fetch API\|Fetch API]]             | Distinti disponibilita della Response, lettura del corpo, HTTP, parsing e schema. Corretti wrapper duplicato e fusione degli header; supportati oggetti Headers e coppie, preservando i default. Aggiunti risposte HEAD/204/205, corpo monouso e clone, FormData con boundary automatico e validazione utente. Precisati credenziali, CORS, no-cors, limiti del retry e dell'abort.   |
| [[Programmazione/JavaScript/Pagine/AbortController\|AbortController]] | Corretti rifiuti non gestiti e listener conservati dopo il successo di wait. Chiariti signal monouso, motivi personalizzati, throwIfAborted, timeout e any. Completati timeout con cleanup, cancellazione manuale e ricerca con identita locale, query vuote, schema dei risultati e protezione dai completamenti obsoleti. Distinti cancellazione cooperativa e rollback del server. |

### Verifica degli esempi

- Aggiunti **28 test Node e 7 test Chrome**. Suite completa: **304 test superati**, 260 Node.js `24.14.0` e 44 Chrome `154.0.8037.93`.
- Verificata separatamente la sintassi dei 27 blocchi JavaScript delle due note (15 Fetch, 12 AbortController), racchiusi in funzioni async senza eseguirli indiscriminatamente. La prova sintattica non risolve le dipendenze applicative dichiarate negli schemi.
- Test estratti dalle note per wrapper, POST, clone, schema utente, timer, wait, ricerca e report. Provati successi ed errori, input invalidi, header in tre formati e preservazione di signal e opzioni.
- Verificati rimozione dei listener su successo/abort, motivi null e zero, risposta vecchia dopo quella nuova, vecchio finally durante una nuova richiesta, annullamento e query vuota. Le fixture ignorano intenzionalmente abort per verificare separatamente le protezioni della UI.
- Nel browser provati boundary multipart, header Authorization esplicito con credentials omit, signal preannullati, timeout nativo, any e cleanup DOM. Un server temporaneo limitato a `127.0.0.1` invia header e un corpo incompleto: verificato l'abort della lettura dopo Response fulfilled e chiusi server e connessioni alla fine.
- Limiti: non ogni frammento e eseguito; nessuna matrice completa dei browser o delle politiche CORS/cookie/cache/retry. Nessuna misura di deadline, carico o memoria, nessuna garanzia sugli effetti lato server. Il server locale e una fixture, non un backend applicativo collaudato.

### Verifica del vault

- `content:check -- --report`: 911 documenti raggiungibili, zero errori strutturali, 643 avvisi editoriali nel vault.
- `content:test`: 9 test della trasformazione superati, separati dai test degli esempi.
- Comandi e perimetro aggiornati in `_Meta/tests/README.md`; rapporto in [[_Meta/Controllo del vault|Controllo del vault]].

### Pubblicazione locale

- Build Quartz completa riuscita: 911 documenti, 2.003 HTML, 168 redirect e 134.424 riferimenti verificati, zero errori. Il primo tentativo era bloccato dai permessi del sandbox sulla risoluzione dei moduli; rieseguito con autorizzazione senza cambiare la configurazione.
- Ispezionate Fetch API e AbortController su desktop (1440 px) e mobile (390 px): wrapper, cookie, ricerca cancellabile e cleanup dell'attesa. Nessun overflow della pagina, errore JavaScript o risposta HTTP fallita; testo leggibile e codice nei contenitori scorrevoli.
- Anteprima aggiornata su `http://localhost:8082/appunti/`, nessun commit, push o deploy remoto. Rimangono i noti avvisi Quartz su eval del plugin note-properties e metadati Git della copia temporanea.

### Da proseguire

La revisione e proseguita con AJAX e WebSockets, insieme alla nota applicativa correlata Real-time con WebSocket. I chiarimenti su CORS in Fetch API non equivalgono a una revisione integrale della nota dedicata a CORS.

## 2026-10-05 - AJAX e WebSocket

### Perimetro e correzioni

Lette integralmente e corrette AJAX, WebSockets e Real-time con WebSocket. La passata comprende ora **46 note JavaScript**: 26 del Percorso Base, 19 del Percorso Intermedio e una di Applicazioni e Ecosistema. Il blocco di nove note **Asincronia e Networking** e stato interamente rivisto in questa passata; non equivale alla revisione di tutto JavaScript. Le note restano `non revisionato` fino al controllo dell'utente.

| Nota                                                                                  | Intervento principale                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [[Programmazione/JavaScript/Pagine/AJAX\|AJAX]]                                       | Distinti tecnica AJAX e API XHR/Fetch. Completati GET XHR con HTTP/parsing/timeout/abort separati e cleanup, schema utenti, montaggio e rimozione della lista senza HTML remoto. Precisati readyState, responseType, progress upload, CORS e polling senza sovrapposizioni.                                                    |
| [[Programmazione/JavaScript/Pagine/WebSockets\|WebSockets]]                           | Precisati handshake, stati, send senza ACK, limiti di close, messaggi binari e Ping/Pong. Aggiunti parsing con schema e limiti, controllo del buffer e backoff con jitter. Chiariti Origin/autenticazione, SSE e incompatibilita fra protocollo nativo e Socket.IO.                                                            |
| [[Programmazione/JavaScript/Pagine/Real-time con WebSocket\|Real-time con WebSocket]] | Sostituito reconnect incondizionato con client start/stop, retry solo su close, codici espliciti, budget totale, cleanup e nuova sottoscrizione. Riutilizzati gli helper della nota WebSockets. Dichiarati protocollo, callback e limiti: nessun ACK, autenticazione completa, heartbeat o recupero automatico dei dati persi. |

### Verifica degli esempi

- Aggiunti **25 test Node e 12 test Chrome**. Suite completa: **341 test superati**, 285 Node.js `24.14.0` e 56 Chrome `154.0.8037.93`.
- Esempi estratti dai Markdown; fixture XHR per errori terminali, motivi di abort, cleanup e input invalidi. WebSocket simulati tramite EventTarget per budget, backoff, stop, stato dei vecchi socket e rimozione dei listener.
- Nel browser provati XHR nativo, rendering testuale, richieste non sovrapposte, conservazione della lista su errore e assenza di aggiornamenti dopo unmount. ProgressEvent sintetici verificano il componente progress, non un upload reale.
- Tre server WebSocket temporanei su loopback con la libreria ws gia installata verificano handshake, sottoscrizione, messaggi testuali/binari, interruzione anomala, riconnessione e vincoli nativi di send/close. Contesti, connessioni e server vengono chiusi dai test.
- Verificata anche la sintassi di tutti i 23 blocchi JS delle tre note (8 AJAX, 13 WebSockets, 2 Real-time), con wrapper async senza esecuzione indiscriminata.
- Limiti: niente matrice completa di runtime, TLS, autenticazione, heartbeat, replay, ACK applicativi o prove di carico/backpressure. Le fixture non certificano backend, exactly-once o prestazioni di rete.

### Verifica del vault

- `content:check -- --report`: 911 documenti raggiungibili, zero errori strutturali, 641 avvisi editoriali nel vault.
- `content:test`: 9 test della trasformazione superati, separati dagli esempi.
- Comandi, dipendenze e limiti aggiornati in `_Meta/tests/README.md`; rapporto in [[_Meta/Controllo del vault|Controllo del vault]].

### Pubblicazione locale

- Build Quartz completa riuscita: 911 documenti, 2.003 HTML, 168 redirect e 134.477 riferimenti verificati, zero errori.
- Ispezionate tutte e tre le note su desktop (1440 px) e mobile (390 px), compresi wrapper XHR, montaggio della lista, tabella HTTP/WebSocket e client con start/stop. Nessun overflow della pagina, errore JavaScript o risposta HTTP fallita; codice nei contenitori scorrevoli.
- Anteprima aggiornata su `http://localhost:8082/appunti/`. Nessun commit, push o deploy remoto. Rimangono i noti avvisi Quartz su eval del plugin note-properties e metadati Git della copia temporanea.

### Da proseguire

La revisione e proseguita con Functional Programming e Design Patterns, documentate di seguito.

## 2026-10-05 - Functional Programming e Design Patterns

### Perimetro e correzioni

Lette integralmente e corrette le due note iniziali di **Stile e Paradigmi**. La passata comprende ora **48 note JavaScript**: 26 del Percorso Base, 21 del Percorso Intermedio e una di Applicazioni e Ecosistema. Le note restano `non revisionato` fino al controllo dell'utente. I richiami alle pagine su immutabilita e decorators non equivalgono alla loro revisione completa.

| Nota                                                                                | Intervento principale                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/JavaScript/Pagine/Functional Programming\|Functional Programming]] | Distinti purezza, determinismo, lettura dell'ambiente e side effect. Precisati copie superficiali, mutazione locale, callback map/filter e Promise. Aggiunti pipeline sincrona con contratto, currying rispetto a partial application, tempo come input e separazione fra trasformazione utenti e shell DOM. Schema, array sparsi, duplicati e ordinamento UTF-16 espliciti.                          |
| [[Programmazione/JavaScript/Pagine/Design Patterns\|Design Patterns]]               | Distinti simple factory, stato di modulo e singleton universale. Observer con snapshot, cleanup, iscrizioni indipendenti e politica fail-fast. Strategie in Map con nomi e input controllati. Wrapper con this/argomenti/return preservati, logger iniettato e limiti asincroni. Validazioni testuali con configurazione verificata prima dello short-circuit e limiti del controllo email espliciti. |

### Verifica degli esempi

- Aggiunti **31 test Node e 2 test Chrome**. Suite completa: **374 test superati**, 316 Node.js `24.14.0` e 58 Chrome `154.0.8037.93`.
- Test estratti dai Markdown, con input congelati e controlli dei riferimenti per aggiornamenti immutabili; pipeline provata per ordine, zero passi, errori e mancata attesa delle Promise. Verificati casi utenti vuoti, sparsi e malformati.
- Observer provato per ordine sincrono, callback duplicate, iscrizioni durante notify, rimozione prima del turno, cleanup ripetibile, errori e payload condiviso. Verificati nomi speciali delle strategie, limiti degli sconti e configurazioni invalide anche dopo una regola che fallirebbe.
- Wrapper provato per this, argomenti, risultato, identita della Promise e propagazione degli errori. I test ESM importano i frammenti come moduli reali, in Node tramite URL data e in Chrome tramite richieste intercettate; confermata la condivisione solo per la stessa identita di modulo.
- Shell DOM provata in Chrome con sostituzione della lista, dati vuoti e contenuto simile a HTML reso come testo. Nessun servizio esterno o credenziale reale.
- Verificata anche la sintassi dei 26 blocchi JS (17 Functional Programming, 9 Design Patterns) come moduli con vm.SourceTextModule, senza eseguirli in questa verifica.
- Limiti: non e una prova generale di purezza con oggetti arbitrari, precisione contabile o conformita email completa. Niente benchmark, verifica del garbage collector, matrice di bundler/runtime o messaggistica distribuita. Il Subject resta intenzionalmente sincrono.

### Verifica del vault

- `content:check -- --report`: 911 documenti raggiungibili, zero errori strutturali, 640 avvisi editoriali nel vault.
- `content:test`: 9 test della trasformazione superati, separati dagli esempi.
- Comandi, copertura e limiti aggiornati in `_Meta/tests/README.md`; rapporto in [[_Meta/Controllo del vault|Controllo del vault]].

### Pubblicazione locale

- Build Quartz completa riuscita: 911 documenti, 2.003 HTML, 168 redirect e 134.511 riferimenti verificati, zero errori. Il primo tentativo era bloccato dai permessi del sandbox nella risoluzione dei moduli; rieseguito con autorizzazione senza cambiare la configurazione.
- Ispezionate entrambe le note su desktop (1440 px) e mobile (390 px): selezione utenti, pipeline, shell DOM, Observer, wrapper e tabella dei pattern. Nessun overflow della pagina, errore JavaScript o risposta HTTP fallita. Verificato lo scorrimento orizzontale della tabella mobile fino all'ultima colonna.
- Anteprima aggiornata su `http://localhost:8082/appunti/`, nessun commit, push o deploy remoto. Rimangono i noti avvisi Quartz su eval del plugin note-properties e metadati Git della copia temporanea.

### Da proseguire

La revisione e proseguita con Immutabilita e Copia degli Oggetti e Generators e Iterators, documentate di seguito.

## 2026-10-05 - Immutabilita e generatori

### Perimetro e correzioni

Lette integralmente e corrette le ultime due note di **Stile e Paradigmi**. Sono ora **50 note JavaScript**: tutte le 26 del Percorso Base, tutte le 23 del Percorso Intermedio e Real-time con WebSocket. Il completamento riguarda questa passata tecnica: le note restano `non revisionato` fino al controllo dell'utente. Non equivale alla revisione del Percorso Avanzato o dell'intero ecosistema.

| Nota                                                                                                        | Intervento principale                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/JavaScript/Pagine/Immutabilita e Copia degli Oggetti\|Immutabilita e Copia degli Oggetti]] | Corretti valore riferimento, copie superficiali, getter e differenze spread/assign. Precisati structuredClone, alias, tipi esclusi, perdita di descrittori, transfer e memoria condivisa. Corrette tabelle freeze/seal/preventExtensions, accessor e stato interno. DeepFreeze iterativo con cicli e dominio esplicito; patch utente con campi ammessi, schema e riferimenti conservati. |
| [[Programmazione/JavaScript/Pagine/Generators e Iterators\|Generators e Iterators]]                         | Distinti iterator/iterable e cursori monouso/riavviabili. Aggiunti next con input, return finale, throw, finally e chiusura anticipata. Range con interi sicuri, helper lazy e wait definita. Paginazione con query preservata, HTTP/JSON/schema separati, limite pagine, signal e stop senza prefetch; dichiarati i limiti di memoria e di cancellazione.                               |

### Verifica degli esempi

- Aggiunti **38 test Node e 5 test Chrome**. Suite completa: **417 test superati**, 354 Node.js `24.14.0` e 63 Chrome `154.0.8037.93`.
- Gli helper sotto test sono estratti dai Markdown. Prove API aggiuntive verificano getter, alias, descrittori, tipi clonabili, JSON, transfer e SharedArrayBuffer. Provati anche freeze di accessor/Map/Date/DataView e rifiuto delle typed array non vuote.
- DeepFreeze provato con cicli, riferimenti ripetuti, chiavi Symbol, proprieta non enumerabili, contenitori gia frozen, record con prototipo null e rifiuto di accessor senza invocarli o congelare parzialmente il grafo durante la validazione.
- Test su aggiornamenti immutabili, patch sconosciute e schema invalido. Per generatori: next/return/throw, cursori indipendenti, cleanup su break/errore/esaurimento, return prima dell'avvio, yield nel finally, estremi sicuri e helper Iterator.
- Paginazione provata con Fetch simulato e Fetch nativo Chrome intercettato: HTTP/parsing/schema, query, limite richieste, fine su array vuoto, break, abort e assenza di cancellazione implicita tramite return. Timer simulati verificano l'avvio lazy, non il tempo trascorso.
- Verificata la sintassi di tutti i 43 blocchi JS (30 copie, 13 generatori) come moduli con vm.SourceTextModule, senza esecuzione indiscriminata. I frammenti non selezionati nei test non sono certificati dalla sola prova sintattica.
- Limiti: niente audit di Proxy ostili, matrice di tipi host/browser, prestazioni, memoria sotto carico o backend reale. SharedArrayBuffer e provato in Node; la disponibilita browser dipende dall'ambiente. La paginazione non garantisce snapshot, deduplicazione, timeout o retry.

### Verifica del vault

- `content:check -- --report`: 911 documenti raggiungibili, zero errori strutturali, 639 avvisi editoriali nel vault.
- `content:test`: 9 test della trasformazione superati, separati dagli esempi.
- Comandi e limiti aggiornati in `_Meta/tests/README.md`; rapporto in [[_Meta/Controllo del vault|Controllo del vault]].

### Pubblicazione locale

- Build Quartz completa riuscita: 911 documenti, 2.003 HTML, 168 redirect e 134.555 riferimenti verificati, zero errori. Eseguita con autorizzazione per il problema noto del sandbox nella risoluzione dei moduli.
- Ispezionate entrambe le note su desktop (1440 px) e mobile (390 px): deepFreeze, tabella freeze/seal, chiusura dei generator e paginazione. Nessun overflow della pagina, errore JavaScript o risposta HTTP fallita. Verificato lo scorrimento della tabella mobile fino all'ultima colonna.
- Anteprima aggiornata su `http://localhost:8082/appunti/`, nessun commit, push o deploy remoto. Rimangono i noti avvisi Quartz su eval del plugin note-properties e metadati Git della copia temporanea.

### Da proseguire

La revisione e proseguita con Web Workers e Service Workers e PWA, documentate di seguito.

## 2026-10-06 - Web Workers e Service Workers/PWA

### Perimetro e correzioni

Lette integralmente e corrette le prime due note di **Web APIs Avanzate**. Sono ora **52 note JavaScript**: 26 del Percorso Base, 23 del Percorso Intermedio, due del Percorso Avanzato e Real-time con WebSocket. Rimangono `non revisionato` fino al controllo dell'utente. Nessun worker e stato aggiunto al sito Quartz.

| Nota                                                                              | Intervento principale                                                                                                                                                                                                                                                                                                                                                                             |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/JavaScript/Pagine/Web Workers\|Web Workers]]                     | Distinti thread, asincronia, costi di comunicazione e limiti del contesto. Corretti percorsi classic/module, clone/transfer e cancellazione. Aggiunto job con protocollo, limiti numerici, timeout, abort, errori e terminazione su ogni esito. Chiariti SharedWorker, pool e limiti di sicurezza.                                                                                                |
| [[Programmazione/JavaScript/Pagine/Service Workers e PWA\|Service Workers e PWA]] | Distinti scope, registrazione, ready, attivazione e controller. Rimossa la cancellazione indiscriminata delle cache e corretti fallback, HTTP e scritture non attese. Strategie per endpoint pubblico con allowlist e waitUntil; precache e navigazione offline completi. Precisati update conservativo, comandi opzionali, manifest nei sottopercorsi, installabilita, push, sync e dismissione. |

### Verifica degli esempi

- Aggiunti **10 test Node e 18 test Chrome**. Suite completa: **445 test superati**, 364 Node.js `24.14.0` e 81 Chrome `154.0.8037.98`.
- Snippet estratti dai Markdown. Test Node su cache-first, network-first e stale-while-revalidate: allowlist, credenziali, hit/miss, HTTP/guasti di rete, clone, scritture fallite, revalidate e registrazione sincrona di waitUntil. Push e handler opzionali di aggiornamento usano API simulate.
- Worker reali su server loopback: moduli, calcolo, input vuoti/sparsi/non numerici, overflow, limiti, DataCloneError, caricamento fallito, errore runtime, protocollo invalido, timeout, abort anche con motivo falsy e transfer del buffer. Messageerror sintetico verifica la chiusura una sola volta.
- Service Worker reali in contesti browser isolati: prima visita non controllata, ready, navigazione controllata, scope, precache, cache di altre app preservate, offline, cache eliminata e Response 503, errori HTTP e filtri per query/POST/Authorization/Range.
- Provato update con due client: nuova versione in waiting fino alla chiusura dell'ultimo vecchio client, poi attivazione e pulizia della sola cache precedente. Un update con precache fallito mantiene la versione attiva; unregister non cancella le cache. La prova attende lo stato activated, non si limita all'avvio dell'evento activate.
- Verificata anche la sintassi dei 19 blocchi JS (7 Web Workers, 12 Service Workers/PWA) e del manifest JSON. La sola verifica sintattica non certifica l'esecuzione di tutti i frammenti.
- Limiti: niente benchmark, matrice browser/CSP, SharedWorker/pool, installazione PWA su dispositivo, push reale, Background Sync o aggiornamento forzato nativo. Quota e alcuni handler sono simulati. Nessuna registrazione o pulizia nel sito pubblicato o nel profilo personale; le fixture chiudono server, contesti e worker.

### Verifica del vault

- `content:check -- --report`: 911 documenti raggiungibili, zero errori strutturali, 637 avvisi editoriali nel vault.
- `content:test`: 9 test della trasformazione superati, separati dagli esempi.
- Comandi, copertura e limiti aggiornati in `_Meta/tests/README.md`; rapporto in [[_Meta/Controllo del vault|Controllo del vault]].

### Pubblicazione locale

- Build Quartz completa riuscita: 911 documenti, 2.003 HTML, 168 redirect e 134.575 riferimenti verificati, zero errori. Usata l'autorizzazione necessaria per risolvere i moduli fuori dal sandbox; nessuna modifica alla configurazione del generatore.
- Controllate entrambe le note su desktop (1440 px) e mobile (390 px): esempio del worker, errori/terminazione, lifecycle, tabella delle strategie e precache. Nessun overflow della pagina, errore JavaScript o risposta HTTP fallita; ultima colonna della tabella mobile raggiungibile con scorrimento.
- Anteprima aggiornata su `http://localhost:8082/appunti/`; nessun Service Worker registrato dall'anteprima, nessun commit, push o deploy remoto. Restano gli avvisi noti di Quartz su eval nel plugin note-properties e metadati Git della copia temporanea.

### Da proseguire

La revisione e proseguita con Web Components e Scheduling Browser, documentate di seguito.

## 2026-10-06 - Web Components e Scheduling Browser

### Perimetro e correzioni

Lette integralmente e corrette altre due note di **Web APIs Avanzate**. Sono ora **54 note JavaScript**: 26 del Percorso Base, 23 del Percorso Intermedio, quattro del Percorso Avanzato e Real-time con WebSocket. Status ancora `non revisionato`, in attesa del controllo dell'utente; date e pubblicabilita conservate.

| Nota                                                                        | Intervento principale                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/JavaScript/Pagine/Web Components\|Web Components]]         | Corretti uso di innerHTML con dati degli attributi, role applicativo e registrazioni duplicate. Chiariti constructor, upgrade, attributi/proprieta, booleani e riconnessioni. Esempi completi con template, slot, toggle accessibile, eventi e cleanup dei listener esterni. Precisati isolamento CSS, closed non sicuro, limiti di form-associated elements e integrazione framework. |
| [[Programmazione/JavaScript/Pagine/Scheduling Browser\|Scheduling Browser]] | Corretti timeout idle scambiato per deadline, polling sovrapposto, animazioni basate su timestamp assoluto e NodeList trattata come array. Aggiunti polling annullabile, animazione con reduced motion, coda idle limitata con fallback, feature detection di Scheduler e somma con budget/abort. Distinti task, microtask, paint, cancellazione cooperativa e parallelismo.           |

### Verifica degli esempi

- Aggiunti **31 test Node e 20 test Chrome**. Suite completa: **496 test superati**, 395 Node.js `24.14.0` e 101 Chrome `154.0.8037.98`.
- Snippet estratti dai Markdown, non ricopiati nei test. Timer, clock, rAF e deadline simulati verificano polling senza sovrapposizione, retry, stop/abort, budget temporale e numerico, validazione, overflow, rifiuti di yield e cancellazione dei job idle. Gli assert asincroni attendono la conclusione delle microtask anche quando la Promise arriva da un altro realm.
- Componenti reali nel browser: inserimento come testo, attributi modificati/rimossi, stato alla riconnessione, registro, template indipendenti, proprieta assegnate prima dell'upgrade, booleani, click/tastiera, focus e disabilitazione. Verificati eventi attraverso uno shadow tree esterno, retargeting, slot, custom properties/part e rimozione/riattivazione del listener resize.
- Scheduling reale in Chrome: rAF, reduced motion emulato, misure border-box, requestIdleCallback, scheduler.yield e postTask. Contesti isolati e rete intercettata; nessun servizio remoto o modifica al browser personale.
- Verificata sintassi di **18 blocchi JavaScript** (5 Web Components e 13 Scheduling Browser). Non equivale all'esecuzione integrale di ogni variante.
- Limiti: niente matrice browser, audit completo di accessibilita/screen reader, integrazione framework, form-associated elements, Declarative Shadow DOM o adozione fra documenti. Nessuna garanzia misurata su paint, scadenze, frame rate, throttling o priorita sotto carico. Il polling non collauda un backend reale.

### Verifica del vault

- `content:check -- --report`: 911 documenti raggiungibili, zero errori strutturali, 636 avvisi editoriali.
- `content:test`: 9 test della trasformazione superati, separati dai test degli esempi.
- Copertura e comandi aggiornati in `_Meta/tests/README.md`; rapporto in [[_Meta/Controllo del vault|Controllo del vault]].

### Pubblicazione locale

- Build Quartz completa riuscita: 911 documenti, 2.003 HTML, 168 redirect e 134.570 riferimenti verificati, zero errori. Usata l'autorizzazione necessaria per risolvere i moduli fuori dal sandbox; nessuna modifica al generatore. Restano gli avvisi noti su eval del plugin note-properties e metadati Git della copia temporanea.
- Ispezionate entrambe le note su desktop (1440 px) e mobile (390 px): template/toggle e spiegazione del budget idle. Nessun overflow della pagina, errore JavaScript o risposta HTTP fallita; ultima colonna delle tabelle raggiungibile tramite scorrimento.
- Nessun commit, push o deploy remoto. Anteprima locale su `http://localhost:8082/appunti/`.

### Da proseguire

La revisione e proseguita con WebAssembly interop, documentata di seguito.

## 2026-10-07 - WebAssembly interop

### Perimetro e correzioni

Letta integralmente e ampliata [[Programmazione/JavaScript/Pagine/WebAssembly interop|WebAssembly interop]]. Il totale e ora **55 note JavaScript**: 26 del Percorso Base, 23 del Percorso Intermedio, cinque del Percorso Avanzato e Real-time con WebSocket. La nota rimane `non revisionato`; data originale e pubblicabilita conservate.

- Distinti byte, Module e Instance, overload di instantiate, import/export, ABI numerica i32/i64, asincronia e parallelismo. Aggiunti controlli HTTP, streaming con MIME esatto, fallback senza doppio download e limiti dell'abort durante compilazione/istanziazione.
- Aggiunto un sorgente WAT completo con import log, funzioni numeriche e memoria, compilabile con WABT; pagina HTML e modulo JS del demo esplicitano HTTP, URL relativi al modulo e prerequisiti. Nessun asset dimostrativo viene aggiunto al sito Quartz.
- Chiariti memoria lineare e memoria condivisa fra thread, viste/copie, crescita e buffer distaccati, UTF-8 e range. Helper con contratto wasm32 non condiviso, capacita controllata e regione riservata; niente offset arbitrari dentro allocatori Rust/C/C++.
- Distinti errori rete/HTTP/MIME, CompileError, LinkError, TypeError, trap ed errori host. Aggiunti limiti di toolchain, binding, worker, WASI, feature opzionali, CSP e prestazioni; collegamenti alle note Rust gia presenti e fonti ufficiali.

### Verifica degli esempi

- **32 nuovi test Node e 12 Chrome**, tutti superati. Suite completa: **540 test**, 427 Node.js `24.14.0` e 113 Chrome `154.0.8037.98`.
- WAT estratto dal Markdown, compilato e validato con `wabt@1.0.39`. Dipendenza installata con script disattivati in `%TEMP%/appunti-wasm-tools`, esterna al repository; nessuna modifica alle dipendenze di Quartz. Il helper compila il sorgente della nota a ogni esecuzione.
- Verificati conversioni e overflow, i64 con BigInt, overload, memorie indipendenti, import errati, trap, errori delle callback, fallback, HTTP e abort. Helper memoria provati su byte UTF-8, NUL, surrogate isolate, limiti, capacita insufficiente senza scritture parziali, crescita e rifiuto della memoria condivisa.
- Browser: pagina e moduli del demo eseguiti sotto `/demo/`, corretto import.meta.url, streaming nativo, fallback, errori, memoria e CSP restrittiva con/senza autorizzazione mirata. HTTP intercettato, motore Wasm nativo e contesti isolati. Il risultato BigInt viene controllato nel realm browser, indipendentemente dalla serializzazione della console del runner.
- Verificata inoltre la sintassi di tutti i **7 blocchi JS** come moduli. Il comando del server Python e un prerequisito documentato, non il server usato dai test.
- Limiti: nessun benchmark o matrice completa browser/CORS; non compilate toolchain Rust/C/C++, binding, WASI, SIMD, memory64, Wasm GC o thread condivisi. Le prove di abort tardivo controllano lo scarto del risultato, non l'interruzione della compilazione nativa.

### Verifica del vault

- `content:check -- --report`: 911 documenti raggiungibili, zero errori strutturali, **635 avvisi editoriali**.
- `content:test`: 9 test della trasformazione superati. Copertura, dipendenze e comandi aggiornati in `_Meta/tests/README.md`.

### Pubblicazione locale

- Build Quartz completa riuscita: 911 documenti, 2.003 HTML, 168 redirect e 134.620 riferimenti verificati, zero errori. Rimangono i noti avvisi su eval del plugin note-properties e metadati Git della copia temporanea; nessuna modifica alla configurazione del generatore.
- Ispezionata la nota su desktop (1440 px) e mobile (390 px): sorgente WAT, descrizioni ed esempi. Nessun overflow della pagina, errore JavaScript o risposta HTTP fallita; ultima colonna delle tre tabelle raggiungibile con scorrimento.
- Riavviata l'anteprima locale sulla porta libera 8082, in background senza finestra. Nessun commit, push o deploy remoto.

### Da proseguire

Le voci di Web APIs Avanzate sono coperte in questa passata: Browser Storage/IndexedDB era gia nel Percorso Base. La revisione e proseguita con Memory Lifecycle e Garbage Collection, documentate di seguito.

## 2026-10-07 - Memory Lifecycle e Garbage Collection

### Perimetro e correzioni

Lette integralmente e corrette le prime due note di **Runtime, Memoria e Performance**. Totale di questa passata: **57 note JavaScript**, 26 del Percorso Base, 23 del Percorso Intermedio, sette del Percorso Avanzato e Real-time con WebSocket. Status `non revisionato`, date originali e pubblicabilita conservati; nessuna nuova nota o modifica agli indici.

| Nota                                                                        | Intervento principale                                                                                                                                                                                                                                                                                                                           |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/JavaScript/Pagine/Memory Lifecycle\|Memory Lifecycle]]     | Corretta la corrispondenza rigida primitivi/stack e oggetti/heap; precisati binding, alias, passaggio per valore, closure e durata delle Promise. Distinti riferimenti applicativi e risorse host. Aggiunti widget e ticker con contratti, cleanup idempotente e reset dei riferimenti interni, senza mutare i dati del chiamante.              |
| [[Programmazione/JavaScript/Pagine/Garbage Collection\|Garbage Collection]] | Corrette root e raggiungibilita, cicli e reference counting semplice; precisati generazioni, write barrier, pause e differenze incrementale/parallelo/concorrente. Sostituiti helper indefiniti con esempi completi. Aggiunti limiti di WeakRef/FinalizationRegistry, percorso di diagnosi e metriche Node, distinguendo raccolta, riuso e RSS. |

### Verifica degli esempi

- **24 nuovi test Node e 8 Chrome**, tutti superati. Suite completa: **572 test**, 451 Node.js `24.14.0` e 121 Chrome `154.0.8037.98`.
- Esempi estratti dai Markdown. Verificati primitivi, alias, mutazioni tramite parametri, contatori indipendenti, cicli e Map. Il ticker usa timer simulati: input invalidi prima della registrazione, lunghezza corrente, stop ripetuto, callback obsoleta, stop interno ed errori propagati.
- Browser: eseguiti markup, avvio e cleanup del widget; verificati click, dati frozen del chiamante preservati, listener esterni intatti, ID come testo, parametri invalidi, 20 cicli mount/unmount e nodi distaccati. Callback e cleanup richiamati dopo lo stop non producono effetti.
- WeakRef e FinalizationRegistry native nei casi deterministici; ramo senza target simulato e dichiarato. La lettura di memoryUsage e eseguita come modulo Node in un processo separato. Verificata la sintassi di tutti i **16 blocchi JS**, 10 Memory Lifecycle e 6 Garbage Collection.
- La prima suite completa, eseguita mentre partiva la build, ha avuto un timeout di navigazione nel precedente test Wasm. Dopo la build la riesecuzione con `--test-concurrency=1` e passata integralmente, senza modificare quel test. Comando seriale documentato nel README per contenere il carico.
- Limiti: nessun GC forzato, attesa di finalizer, heap snapshot o benchmark di memoria. I test verificano effetti del cleanup e contratti, non recupero fisico o tempi di raccolta. Nessuna matrice completa di motori o risorse native; ticker limitato a callback sincrone, widget a dati ordinari e pulsanti dello stesso realm.

### Verifica del vault

- `content:check -- --report`: 911 documenti raggiungibili, zero errori strutturali, **633 avvisi editoriali**.
- `content:test`: 9 test della trasformazione superati. Aggiornati `_Meta/tests/README.md` e [[_Meta/Controllo del vault|Controllo del vault]].

### Pubblicazione locale

- Build Quartz completa riuscita: 911 documenti, 2.003 HTML, 168 redirect e **134.664 riferimenti** verificati, zero errori. Restano gli avvisi noti su eval del plugin note-properties e metadati Git della copia temporanea; nessuna modifica alla configurazione del generatore.
- Ispezionate entrambe le note su desktop (1440 px) e mobile (390 px): widget/cleanup e spiegazione/tabella del collector. Nessun overflow della pagina, errore JavaScript o risposta HTTP fallita; verificato lo scorrimento delle tabelle fino all'ultima colonna.
- Anteprima gia attiva su `http://localhost:8082/appunti/`, nessun nuovo server, commit, push o deploy remoto.

### Da proseguire

La revisione e proseguita con Memory Leaks e WeakMap e WeakSet, documentate di seguito.

## 2026-10-07 - Memory Leaks e WeakMap/WeakSet

### Perimetro e correzioni

Lette integralmente e ampliate altre due note di **Runtime, Memoria e Performance**. Totale di questa passata: **59 note JavaScript**, 26 del Percorso Base, 23 del Percorso Intermedio, nove del Percorso Avanzato e Real-time con WebSocket. Conservati date originali, pubblicabilita e status `non revisionato`; nessuna nuova pagina o modifica all'indice.

| Nota                                                                      | Intervento principale                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/JavaScript/Pagine/Memory Leaks\|Memory Leaks]]           | Distinti leak, bloat, allocazioni temporanee e risultati async obsoleti. Corretti listener anonimi considerati irremovibili, uso di once e abort dopo await. Sostituiti helper indefiniti con vista cancellabile, cache LRU limitata e richiesta con HTTP/JSON/schema, abort e guardia dopo lo smontaggio. Precisati DOM distaccato, alias e limiti della diagnosi.                            |
| [[Programmazione/JavaScript/Pagine/WeakMap e WeakSet\|WeakMap e WeakSet]] | Risolta la contraddizione sui simboli non registrati. Chiariti identita, scritture invalide rispetto a interrogazioni, undefined presente, assenza di clear/enumerazione ed ephemeron. Completati metadati DOM, stato privato, visita iterativa di un grafo e inserimento se assente con compatibilita. Distinti visita senza duplicati, rilevamento cicli, invalidazione e politica di cache. |

### Verifica degli esempi

- **34 nuovi test Node e 15 Chrome**, tutti superati. Suite completa seriale: **621 test**, 485 Node.js `24.14.0` e 136 Chrome `154.0.8037.98`, senza build concorrente.
- Snippet estratti dai Markdown. Provati globali non strict/strict in realm isolati, snapshot dell'ID, LRU con limiti, recenza get/set, has non aggiornante, alias, undefined, eviction, delete e clear. API deboli provate con oggetti, funzioni, simboli non registrati e chiavi non valide.
- Verificati stato privato e receiver invalido, fallback has/set, visita con cicli e nodi condivisi, input invalidi e profondita di 12.000 livelli. La visita non pretende di classificare i cicli ne di usare memoria costante.
- Browser: markup, avvio e cleanup delle viste, 20 cicli mount/unmount, callback obsolete e listener altrui preservati. Fetch nativo con HTTP intercettato prova successo, zero, errori HTTP/JSON/schema e abort durante l'attesa. Risposte, corpo ed errori tardivi di operazioni che ignorano il signal non aggiornano l'output smontato.
- Chrome esegue getOrInsert/getOrInsertComputed nativi, compresa presenza con valore undefined e factory lazy; Node 24.14.0 non li espone e percorre il fallback. Verificata anche la sintassi di tutti i **21 blocchi JS**, 11 Memory Leaks e 10 WeakMap/WeakSet.
- Limiti: niente GC forzato, profiler, heap snapshot o benchmark. Non provato il rilascio fisico degli ephemeron. LRU limitata per voci, non byte; niente TTL, cleanup dei valori o deduplicazione async. Visita di record ordinari senza getter/Proxy; fallback sincrono dimostrativo, non polyfill completo. Nessun backend reale o matrice di browser.

### Verifica del vault

- `content:check -- --report`: 911 documenti raggiungibili, zero errori strutturali, **631 avvisi editoriali**.
- `content:test`: 9 test della trasformazione superati. Comandi e limiti aggiornati in `_Meta/tests/README.md`; rapporto in [[_Meta/Controllo del vault|Controllo del vault]].

### Pubblicazione locale

- Build Quartz completa riuscita: 911 documenti, 2.003 HTML, 168 redirect e **134.695 riferimenti** verificati, zero errori. Restano i noti avvisi su eval del plugin note-properties e metadati Git della copia temporanea; nessuna modifica al generatore.
- Ispezionate entrambe le note su desktop (1440 px) e mobile (390 px): richiesta cancellabile e tabella/API WeakMap. Nessun overflow della pagina, errore JavaScript o risposta HTTP fallita; tutte le colonne delle tabelle sono raggiungibili anche tramite scorrimento.
- Anteprima mantenuta su `http://localhost:8082/appunti/`. Nessun nuovo server, commit, push o deploy remoto.

### Da proseguire

La revisione e proseguita con Optimization e Buffer e Typed Arrays, documentate di seguito.

## 2026-10-07 - Optimization e Buffer/Typed Arrays

### Perimetro e correzioni

Lette integralmente e corrette le ultime due note di **Runtime, Memoria e Performance**. Totale di questa passata: **61 note JavaScript**, 26 del Percorso Base, 23 del Percorso Intermedio, undici del Percorso Avanzato e Real-time con WebSocket. Conservati date, pubblicabilita e status `non revisionato`; nessuna nuova pagina o modifica agli indici.

| Nota                                                                              | Intervento principale                                                                                                                                                                                                                                                                                                |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/JavaScript/Pagine/Optimization\|Optimization]]                   | Separati misurazione e ipotesi, CPU/attese e dettagli V8/garanzie del linguaggio. Completati debounce cancellabile, throttle leading-only e filtro con cleanup. Corretti letture DOM, NodeList, border-box e limiti del layout; esplicitati eventi scartati, callback sincrone e assenza di benchmark.               |
| [[Programmazione/JavaScript/Pagine/Buffer e Typed Arrays\|Buffer e Typed Arrays]] | Distinti copie, conversioni, alias, transfer e memoria condivisa. Aggiunti resizable ArrayBuffer, viste tracking/fisse, UTF-8 strict/streaming, DataView con offset e protocollo didattico validato. Corretti Buffer.slice, pool Node, isolamento browser e confusione tra limite del parser e memoria di ricezione. |

### Verifica degli esempi

- **42 nuovi test Node e 11 Chrome**, tutti superati. Suite completa seriale: **674 test**, 527 Node.js `24.14.0` e 147 Chrome `154.0.8037.98`.
- Snippet estratti dai Markdown. Provati this/argomenti, cancel/riuso, rientranza, errori, delay invalidi, prima chiamata a zero e finestra del throttle. Timer/orologio simulati per i contratti precisi; timer reali nel filtro browser.
- Browser: markup, avvio e cleanup, query, 20 cicli mount/unmount, callback tardive e listener esterni preservati. Dimensioni DOM verificate con NodeList, padding e bordi; test simulato separato per ordine letture/scritture.
- API binarie native: copie/alias, conversioni, endianness, offset, resize/shrink, transfer e Blob. Parser provato con testo vuoto, BOM, NUL, code point supplementari, limite in byte, Buffer Node/sottoviste e input malformati. Rifiutati header incompleti, dimensioni incoerenti, UTF-8 invalido e buffer condivisi/ridimensionabili/distaccati.
- Fetch nativo nel browser con HTTP intercettato, successo/errori/abort; Node usa risposte simulate. SharedArrayBuffer/Atomics verificati in una fixture HTTPS con COOP/COEP e isolamento attivo, in un solo contesto. Snippet Buffer Node eseguito come ESM con il proprio import.
- Verificata la sintassi di tutti i **26 blocchi JS**, 11 Optimization e 15 Buffer e Typed Arrays. Il primo giro mirato ha evidenziato selettori di snippet ambigui e una newline mancante nel wrapper del test: corretti nel runner. La prima suite completa nel sandbox non poteva raggiungere le fixture loopback; riesecuzione autorizzata fuori sandbox passata integralmente, senza build concorrente.
- Limiti: nessun benchmark, profiler JIT/GC o garanzia sui tempi dei timer. Niente rete/backend reale, matrice browser, sincronizzazione tra thread o limite di download. Parser limitato al formato dichiarato e a viste dello stesso realm su ArrayBuffer ordinario fisso; non e una libreria di protocolli generica.

### Verifica del vault

- `content:check -- --report`: 911 documenti raggiungibili, zero errori strutturali, **629 avvisi editoriali**. Corretto il collegamento alla pagina esistente WebAssembly interop.
- `content:test`: 9 test della trasformazione superati. Copertura e comandi in `_Meta/tests/README.md`; rapporto in [[_Meta/Controllo del vault|Controllo del vault]].

### Pubblicazione locale

- Build Quartz completa riuscita: 911 documenti, 2.003 HTML, 168 redirect e **134.702 riferimenti** verificati, zero errori. Restano gli avvisi noti su eval del plugin note-properties e metadati Git della copia temporanea; nessuna modifica al generatore.
- Ispezionate entrambe le note su desktop (1440 px) e mobile (390 px): testo, esempi, filtro e tabella del formato binario. Nessun overflow della pagina, errore JavaScript o risposta HTTP fallita; ultima colonna delle tabelle raggiungibile anche tramite scorrimento.
- L'anteprima precedente non era piu attiva: riavviata sulla porta libera 8082 in background senza finestra, `http://localhost:8082/appunti/`. Nessun commit, push o deploy remoto.

### Da proseguire

Runtime, Memoria e Performance e coperto in questa passata. La revisione e proseguita con Proxy e Reflect e Circular Dependencies, documentate di seguito.

## 2026-10-07 - Proxy/Reflect e Circular Dependencies

### Perimetro e correzioni

Lette integralmente e ampliate due note di **Metaprogrammazione e Moduli Avanzati**. Totale di questa passata: **63 note JavaScript**, 26 del Percorso Base, 23 del Percorso Intermedio, tredici del Percorso Avanzato e Real-time con WebSocket. Date originali, pubblicabilita e status `non revisionato` conservati; nessuna nuova nota o modifica agli indici.

| Nota                                                                              | Intervento principale                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/JavaScript/Pagine/Proxy e Reflect\|Proxy e Reflect]]             | Corretti receiver, inoltro Reflect e risultato di set; distinto defineProperty dall'assegnazione. Aggiunti identita/alias, Symbol, invarianti, apply/newTarget, limiti con campi privati/internal slots e revoca. Riscritta la validazione di age con schema esplicito e controllo anche dei descrittori, senza presentarla come barriera di sicurezza.                                         |
| [[Programmazione/JavaScript/Pagine/Circular Dependencies\|Circular Dependencies]] | Distinti linking e inizializzazione, funzione hoisted e dati in TDZ. Resi deterministici gli esempi con file/entry point/risultati: ESM riuscito e fallito, classi sensibili all'avvio, CommonJS parziale e module.exports sostituito. Aggiunti composizione senza ciclo, import lazy e controesempio di attesa reciproca con top-level await; precisati barrel, lint e limiti della toolchain. |

### Verifica degli esempi

- **42 nuovi test Node e 14 Chrome**, tutti superati. Suite completa seriale: **730 test**, 569 Node.js `24.14.0` e 161 Chrome `154.0.8037.98`, senza build concorrente.
- Esempi estratti dai Markdown. Proxy: output, identita, alias, receiver, Symbol, strict/non strict, Reflect falso o con eccezioni, percorso set/defineProperty, newTarget e invarianti. Validazione provata su creazione, assegnazione e descrittori, valori invalidi, schema fisso, accessor rifiutati e freeze. Verificati gli errori dei wrapper su campi privati/Map e i limiti della revoca.
- Il helper `cycle-examples.mjs` ricostruisce i gruppi di file della nota. Fixture temporanee con verifica del percorso prima del cleanup, processi Node separati e timeout; nessuna scrittura nelle applicazioni dell'utente. ESM e CommonJS eseguiti con i loader nativi.
- Provati TDZ da entrambi gli ingressi, aggiornamento dei binding, import non riassegnabile, funzioni chiamate troppo presto, var/NaN, due avvii del ciclo fra classi, injection e propagazione degli errori. Confermata la differenza fra mutare l'oggetto exports e sostituire module.exports.
- Chrome usa contesti puliti e moduli serviti da richieste intercettate: avvio tramite il markup module della nota, errori gestiti, composizione e import lazy. Verificata l'assenza di richiesta della feature prima della chiamata e il rifiuto quando manca.
- Il caso con top-level await termina con codice 13 in Node senza ulteriori risorse; nel browser rimane pendente nella finestra osservata dopo aver caricato i moduli, poi il contesto viene chiuso. Questa osservazione temporale non sostituisce l'analisi delle dipendenze di attesa.
- Sintassi verificata per tutti i **30 blocchi JS**, 10 Proxy e Reflect e 20 Circular Dependencies, oltre all'esecuzione dei casi selezionati. Formattazione dei tre file di supporto verificata con Prettier.
- Limiti: nessun benchmark, motore reattivo, isolamento di codice ostile o copertura completa di tutte le invarianti/oggetti host. Niente bundler, HMR, lint, resolver di progetto o interop misto ESM/CommonJS. Il record age e il servizio dei permessi hanno contratti didattici limitati, non costituiscono una validazione o autorizzazione generale.

### Verifica del vault

- `content:check -- --report`: 911 documenti raggiungibili, zero errori strutturali, **627 avvisi editoriali**.
- `content:test`: 9 test della trasformazione superati. Copertura, prerequisiti e limiti aggiornati in `_Meta/tests/README.md`; rapporto in [[_Meta/Controllo del vault|Controllo del vault]].

### Pubblicazione locale

- Build Quartz completa riuscita: 911 documenti, 2.003 HTML, 168 redirect e **134.720 riferimenti** verificati, zero errori. Restano i noti avvisi su eval del plugin note-properties e metadati Git della copia temporanea; nessuna modifica al generatore.
- Ispezionate entrambe le note su desktop (1440 px) e mobile (390 px): introduzioni, esempi, validazione e ciclo fra classi. Nessun overflow della pagina, errore JavaScript o risposta HTTP fallita; ultima colonna delle tabelle raggiungibile anche tramite scorrimento.
- Anteprima gia attiva su `http://localhost:8082/appunti/`, mantenuta senza avviare altri server. Nessun commit, push o deploy remoto.

### Da proseguire

La revisione e proseguita con Decorators, documentata di seguito.

## 2026-10-07 - Decorators

### Perimetro e correzioni

Letta integralmente e riscritta [[Programmazione/JavaScript/Pagine/Decorators|Decorators]], ultima nota di **Metaprogrammazione e Moduli Avanzati**. Totale di questa passata: **64 note JavaScript**, 26 del Percorso Base, 23 del Percorso Intermedio, quattordici del Percorso Avanzato e Real-time con WebSocket. Preservati data originale, pubblicabilita e status `non revisionato`; nessuna nuova nota o modifica degli indici.

- Distinti decorator moderni, legacy TypeScript e metadati. Il registro ufficiale TC39 al controllo del 7 ottobre colloca Decorators in Stage 2.7; lo stato non e dedotto da vecchie release note TypeScript.
- Esplicitati toolchain di riferimento, configurazione moderna e comandi separati per una demo esterna al sito. Nessuna modifica a dipendenze, lockfile o configurazione di Quartz.
- Completati contratti di value/context, ordine di valutazione/applicazione/chiamata, this, Symbol, static/private, ritorni ed errori.
- Separati timing sincrono e attesa della Promise, con identita del risultato e canali di errore espliciti. Distinti validazione iniziale del campo e controllo delle assegnazioni tramite auto-accessor, inclusi enumerabilita e receiver.
- Aggiunti binding per istanza, fasi di addInitializer, registrazione tardiva, bootstrap e ereditarieta metadata; documentati limiti di composizione, classi derivate e librerie legacy.

### Verifica degli esempi

- **26 nuovi test Node e 24 Chrome**, tutti superati. Suite completa seriale: **780 test**, 595 Node.js `24.14.0` e 185 Chrome `154.0.8037.98`, senza build concorrente.
- Sette blocchi JS estratti dal Markdown e trasformati con **esbuild 0.27.3**, target ES2022. I 24 casi condivisi girano in realm isolati Node e browser; non sono semplici chiamate dei decorator con context fittizi.
- Provati receiver, Symbol, static/private, argomenti, throw, identita Promise, logger fallito, elemento errato e sostituzione di tipo invalido. Verificato ordine factory/applicazione/wrapper.
- Timing con orologio simulato e Promise reali: durata sincrona, attesa pendente, rifiuto, throw convertito in rifiuto e diagnostica che non sostituisce l'esito. Verificati campi, input invalidi, assegnazioni e stato precedente, getter ereditati/non enumerabili, slot privato e receiver incompatibile.
- Provati binding, callback stabile e distinta per istanza, composizione, fase metodo/campo/classe, registrazione tardiva e metadata con ereditarieta. Il bootstrap Symbol e confinato ai contesti temporanei.
- Il comando CLI della nota compila una fixture temporanea, poi Node esegue il modulo ESM prodotto. Percorso verificato prima del cleanup. La prova iniziale nel sandbox falliva su realpath della directory temporanea con EPERM; la suite autorizzata fuori sandbox e passata integralmente.
- Limiti: nessuna prova di supporto nativo della sintassi decorator, nessuna certificazione di tutte le revisioni della proposta. Non eseguiti Babel, tsc, decorator legacy, reflect-metadata o framework DI. Nessun benchmark; l'orologio dei test e simulato.

### Verifica del vault

- `content:check -- --report`: 911 documenti raggiungibili, zero errori strutturali, **627 avvisi editoriali**.
- `content:test`: 9 test della trasformazione superati. Copertura e limiti in `_Meta/tests/README.md`; rapporto in [[_Meta/Controllo del vault|Controllo del vault]].

### Pubblicazione locale

- Build Quartz completa riuscita: 911 documenti, 2.003 HTML, 168 redirect e **134.743 riferimenti** verificati, zero errori. Restano i noti avvisi su eval del plugin note-properties e metadati Git della copia temporanea; nessuna modifica al generatore.
- Ispezionata Decorators su desktop (1440 x 1000) e mobile (390 x 844): titolo, introduzione, comandi e tabella dei contratti. Nessun overflow della pagina, errore JavaScript o risposta HTTP fallita; ultima colonna raggiungibile in tutte e tre le tabelle anche tramite scorrimento.
- Anteprima gia attiva su `http://localhost:8082/appunti/`, mantenuta senza avviare altri server. Nessun commit, push o deploy remoto.

### Da proseguire

**Metaprogrammazione e Moduli Avanzati** e coperto in questa passata; Symbols e Iteration protocols rimandano a note gia controllate. La revisione e proseguita con Sicurezza e CORS, documentate di seguito.

## 2026-10-07 - Sicurezza e CORS

### Perimetro e correzioni

Lette integralmente e riscritte due note del capitolo **Sicurezza**. Totale di questa passata: **66 note JavaScript**, 26 del Percorso Base, 23 del Percorso Intermedio, sedici del Percorso Avanzato e Real-time con WebSocket. Preservati date originali, pubblicabilita e status `non revisionato`; nessuna nuova nota o modifica agli indici.

| Nota                                                      | Intervento principale                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/JavaScript/Pagine/Sicurezza\|Sicurezza]] | Distinti XSS, CSRF, autenticazione, autorizzazione e validazione. Esplicitati limiti di HttpOnly/SameSite e storage, contesti DOM/URL, dipendenze, CSP e log. Aggiunti rendering testuale con schema, link con protocollo/origine verificati e invio same-origin con contratto CSRF/204, abort e redirect rifiutati.                        |
| [[Programmazione/JavaScript/Pagine/CORS\|CORS]]           | Corretti origin/site, invio rispetto a lettura, preflight, credentials e cookie, Authorization, wildcard, header esposti e Vary. Sostituiti frammenti incompleti con API Node, moduli client e markup eseguibili in una demo locale. Distinti proxy locale/deploy, errori HTTP/rete e divergenza Chrome/Fetch sulla wildcard Authorization. |

### Verifica degli esempi

- **24 nuovi test Node e 21 Chrome**, tutti superati. Suite completa seriale finale: **825 test**, 619 Node.js `24.14.0` e 206 Chrome `154.0.8037.98`, senza build concorrente.
- I sette blocchi JS sono estratti dai Markdown; verificata la sintassi anche dei moduli di avvio. Il server della demo viene importato come ESM, non riscritto nella fixture. Markup e modulo client sono serviti realmente da HTTP, cambiando soltanto la porta locale per evitare conflitti.
- Node verifica input, token fittizio, corpo/header, URL fisso e policy same-origin, successo 204 e rifiuti HTTP/rete/abort senza retry. Controllati schema della risposta CORS, allowlist, origini non esatte/null, assenza di Origin, Vary/no-store, preflight validi/invalidi e risposte 404/405.
- Chrome usa contesti isolati e server loopback temporanei, senza intercettazioni Playwright dei risultati CORS. Provati rendering come testo, limiti del nome, URL con protocollo/origine controllati, payload blob con origine HTTPS, cookie HttpOnly e invio del token CSRF senza esposizione nel DOM.
- Provati GET diretto e OPTIONS prima di PUT, errore gestito nella pagina demo, POST semplice ricevuto senza risposta leggibile, preflight 204 privo di autorizzazioni, richiesta reale bloccata o risposta finale non leggibile. Cookie omessi/default/include, assenza del cookie in OPTIONS, wildcard con include anche senza cookie, Authorization esplicito con omit, header esposti, Set-Cookie filtrato, 404 leggibile, risposta opaca e mode same-origin.
- Il primo test assumeva che Chrome rifiutasse Authorization con Allow-Headers wildcard. La prova ha rilevato la divergenza documentata dai dati MDN rispetto a Fetch: Chrome 154 la accetta con omit. La nota distingue ora requisito e comportamento osservato; una sonda separata registra l'esito senza spacciarlo per conformita. L'allowlist esplicita e verificata distintamente.
- Nel controllo finale rafforzato il filtro URL con protocollo HTTPS esplicito, per escludere blob che riportano la stessa origine. Aggiunto il caso negativo e rieseguita integralmente la suite finale.
- Limiti: non e un audit XSS/CSRF completo. Nessun sanitizer, backend autenticato, generazione/verifica crittografica di token, TLS, sessione reale, cookie cross-site/di terze parti, cache CDN o matrice browser. I cookie di test sono HTTP locali same-site su porte diverse; non collaudano il cookie HTTPS di produzione della nota. Il server Python e un comando della procedura, non il server eseguito dai test. Nessuna modifica a dipendenze o configurazione del sito.

### Verifica del vault

- `content:check -- --report`: 911 documenti raggiungibili, zero errori strutturali, **626 avvisi editoriali**.
- `content:test`: 9 test della trasformazione superati. Copertura, prerequisiti e limiti aggiornati in `_Meta/tests/README.md`; rapporto in [[_Meta/Controllo del vault|Controllo del vault]].

### Pubblicazione locale

- Build Quartz completa riuscita: 911 documenti, 2.003 HTML, 168 redirect e **134.753 riferimenti** verificati, zero errori. Restano i noti avvisi su eval del plugin note-properties e metadati Git della copia temporanea; nessuna modifica al generatore.
- Ispezionate entrambe le note su desktop (1440 x 1000) e mobile (390 x 844): introduzioni, tabelle e codice. Nessun overflow della pagina, errore JavaScript o risposta HTTP fallita; tutte le colonne sono raggiungibili, anche tramite scorrimento dove necessario.
- Anteprima gia attiva su `http://localhost:8082/appunti/`, mantenuta senza avviare altri server persistenti. I server delle fixture CORS sono stati chiusi; nessun commit, push o deploy remoto.

### Da proseguire

La revisione e proseguita con Content Security Policy e Sanitizzazione input, documentate di seguito.

## 2026-10-08 - Content Security Policy e Sanitizzazione input

### Perimetro e correzioni

Lette integralmente e riscritte due note del capitolo **Sicurezza**. Totale di questa passata: **68 note JavaScript**, 26 del Percorso Base, 23 del Percorso Intermedio, diciotto del Percorso Avanzato e Real-time con WebSocket. Conservati date originali, publish true e status non revisionato. Nessuna nuova pagina o modifica degli indici.

| Nota                                                                                  | Intervento principale                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/JavaScript/Pagine/Content Security Policy\|Content Security Policy]] | Corretti fallback, origini, policy multiple, header e meta. Completati nonce per risposta, hash del testo esatto, strict-dynamic, report-only con endpoint dichiarato, limiti di Trusted Types, cache e build. Aggiunta demo Node con script autorizzato e controesempio bloccato.                                                                                                |
| [[Programmazione/JavaScript/Pagine/Sanitizzazione input\|Sanitizzazione input]]       | Distinti validazione, normalizzazione, encoding e sanitizzazione. Corretta la spiegazione delle template literal e dei sink HTML; aggiunti rendering testuale e query con limiti. Demo HTML completa con DOMPurify 3.4.16, istanza dedicata, otto tag consentiti, nessun attributo e DocumentFragment. Esplicitati limiti dei contesti URL, SQL, shell, Markdown e Trusted Types. |

### Verifica degli esempi

- **8 nuovi test Node e 25 Chrome**, tutti superati. Suite completa seriale: **858 test**, 627 Node.js 24.14.0 e 231 Chrome 154.0.8037.98, senza build concorrente.
- Codice estratto dai Markdown; controllo sintattico dei quattro blocchi JS. Verificati nonce da 16 byte, unicita nel campione, corrispondenza header/markup, hash deterministico, input invalidi e query con caratteri riservati. L'unicita del campione non e una prova crittografica della casualita.
- Chrome usa server HTTP temporanei su loopback e contesti puliti, senza intercettare le decisioni CSP. Provati nonce e hash validi/invalidi, report-only non bloccante, attributi evento/eval, connect-src e fallback, intersezione delle policy, loader dinamici e self ignorato con strict-dynamic.
- DOMPurify 3.4.16 installato con ignore-scripts soltanto in una directory temporanea esterna. La fixture verifica la versione e serve il modulo ESM reale. Provati demo HTML intera, rendering testuale, markup consentito/escluso/malformato, attributi, entita, limiti di input e destinazione, contenuto conservato su errore e sostituzione/vuoto.
- Limiti: nessun audit completo dei bypass XSS, collector di report, enforcement Trusted Types, matrice browser, DOM server-side, TLS o CDN/cache. Il launcher server.mjs e controllato sintatticamente; la fixture serve la funzione reale che produce header e HTML. Il comando Python non viene eseguito. Nessun cambiamento alle dipendenze o alla CSP di Quartz.

### Verifica del vault

- content:check con report: 911 documenti raggiungibili, zero errori strutturali, **625 avvisi editoriali**.
- content:test: 9 test della trasformazione superati. Copertura e prerequisiti documentati in \_Meta/tests/README.md; rapporto in [[_Meta/Controllo del vault|Controllo del vault]].

### Pubblicazione locale

- Build Quartz riuscita: 911 documenti, 2.003 HTML, 168 redirect e **134.797 riferimenti** verificati, zero errori. Restano i noti avvisi eval del plugin note-properties e metadati Git della copia temporanea.
- Ispezionate entrambe le note su desktop 1440 x 1000 e mobile 390 x 844: introduzioni, tabelle e codice. Nessun overflow della pagina, errore JavaScript o risposta HTTP fallita; ultime colonne raggiungibili tramite scorrimento dove necessario.
- Anteprima esistente mantenuta su http://localhost:8082/appunti/. I server delle fixture sono stati chiusi. Nessun commit, push, deploy remoto o modifica manuale agli HTML generati.

### Da proseguire

La revisione e proseguita con Supply chain security npm, documentata di seguito.

## 2026-10-08 - Supply chain security npm

### Perimetro e correzioni

Letta integralmente e riscritta [[Programmazione/JavaScript/Pagine/Supply chain security npm|Supply chain security npm]], mantenendo tipo operativo, data originale, pubblicabilita e status non revisionato. Totale di questa passata: **69 note JavaScript**, 26 del Percorso Base, 23 del Percorso Intermedio, diciannove del Percorso Avanzato e Real-time con WebSocket. Nessuna modifica agli indici.

- Distinti vulnerabilita note, codice malevolo, integrita, firme e provenance; rimossa l'implicazione che lockfile/ci/audit certifichino la sicurezza.
- Separati tutti i comandi in blocchi copiabili. Esplicitati directory/prerequisiti, ricreazione di node_modules da ci, disallineamento del lockfile, limiti di ignore-scripts e script eseguiti esplicitamente.
- Completati registry/scopes, revisione delle origini e delle transitive, audit-level, metadati inviati al registry, rischi di audit fix --force, devDependencies, packaging, segreti e CI.
- Aggiunte fonti ufficiali npm/GitHub, demo locale e collegamenti a Dependabot, OIDC e permessi Actions. Baseline Node 24.14.0/npm 11.19.0; differenze di npm 12 documentate separatamente, senza aggiornarlo sulla macchina.

### Verifica degli esempi

- **12 nuovi test Node**, tutti superati. Suite completa seriale: **870 test**, 639 Node.js 24.14.0 e 231 Chrome 154.0.8037.98, senza build concorrente.
- Test con CLI npm 11.19.0 reale, package.json e comandi principali estratti dal Markdown. Verificati lockfile-only, ci senza lock/incoerente, manifest e lock invariati, ricreazione di node_modules e script della root/dipendenza consentiti o saltati.
- Provati run build esplicito con ignore-scripts, ordine dei pre/post hook senza flag, ls/explain, omit=dev e pack dry-run con allowlist files, nessuna tarball e nessun hook.
- Fixture temporanee e tarball locali innocue; config e cache isolate, offline attivo, nessun token o NODE_OPTIONS ereditato. Cleanup ricorsivo solo dopo verifica dei percorsi risolti entro la directory temporanea creata.
- Limiti: nessuna chiamata audit/view/outdated/firme a registry reali, nessuna pubblicazione o verifica OIDC/CI remota, npm 12 o dipendenza nativa/Git. Queste parti sono confrontate con documentazione ufficiale, non certificate dai test. Nessuna modifica alle dipendenze del vault o di Quartz.

### Verifica del vault

- content:check con report: 911 documenti raggiungibili, zero errori strutturali, **624 avvisi editoriali**.
- content:test: 9 test della trasformazione superati. Prerequisiti e limiti in \_Meta/tests/README.md; rapporto in [[_Meta/Controllo del vault|Controllo del vault]].

### Pubblicazione locale

- La prima build e stata interrotta durante l'emissione degli HTML. Dopo avere verificato l'assenza di processi residui, rilanciata e completata: 911 documenti, 2.003 HTML, 168 redirect e **134.839 riferimenti** verificati, zero errori.
- Restano i noti avvisi eval del plugin note-properties e metadati Git della copia temporanea. Nessuna modifica al generatore o agli HTML manualmente.
- Ispezionata la nota su desktop 1440 x 1000 e mobile 390 x 844: testo, comandi, demo JSON e due tabelle. Nessun overflow della pagina, errore JavaScript o risposta HTTP fallita; ultime colonne raggiungibili tramite scorrimento.
- L'interruzione aveva fermato anche l'anteprima: riattivata in background sulla porta libera 8082, senza sostituire altri processi. URL: http://localhost:8082/appunti/. Nessun commit, push o deploy remoto.

### Da proseguire

Il capitolo **Sicurezza** e completato in questa passata. La revisione e proseguita con Node.js Basics, documentata di seguito. Le note restano non revisionate fino all'approvazione dell'utente.

Gli altri capitoli JavaScript e le altre aree non sono stati sottoposti a questa passata completa. Restano validi gli interventi puntuali precedenti documentati nello storico, ma non equivalgono a una revisione integrale. Non considerare una pagina controllata soltanto perche ha fonti, YAML valido o molti esempi.

## 2026-10-08 - Node.js Runtime: Basics

### Perimetro e correzioni

Letta integralmente e completata [[Programmazione/JavaScript/Pagine/Node.js Basics|Node.js Basics]], mantenendo tipo tecnico, data originale, pubblicabilita e status non revisionato. Totale di questa passata: **70 note JavaScript**, 26 del Percorso Base, 23 del Percorso Intermedio, 19 del Percorso Avanzato, Real-time con WebSocket e Node.js Basics. Nessuna nuova pagina o modifica agli indici.

- Distinti linguaggio, runtime, API web disponibili e assenza del DOM. Chiariti I/O, event loop e CPU, senza equiparare async a parallelismo.
- Esplicitati ESM/CommonJS, estensioni mjs/cjs, type per js, import relativi con estensione e directory del modulo distinta dalla working directory.
- Separati Node e package manager, comandi indipendenti e loro prerequisiti/effetti. Documentati argomenti CLI, valori testuali dell'ambiente, caricamento esplicito di .env e precedenza delle variabili gia impostate.
- Aggiunto progetto completo senza dipendenze: configurazione validata, lettura di un piccolo file fidato, manifest, test runner, stdout/stderr e codice di uscita. Dichiarati lettura integrale in memoria e limite UTF-16 della preview; nessuna implicita sicurezza per percorsi da utenti remoti.
- Chiariti limiti del catch principale, exitCode rispetto a exit e necessita di cleanup per servizi persistenti. Fonti ufficiali Node/npm, con baseline Node 24.14.0 distinta dall'ultima patch disponibile.

### Verifica degli esempi

- **38 nuovi test Node**, tutti superati. Suite completa eseguita serialmente: **908 test**, 677 Node.js 24.14.0 e 231 Chrome 154.0.8037.98, senza build concorrente.
- Codice e file dimostrativi estratti dal Markdown tramite AST. Provati default/limiti/input invalidi, .env esplicito/assente e precedenza dell'ambiente, file mancanti/vuoti, spazi nei percorsi, working directory, formati dei moduli, API globali ed event loop.
- Eseguiti start, inoltro argomenti e test del progetto con CLI npm 11.19.0 reale. Fixture temporanee con ambiente/config npm isolati, senza rete o installazioni. Cleanup dopo verifica dei percorsi risolti.
- Limiti: non collaudati watch/restart, pnpm/Yarn, shutdown di server, matrice di OS/versioni, permessi filesystem, input remoti o limiti di memoria. I 38 test non includono come test separato il test figlio lanciato dalla CLI dimostrativa.

### Verifica del vault

- content:check con report: 911 documenti raggiungibili, zero errori strutturali, **623 avvisi editoriali**.
- content:test: 9 test della trasformazione superati. README dei test aggiornato; rapporto in [[_Meta/Controllo del vault|Controllo del vault]].

### Pubblicazione locale

- Build Quartz completata: 911 documenti, 3.719 file emessi, 2.003 HTML, 168 redirect e **134.874 riferimenti** verificati, zero errori. Restano i noti avvisi eval di note-properties e metadati Git della copia temporanea.
- Ispezionata Node.js Basics con Chrome su desktop 1440 x 1000 e mobile 390 x 844: introduzione, codice e quattro tabelle. Nessun overflow del documento, errore JavaScript o risposta HTTP fallita; ultime colonne raggiungibili tramite scorrimento dove necessario.
- L'interruzione ha lasciato salvati nota e test, ma ha fermato l'anteprima. Verificata l'assenza di processi di test/build residui; rieseguiti test e controlli, poi riavviata l'anteprima in background sulla porta libera 8082. URL: http://localhost:8082/appunti/. Nessun commit, push o deploy remoto.

### Da proseguire

La revisione e proseguita con File System fs e Path e Process, documentate di seguito. Il resto del capitolo non e coperto da questa revisione di Node.js Basics; le note restano non revisionate fino all'approvazione dell'utente.

## 2026-10-08 - Node.js Runtime: File System, Path e Process

### Perimetro e correzioni

Lette integralmente e completate [[Programmazione/JavaScript/Pagine/File System fs|File System fs]] e [[Programmazione/JavaScript/Pagine/Path e Process|Path e Process]]. Conservati data originale, tipo tecnico, pubblicabilita e status non revisionato. Totale di questa passata: **72 note JavaScript**, 26 Base, 23 Intermedio, 19 Avanzato, Real-time con WebSocket e tre note Node.js Runtime. Nessuna nuova nota o modifica agli indici.

- Distinte famiglie Promise/callback/Sync, byte e testo, parsing JSON e schema. Aggiunta gestione selettiva di ENOENT e abort, senza nascondere errori differenti dietro un default.
- Esplicitati effetti di write/append/mkdir/rm, scritture esclusive, metadati, link e race condition. Aggiunta lettura limitata con FileHandle e chiusura in finally; sostituito lo stream con solo listener data con una pipeline che propaga errori.
- Riscritto l'esempio JSON per validare e creare un nuovo output con updatedAt, conservando il sorgente e rifiutando target esistenti. Dichiarati rischi di output parziale, concorrenza, crash e limiti del pattern temporaneo + rename.
- Chiariti join/resolve/normalize, semantica POSIX/Windows, cwd modificabile e directory del modulo. Completata la conversione file URL, senza usare pathname come percorso locale.
- Distinta normalizzazione da autorizzazione dei percorsi, con limiti di prefissi, realpath, symlink/junction e controlli separati dall'apertura.
- Aggiunti parser PORT/VERBOSE, CLI con parseArgs, precedenza opzioni/ambiente/default, riepilogo senza campi riservati ed errori senza dump del JSON. Chiarito che exitCode non ferma il flusso e non esegue cleanup.

### Verifica degli esempi

- **77 nuovi test Node**, tutti superati. Suite completa seriale: **985 test**, 754 Node.js 24.14.0 e 231 Chrome 154.0.8037.98, senza build concorrente; zero test saltati.
- Codice estratto dai Markdown tramite AST, processi reali e filesystem temporaneo: letture, scritture esclusive/append, file vuoti/mancanti, errori, JSON/schema, sorgente e target preservati, pipeline binaria, directory ordinate e size in byte.
- Verificati path POSIX/win32, file URL con spazi/caratteri speciali, modulo distinto dalla cwd, argv/execArgv, input invalidi, precedenza e diagnostica CLI. Una junction di directory su Windows dimostra la differenza tra contenimento lessicale e target reale; entrambi i lati sono dentro la fixture.
- Ambiente dei processi ridotto, niente registry o servizi esterni, cleanup solo dopo controllo dei percorsi risolti. Nessuna modifica alle dipendenze del vault o del sito.
- Limiti: non provati watcher, filesystem di rete, crash/durabilita, writer concorrenti ostili, permessi di ogni OS o shutdown di servizi. Abort provato prima della lettura, non come rollback; FileHandle senza guasti sintetici intermedi di read/close. Il risultato non certifica una sandbox o una cancellazione ricorsiva arbitraria.

### Verifica del vault

- content:check con report: 911 documenti raggiungibili, zero errori strutturali, **621 avvisi editoriali**.
- content:test: 9 test della trasformazione superati. Aggiornati README dei test e [[_Meta/Controllo del vault|rapporto del vault]].

### Pubblicazione locale

- Build Quartz definitiva completata: 911 documenti, 3.719 file emessi, 2.003 HTML, 168 redirect e **134.914 riferimenti** verificati, zero errori. Rimangono i noti avvisi eval di note-properties e metadati Git della copia temporanea.
- Controllate entrambe le note in Chrome su desktop 1440 x 1000 e mobile 390 x 844: titoli, testo, codice e cinque tabelle. Nessun overflow del documento, errore JavaScript o risposta HTTP fallita; ultime colonne raggiungibili dove serve scorrimento.
- Dopo il primo controllo mobile, accorciate le etichette nella tabella API di Path e Process per lasciare piu spazio alle spiegazioni. Ripetuti controllo contenuti, build e verifica desktop/mobile della tabella definitiva. Gli esempi eseguibili non sono cambiati dopo i 985 test.
- Anteprima esistente mantenuta su http://localhost:8082/appunti/. Fixture e contesti browser chiusi; nessun commit, push, deploy remoto o modifica manuale agli HTML generati.

### Da proseguire

La revisione e proseguita con Events Node.js e Streams Node.js, documentate di seguito. Le note restano non revisionate fino al controllo dell'utente; gli esiti non si estendono automaticamente alle altre note del capitolo o del vault.

## 2026-10-12 - Node.js Runtime: Events e Streams

### Perimetro e correzioni

Lette integralmente e completate [[Programmazione/JavaScript/Pagine/Events Node.js|Events Node.js]] e [[Programmazione/JavaScript/Pagine/Streams Node.js|Streams Node.js]]. Conservati data originale, tipo tecnico, pubblicabilita e status non revisionato. Totale di questa passata: **74 note JavaScript**, 26 Base, 23 Intermedio, 19 Avanzato, Real-time con WebSocket e cinque note Node.js Runtime. Nessuna nuova pagina di contenuto o modifica agli indici.

- Distinti dispatch sincrono, receiver, ritorno di emit, eccezioni ordinarie, evento error e rejection async. Chiariti captureRejections, listener di errore sincroni e limiti di errorMonitor.
- Aggiunti cleanup con registrazione posseduta, attese preventive con events.once, abort e distinzione fra cancellazione dell'ascolto e arresto del produttore. Chiariti once/off, duplicati, rimozione durante emit, iteratori e code non automaticamente limitate.
- Sostituito il job con un'implementazione completa: worker esplicito, risultato via Promise, notifiche separate, esecuzione sequenziale, sovrapposizione rifiutata e stato ripristinato in finally. Dichiarati gli effetti degli errori degli osservatori, senza fingere rollback del lavoro.
- Chiariti tipi di stream, chunk/framing/UTF-8, object mode, highWaterMark, write false e drain, end/finish/close/error. Separati pipeline, consumo sequenziale e listener data asincroni.
- Aggiunti moduli e CLI per consumo del testo, scrittura da iterable, gzip e JSON Lines, con output esclusivi wx e gestione degli errori. Documentati output parziali, pre-abort, produttori cooperativi, ownership, break del Readable e limiti HTTP/Web Streams.
- Fonti ufficiali Node, baseline esplicita 24.14.0 senza affermare che sia l'ultima patch. Comandi separati, prerequisiti ed effetti sui file indicati.

### Verifica degli esempi

- **58 nuovi test Node**, tutti superati. Suite completa seriale: **1043 test**, 812 Node.js 24.14.0 e 231 Chrome 154.0.8037.98; zero test saltati e nessuna build concorrente. Nuovo file formattato e 58 test rieseguiti con esito positivo.
- Codice estratto dal Markdown tramite AST: demo CLI reali, listener/cleanup, errori/rejection, attese/cancellazione, job e input invalidi, progress e risultato distinti.
- Provati UTF-8 a cavallo dei chunk, consumer sequenziale, file vuoti/mancanti, scritture esclusive, iterable asincrono, gzip binario con roundtrip e sorgente preservato, errori di destinazione e serializzazione JSON Lines.
- Stream controllati verificano write false/drain, interruzione del Readable, propagazione del fallimento della destinazione e abort durante una pipeline. I pre-abort degli helper non aprono l'output.
- Fixture temporanee e ambiente dei processi ridotto, cleanup dopo controllo del percorso risolto. Nessuna rete o installazione nei 58 nuovi test, nessuna modifica alle dipendenze del sito.
- Limiti: niente benchmark di memoria o carico, durabilita/rollback, matrice di OS/versioni, servizi HTTP reali o generatori non cooperativi. Abort durante il trasferimento provato in memoria, non tramite timing di file reali. Nessuna garanzia sui tempi del GC o su byte gzip identici fra versioni.

### Verifica del vault

- content:check con report: 911 documenti raggiungibili, zero errori strutturali, **619 avvisi editoriali**.
- content:test: 9 test della trasformazione superati. Aggiornati README dei 36 file di test, storico recente (10 voci) e [[_Meta/Controllo del vault|rapporto del vault]].

### Pubblicazione locale

- Build Quartz completata: 911 documenti, 3.719 file emessi, 2.003 HTML, 168 redirect e **134.922 riferimenti** verificati, zero errori. Restano gli avvisi gia noti su eval di note-properties e metadati Git della copia temporanea.
- Ispezionate entrambe le note in Chrome su desktop 1440 x 1000 e mobile 390 x 844: introduzioni, codice e tre tabelle. Screenshot controllati; nessun overflow del documento, errore JavaScript o risposta HTTP fallita. Ultime colonne raggiungibili con scorrimento su mobile.
- La precedente anteprima non era attiva; verificata la porta libera e riavviata in background su http://localhost:8082/appunti/. Contesti browser e fixture chiusi; nessun commit, push, deploy remoto o modifica manuale degli HTML generati.

### Da proseguire

La revisione e proseguita con Buffer Node.js e HTTP server, documentate di seguito. Le note restano non revisionate fino al controllo dell'utente; i risultati non certificano automaticamente le altre pagine del capitolo o del vault.

## 2026-10-12 - Node.js Runtime: Buffer e HTTP server

### Perimetro e correzioni

Lette integralmente e completate [[Programmazione/JavaScript/Pagine/Buffer Node.js|Buffer Node.js]] e [[Programmazione/JavaScript/Pagine/HTTP server|HTTP server]]. Conservati data originale, tipo tecnico, pubblicabilita e status non revisionato. Aggiunti prerequisiti e note correlate al frontmatter HTTP. Totale di questa passata: **76 note JavaScript**, 26 Base, 23 Intermedio, 19 Avanzato, Real-time con WebSocket e sette note Node.js Runtime. Nessuna nuova pagina di contenuto o modifica agli indici.

- Distinti byte, unita UTF-16 e caratteri; precisati allocazione sicura/unsafe, copie e viste, pool, offset/lunghezza, conversioni multibyte, endianness e interi BigInt.
- Chiariti hex/Base64 permissivi, UTF-8 fatal e chunk incompleti, concat con lunghezza esplicita e limiti di equals. Aggiunto decoder hex con policy e limite dichiarati.
- Sostituita la conversione integrale del file con un lettore FileHandle limitato a maxBytes + 1, chiusura in finally e CLI. Nessuna identificazione del formato basata soltanto sull'estensione; dichiarati costi Base64, file concorrenti, percorsi e rischio di esposizione nei log.
- Sostituiti i server minimi con un modulo HTTP locale e CLI: metodo/percorso/query, HEAD e byte length, 404/405/Allow, limite degli header e del body, MIME/UTF-8, parsing JSON separato dallo schema.
- Gestiti errori sincroni/async, input oltre limite anche chunked, upload interrotti, signal cooperativo del servizio e chiusura regolare/forzata. La politica Connection: close e esplicita per non lasciare implicito il destino dei body non consumati.
- Distinti ricezione, inattivita, deadline, cancellazione e rollback; documentati parser HTTP, host di ascolto, TLS, keep-alive e requisiti non implementati. Baseline Node 24.14.0 e fonti ufficiali, senza presentare il demo come servizio pronto per Internet.

### Verifica degli esempi

- **79 nuovi test Node**, tutti superati. Suite completa seriale: **1122 test**, 891 Node.js 24.14.0 e 231 Chrome 154.0.8037.98; zero test saltati e nessuna build concorrente.
- Snippet, moduli e CLI estratti dal Markdown tramite AST. Provati encoding, copie/alias, conversioni, limiti numerici, hex rigoroso, Base64, file binari e vuoti, limiti esatti/superati, configurazioni invalide e file mancanti.
- Server reali su loopback e porte assegnate dal sistema: routing, HEAD, byte length, metodi, MIME, JSON/schema, UTF-8/BOM, body limite/chunked, 413, 431, errori del servizio senza dettagli interni, disconnessioni e signal.
- Shutdown eseguito con risposta attiva sia completata sia forzatamente interrotta. Client della nota provato contro il servizio reale rimappando soltanto la porta. CLI server provata su input invalidi e porta occupata; lifecycle riuscito attraverso il modulo.
- Fixture temporanee con ambiente ridotto e cleanup dopo controllo dei percorsi risolti. Socket e server chiusi; nessuna rete esterna, installazione o modifica alle dipendenze del sito.
- Limiti: timeout di ricezione/inattivita verificati come configurazione, non attendendo le scadenze; niente segnali OS reali, TLS, proxy, request smuggling, autenticazione, benchmark o matrice multipiattaforma. Le scritture frammentate possono essere ricombinate da TCP/Node. FileHandle senza simulazioni di short read o errori intermedi/close fallito; nessuna prova di snapshot, GC o durabilita.

### Verifica del vault

- content:check con report: 911 documenti raggiungibili, zero errori strutturali, **618 avvisi editoriali**.
- content:test: 9 test della trasformazione superati. Aggiornati README dei 37 file di test, storico recente e [[_Meta/Controllo del vault|rapporto del vault]]. Lo storico conserva 10 voci operative.

### Pubblicazione locale

- Build Quartz completata: 911 documenti, 3.719 file emessi, 2.003 HTML, 168 redirect e **134.958 riferimenti** verificati, zero errori. Restano gli avvisi gia noti su eval di note-properties e metadati Git della copia temporanea.
- Controllate entrambe le note con Chrome su desktop 1440 x 1000 e mobile 390 x 844: introduzioni, codice e quattro tabelle. Screenshot ispezionati, ultime colonne raggiungibili con scorrimento; nessun overflow del documento, errore JavaScript o risposta HTTP fallita.
- Anteprima esistente mantenuta su http://localhost:8082/appunti/. Nessun commit, push, deploy remoto o modifica manuale agli HTML generati. La revisione dei contenuti non certifica automaticamente tutte le altre note del vault.

### Da proseguire

La revisione e proseguita con Child process e Worker threads, documentate di seguito. Le note restano non revisionate fino al controllo dell'utente.

## 2026-10-12 - Node.js Runtime: Child process e Worker threads

### Perimetro e correzioni

Lette integralmente e completate [[Programmazione/JavaScript/Pagine/Child process|Child process]] e [[Programmazione/JavaScript/Pagine/Worker threads|Worker threads]]. Conservati data originale, tipo tecnico, pubblicabilita e status non revisionato. Aggiunti prerequisiti e note correlate. Totale di questa passata: **78 note JavaScript**, 26 Base, 23 Intermedio, 19 Avanzato, Real-time con WebSocket e tutte le nove note Node.js Runtime. Nessuna nuova pagina di contenuto o modifica agli indici.

- Distinti spawn, execFile, exec e fork, argomenti rispetto a shell/option injection, buffering rispetto a stream, errori di avvio, exit/close e diagnostica stderr.
- Sostituito spawn di npm non portabile con programmi Node espliciti, avviati tramite execPath: statistiche UTF-16/UTF-8 e progresso temporizzato. Ambiente ridotto, limiti di input/output, schema JSON, file e comando completi.
- Chiariti cwd/PATH/ambiente, Windows cmd/bat, NUL negli argomenti, timeout/abort, segnali, killed, processi discendenti, IPC e limiti di detached/unref. Separare un processo non costituisce una sandbox.
- Distinti calcolo JS, I/O asincrono e pool nativi. Sostituito il calcolo non definito del worker con un conteggio dei primi limitato e completo.
- Corretto il wrapper one-shot: esito solo dopo exit, un unico messaggio valido, errore anche su uscita zero senza risultato, eccezione successiva alla risposta, timeout e abort con attesa della terminazione. Cleanup dei listener e del timer, schema del valore verificato dal chiamante.
- Aggiunti demo MessageChannel e trasferimento con distacco di tutte le viste. Precisati clone, Buffer ricevuto come Uint8Array, ownership, SharedArrayBuffer/Atomics, pool e coda limitata, resourceLimits e assenza di isolamento di sicurezza.
- Fonti ufficiali e baseline Node 24.14.0, senza presentarla come ultima patch. Esempi senza dipendenze, effetti e limiti espliciti.

### Verifica degli esempi

- **90 nuovi test Node**, tutti superati. Suite completa seriale: **1212 test**, 981 Node.js 24.14.0 e 231 Chrome 154.0.8037.98; zero test saltati e nessuna build concorrente.
- Codice estratto dal Markdown tramite AST: demo CLI completi, argomenti letterali/metacaratteri, Unicode, limiti, errori JSON/schema, codici e output, ambiente senza segreti/preload ereditati.
- Provati pre-abort, abort dopo conferma dell'avvio, cwd inesistente e timeout reale di un figlio controllato. Nessuna shell esegue input arbitrari; la chiusura delle fixture esterne permette di attendere anche i processi di execFile.
- Worker reali: input e risultato, limiti del calcolo, dati non clonabili, file mancante, protocollo invalido/duplicato, uscita vuota, errore dopo risultato, timeout e interruzione di un loop CPU dopo conferma dell'avvio.
- Verificati rimozione del listener di abort e del timer, transfer con viste distaccate e clone che conserva il buffer originale. Test formattato con Prettier.
- Fixture temporanee con verifica dei percorsi risolti prima della rimozione, ambiente ridotto e cleanup dei processi/thread. Nessuna rete esterna, installazione o modifica alle dipendenze del sito.
- Limiti: Windows e Node 24.14.0, non una matrice multipiattaforma. Non provati fork/IPC, discendenti, segnali POSIX ignorati, pool, OOM/limiti RAM, sandbox, fallimento interno di terminate o messageerror nativo. Nessun benchmark o deadline real-time; nessun protocollo concorrente su SharedArrayBuffer.

### Verifica del vault

- content:check con report: 911 documenti raggiungibili, zero errori strutturali, **616 avvisi editoriali**.
- content:test: 9 test della trasformazione superati. Aggiornati README dei 38 file di test, storico recente (10 voci) e [[_Meta/Controllo del vault|rapporto del vault]]; controlli tecnici distinti dalla pubblicazione e dall'approvazione dell'utente.

### Pubblicazione locale

- Build Quartz completata: 911 documenti, 3.719 file emessi, 2.003 HTML, 168 redirect e **135.002 riferimenti** verificati, zero errori. Restano gli avvisi gia noti su eval di note-properties e metadati Git della copia temporanea.
- Controllate entrambe le note con Chrome su desktop 1440 x 1000 e mobile 390 x 844: intestazioni, codice e quattro tabelle. Screenshot ispezionati, ultime colonne raggiungibili con scorrimento; nessun overflow del documento, errore JavaScript o risposta HTTP fallita.
- Riutilizzata l'anteprima su http://localhost:8082/appunti/. Browser di prova chiusi; nessun commit, push, deploy remoto o modifica manuale agli HTML generati. I risultati non certificano automaticamente tutte le altre note del vault.

### Da proseguire

Il capitolo Node.js Runtime e coperto in questa passata. La revisione e proseguita con Testing ed ESLint, documentate di seguito. Le note restano non revisionate fino al controllo dell'utente.

## 2026-10-13 - Tooling e Qualita: Testing ed ESLint

### Perimetro e correzioni

Lette integralmente e completate [[Programmazione/JavaScript/Pagine/Testing|Testing]] e [[Programmazione/JavaScript/Pagine/ESLint|ESLint]]. Conservati data originale, tipo tecnico, pubblicabilita e status non revisionato; normalizzati i link del frontmatter e aggiunti prerequisiti/correlazioni ESLint. Totale di questa passata: **80 note JavaScript**, 26 Base, 23 Intermedio, 19 Avanzato, Real-time con WebSocket, nove Node.js Runtime e due Tooling e Qualita. Nessuna nuova pagina di contenuto o modifica agli indici.

- Distinti runner, assertion e ambiente, livelli dei test e scopo di regressione; precisati contratti, comportamento osservabile, mock/stub/spy/fake, integrazioni, cleanup, determinismo e concorrenza.
- Sostituiti esempi con funzioni/globale framework impliciti con quattro file ESM completi per Node: sconto limitato in centesimi, loader con repository iniettato e 11 test eseguibili.
- Chiariti errori sincroni rispetto a Promise rifiutate, attesa delle assertion, input invalidi, assenza distinta da guasto e schema del risultato. Comandi per esecuzione, selezione, watch e coverage con limiti espliciti.
- Separati coverage, snapshot, TDD e mutation testing; esclusa l'equivalenza fra suite verde e correttezza generale. Nessuna pretesa che un mock verifichi il provider o che un DOM simulato equivalga al browser.
- Corrette le capacita attribuite a ESLint: import, Promise, TypeScript e framework non vengono tutti verificati automaticamente dal core. Distinti lint, formattazione, tipi, test e fiducia nella configurazione eseguibile.
- Aggiunti package e flat config completi per ESLint 10.12.0, @eslint/js 10.0.1 e globals 17.13.0, con scope condiviso/browser/Node/CommonJS, ignore, regole esplicite e soppressioni inutili segnalate.
- Verificati il controesempio map senza return e il suo limite, autofix/dry-run, warning/soglie, exit code e lookup v10. Corretto print-config con uno script dedicato: il precedente tentativo aggiunto a lint conteneva due percorsi e falliva realmente.
- Fonti ufficiali, baseline Node 24.14.0 e requisiti distinti del linter/runtime. Nessuna modifica alle dipendenze o alla configurazione di Quartz.

### Verifica degli esempi

- **74 nuovi test Node**, tutti superati dopo la correzione del comando print-config. Suite completa seriale: **1286 test**, 1055 Node.js 24.14.0 e 231 Chrome 155.0.8059.40; zero test saltati e nessuna build concorrente.
- Snippet e configurazione estratti dal Markdown tramite AST. Provati input validi/invalidi, arrotondamento dichiarato, limiti, output pubblico, record incoerenti, errori sincroni/asincroni del repository e mancata chiamata su input errato.
- La suite didattica di 11 test e stata eseguita come processo reale, insieme a filtro per nome e coverage. Due modifiche intenzionali nelle sole fixture fanno fallire i test previsti; non sono una campagna completa di mutation testing.
- ESLint API/CLI e script npm reali verificano regole, globali, CommonJS/ESM, parsing, ignore globali, gitignore non importato, disable inutili, output warning, exit code 0/1/2, fix/dry-run, print-config, debug e configurazione annidata di v10.
- Tool installati in una cartella temporanea esterna con versioni esatte e script npm disabilitati. Le fixture usano un link/junction alle dipendenze e rimuovono soltanto la propria directory dopo verifica dei percorsi risolti. Suite senza rete esterna; l'installazione iniziale ha contattato npm.
- Limiti: Windows e Node 24.14.0, non una matrice multipiattaforma. Non provati Jest/Vitest, watch persistente, plugin TypeScript/framework/import, editor o CI remota. I piccoli moduli browser/server della nota ESLint sono analizzati dal linter, non collaudati come applicazione. Coverage e demo monetario non certificano tutti i requisiti o regole contabili.

### Verifica del vault

- content:check con report: 911 documenti raggiungibili, zero errori strutturali, **614 avvisi editoriali**.
- content:test: 9 test della trasformazione superati. Aggiornati README dei 39 file di test, storico recente e [[_Meta/Controllo del vault|rapporto del vault]]. Lo storico conserva 10 voci operative.

### Pubblicazione locale

- Build Quartz completata: 911 documenti, 3.719 file emessi, 2.003 HTML, 168 redirect e **135.054 riferimenti** verificati, zero errori. Restano gli avvisi gia noti su eval di note-properties e metadati Git della copia temporanea.
- Controllate entrambe le note con Chrome 155.0.8059.40 su desktop 1440 x 1000 e mobile 390 x 844: intestazioni, codice e cinque tabelle. Screenshot ispezionati; codice e ultime colonne raggiungibili con scorrimento, nessun overflow del documento, errore JavaScript o risposta HTTP fallita.
- Versioni confermate anche nel log della suite completa: Chrome 155.0.8059.40, Node 24.14.0 e npm 11.19.0. Riutilizzata l'anteprima su http://localhost:8082/appunti/ e chiusi i contesti browser di prova.
- Nessun commit, push, deploy remoto o modifica manuale agli HTML generati. I risultati non certificano automaticamente tutte le altre note del vault.

### Da proseguire

La revisione e proseguita con Prettier e Vite, documentate di seguito. Le note restano non revisionate fino al controllo dell'utente.

## 2026-10-13 - Tooling e Qualita: Prettier e Vite

### Perimetro e correzioni

Lette integralmente e completate [[Programmazione/JavaScript/Pagine/Prettier|Prettier]] e [[Programmazione/JavaScript/Pagine/Vite|Vite]]. Conservati data originale, tipo tecnico, pubblicabilita e status non revisionato; aggiunti prerequisiti e correlazioni con percorso completo. Totale di questa passata: **82 note JavaScript**, 26 Base, 23 Intermedio, 19 Avanzato, Real-time con WebSocket, nove Node.js Runtime e quattro Tooling e Qualita. Nessuna nuova pagina di contenuto o modifica agli indici.

- Prettier: separati parsing/formato, regole lint, tipi e test; completati installazione locale esatta, script npm, configurazione, EditorConfig, override, ignore, exit code e avviso sulla sovrascrittura dei file.
- Corretto l'output prima/dopo confrontandolo con il formatter reale: non viene aggiunta una riga vuota fra dichiarazione e funzione. Chiariti printWidth non vincolante, API asincrone, selezione distinta della CLI e fiducia in plugin/configurazioni eseguibili.
- Vite: distinti toolchain, framework, backend e hosting; aggiornato il riferimento a Vite 8.3.4 con Rolldown/Oxc, senza attribuire al build controlli di tipo, lint o test impliciti.
- Sostituita la sequenza di avvio incompleta con un progetto vanilla completo: package, config, HTML/JS/CSS, public, env e comandi separati. Esplicitati root, base /appunti/, loopback, strictPort, output rigenerabile e differenza fra dev/build/preview.
- Chiariti limiti HMR, variabili pubbliche e stringhe, mode distinto da NODE_ENV, precedenze, incorporamento dei valori nella build, proxy solo di sviluppo, fallback delle route e compatibilita/polyfill.
- Fonti ufficiali consultate e versioni provate: Prettier 3.9.10, Vite 8.3.4, Node 24.14.0. Tool installati con versioni esatte e script disabilitati in una directory temporanea esterna; nessun aggiornamento dei pacchetti Quartz.

### Verifica degli esempi

- **32 nuovi test**, tutti superati: 28 Node, incluso il contenitore lifecycle, e quattro browser Chrome 155.0.8059.40. Snippet estratti dal Markdown tramite AST.
- Prettier: output esatto e stabile, mancato controllo semantico, parsing errato, printWidth, lookup/override/EditorConfig, ignore, CLI/script npm, exit code 0/1/2, write e anteprima API senza scrittura.
- Vite: build reale, copia public, riscrittura base e asset, pulizia dell'output di fixture, import inesistente, TypeScript non verificato semanticamente, env/mode e mancata esposizione di un valore privato fittizio. Eseguito il bundle staging per distinguere MODE da PROD.
- Browser: contatore, titolo e link; CSS HMR mantiene lo stato, modifica del modulo vanilla provoca reload. Anteprima della build su desktop/mobile, con valore env invariato dopo la modifica del file sorgente.
- Fixture temporanee, link/junction ai pacchetti esterni, shim CLI locali per npm e server su loopback con porte assegnate dal sistema. Percorsi controllati prima della rimozione, browser/server/watcher chiusi, nessun servizio esterno durante i test.
- Limiti: Windows e versioni indicate, non una matrice multipiattaforma. Nessun collaudo di editor, hook, plugin di terzi, create-vite, framework, SSR, library mode, proxy remoto, hosting o browser legacy. La prova env non e un audit completo dei segreti; la prova TypeScript non esegue tsc. Nessun benchmark di velocita.

### Verifica del vault

- Suite completa eseguita serialmente prima della build: **1318 test superati**, 1083 Node.js 24.14.0 e 235 Chrome 155.0.8059.40, nessun test saltato.
- content:check con report: 911 documenti raggiungibili, zero errori strutturali, **612 avvisi editoriali**.
- content:test: 9 test della trasformazione superati. Aggiornati README dei 40 file di test, storico recente e [[_Meta/Controllo del vault|rapporto del vault]]. Lo storico conserva 10 voci operative.

### Pubblicazione locale

- Build Quartz completata: 911 documenti, 3.719 file emessi, 2.003 HTML, 168 redirect e **135.110 riferimenti** verificati, zero errori. Restano gli avvisi gia noti su eval di note-properties e metadati Git della copia temporanea.
- Controllate entrambe le note con Chrome 155.0.8059.40 su desktop 1440 x 1000 e mobile 390 x 844. Screenshot ispezionati: titoli, testo, codice e due tabelle leggibili; ultime colonne raggiungibili con scorrimento.
- Verificato lo scorrimento degli elementi code interni ai pre, che in Quartz sono i contenitori delle righe lunghe. Nessun overflow del documento, errore JavaScript o risposta HTTP fallita.
- Riutilizzata l'anteprima esistente su http://localhost:8082/appunti/; contesti browser di prova chiusi. Nessun commit, push, deploy remoto o modifica manuale agli HTML generati. I risultati non certificano automaticamente le altre note del vault.

### Da proseguire

La revisione e proseguita con Bundling e tree shaking e Source maps e debugging, documentate di seguito. Le note restano non revisionate fino al controllo dell'utente.

## 2026-10-13 - Tooling e Qualita: Bundling e source map

### Perimetro e correzioni

Lette integralmente e completate [[Programmazione/JavaScript/Pagine/Bundling e tree shaking|Bundling e tree shaking]] e [[Programmazione/JavaScript/Pagine/Source maps e debugging|Source maps e debugging]]. Conservati data originale, tipo tecnico, pubblicabilita e status non revisionato; normalizzati prerequisiti e correlazioni con percorso completo. Totale di questa passata: **84 note JavaScript**, 26 Base, 23 Intermedio, 19 Avanzato, Real-time con WebSocket, nove Node.js Runtime e sei Tooling e Qualita. Nessuna nuova pagina di contenuto o modifica agli indici.

- Distinti bundling, tree shaking, minificazione, splitting e compressione HTTP. Corrette le generalizzazioni su import namespace e funzioni mai chiamate con log nel corpo; separati effetti di esecuzione ed effetti al caricamento del modulo.
- Chiariti metadati sideEffects, CSS, annotazioni PURE e rischi di dichiarazioni false. Aggiunto progetto Vite completo con inizializzazione necessaria, export inutilizzato, report lazy, gestione del fallimento, manifest e comandi copiabili.
- Verificata la distinzione fra tree shaking e DCE di output: con Vite 8.3.4 minify false non disabilita ogni eliminazione. Corretto il test iniziale che assumeva bastasse treeshake false; tre varianti isolano i due passaggi.
- Completati formato e identita delle source map, limiti delle ottimizzazioni, coordinate e strumenti di debugging. Distinte le modalita false, true, inline e hidden; hidden non protegge il file distribuito.
- Aggiunto demo intenzionalmente difettoso, riproduzione, risalita dal punto dell'errore al chiamante, correzione e nuova build. Chiariti mappa privata, verifica della URL diretta, esclusione dei sorgenti incorporati e supporto separato di Node agli stack.
- Fonti primarie consultate e comportamento provato con Vite 8.3.4, Node 24.14.0 e Chrome 155.0.8059.40. Riutilizzati tool esterni gia installati, senza nuove dipendenze Quartz.

### Verifica degli esempi

- **24 nuovi test superati**: 20 Node e quattro Chrome. Demo estratti dal Markdown tramite AST e costruiti con Vite reale; le alterazioni diagnostiche restano nelle sole fixture.
- Provati import nominati e namespace statico/dinamico, eliminazione della funzione inutilizzata, conservazione/rimozione dell'inizializzazione con sideEffects, PURE falso ed effetti degli argomenti.
- Verificati manifest e caricamento del report al primo click, riuso del modulo, errore del chunk e ripristino del pulsante. Nessun backend esterno.
- Provate mappe esterne/inline/hidden/disabilitate, campi JSON, sourcesContent omesso e presenza nel testo originale di codice eliminato dal bundle. GET locale riuscito del file hidden: il commento omesso non e un controllo di accesso.
- CDP ferma Chrome sull'eccezione reale del minificato; SourceMap di Node risolve le coordinate nella riga 2 di src/profile.js. Ricostruzione dopo il fix e risultato ADA verificati su desktop/mobile. Entry server separata per gli stack Node con/senza --enable-source-maps.
- Fixture temporanee con link/junction ai pacchetti esterni, server loopback e cleanup di processi/browser; percorsi risolti controllati prima della rimozione. Nessuna installazione o rete esterna durante i test.
- Limiti: Windows e versioni indicate, non una matrice OS/browser/bundler. Non automatizzata l'interfaccia DevTools e non provati error tracker remoti, policy CDN/hosting, cache delle release, catene TypeScript/plugin, package pubblicati, effetti CSS o CommonJS. VM limitata ai piccoli casi isolati; nessun benchmark o audit completo dei segreti.

### Verifica del vault

- Suite completa seriale prima della build: **1342 test superati**, 1103 Node.js 24.14.0 e 239 Chrome 155.0.8059.40, nessun test saltato.
- content:check con report: 911 documenti raggiungibili, zero errori strutturali, **610 avvisi editoriali**.
- content:test: nove test della trasformazione superati. Test nuovo formattato e controllato con Prettier; README aggiornato per 41 file di test. Storico recente mantenuto a 10 voci operative e [[_Meta/Controllo del vault|rapporto del vault]] rigenerato.

### Da proseguire

Tooling e Qualita e coperto in questa passata. La revisione e proseguita con SPA e routing lato client e API REST, documentate di seguito. Le note restano non revisionate fino al controllo dell'utente.

### Pubblicazione locale

- Build Quartz completata: 911 documenti, 3.719 file emessi, 2.003 HTML, 168 redirect e **135.162 riferimenti** verificati, zero errori. Restano gli avvisi gia noti su eval di note-properties e metadati Git della copia temporanea.
- Controllate entrambe le note con Chrome 155.0.8059.40 su desktop 1440 x 1000 e mobile 390 x 844. Screenshot ispezionati per titoli, testo, codice e tre tabelle; ultime colonne raggiungibili con scorrimento.
- Verificato lo scorrimento dei code interni ai pre: nessun overflow del documento, errore JavaScript o risposta HTTP fallita. Questo controllo riguarda le note Quartz ed e separato dall'esecuzione dei demo.
- Riutilizzata l'anteprima esistente su http://localhost:8082/appunti/ e chiusi i browser di prova. Nessun commit, push, deploy remoto o modifica manuale agli HTML generati. I risultati non certificano automaticamente tutte le altre note del vault.

## 2026-10-13 - Applicazioni: SPA e API REST

### Perimetro e correzioni

Lette integralmente e completate [[Programmazione/JavaScript/Pagine/SPA e routing lato client|SPA e routing lato client]] e [[Programmazione/JavaScript/Pagine/API REST|API REST]]. Conservati data originale, tipo tecnico, pubblicabilita e status non revisionato; aggiunti prerequisiti e correlazioni con percorsi completi. Totale: **86 delle 87 note JavaScript in Pagine**, con Server-side rendering ancora da controllare. Nessuna nuova nota di contenuto o modifica agli indici.

- SPA: distinti documento attivo, vista, URL e cronologia; corretti pushState/replaceState senza popstate, stato iniziale null, ingresso diretto e fallback server. Distinti SPA, hash routing, MPA/SSG e SSR.
- Sostituiti i frammenti con funzioni implicite e intercettazione indiscriminata dei link con un progetto Vite completo. Router didattico con base esplicita, Map delle route, query controllata, rendering testuale, titolo/focus/aria-current, filtro dei click e cleanup.
- Conservati comportamenti nativi per modificatori, target, download, ancore e link esterni. Esplicitati limiti di scroll, dati asincroni, route guard e hosting Pages; nessuna modifica al router di Quartz.
- REST: corretta l'equivalenza con CRUD/JSON; aggiunti vincoli architetturali, distinzione risorsa/rappresentazione, safe/idempotente, PUT/PATCH, status e Problem Details. Precisati 401/403, esiti incerti delle mutazioni, cache, ETag/If-Match, paginazione e compatibilita.
- Aggiunto client ESM completo con contratto limitato, validazione input/output, proiezione dei campi, base URL, media type e status espliciti, 204 senza parsing e categorie d'errore separate. Demo offline completo con fake dichiarato e schema di cancellazione/timeout.
- Fonti primarie consultate; Vite 8.3.4, Node 24.14.0 e Chrome 155.0.8059.40. Riutilizzati tool esterni gia disponibili, senza installazioni o aggiornamenti dei pacchetti del sito.

### Verifica degli esempi

- **44 nuovi test superati**, 32 Node e 12 Chrome. Codice estratto dal Markdown tramite AST; build reale del progetto SPA e esecuzione integrale del demo REST offline.
- REST: input e schemi invalidi, limiti, URL/header/body, mancata chiamata su input errato, status inattesi, media type, JSON malformato, ID incoerente, Problem Details e corpo HTML. Distinti errori di rete, lettura del corpo e HTTP.
- HTTP nativo su loopback per GET/POST/DELETE, redirect rifiutato e abort dopo l'avvio effettivo di response.json su un corpo incompleto. Pre-abort e propagazione del signal provati separatamente. Nel browser, richieste intercettate verificano il contratto e l'assenza di un cookie fittizio del dominio.
- SPA: link senza nuovo documento, query, titolo/focus/aria-current, click duplicato, ingresso diretto e reload, Indietro/Avanti con stato null, route ignote e nomi ereditati, query non fidata, eventi gia annullati, elementi annidati e cleanup idempotente.
- Quindici casi di click usano eventi sintetici con comportamento finale bloccato dal test; Ctrl/Cmd-click, Enter e ancora sono azioni reali di Chrome. Verificato che pushState/replaceState da soli non renderizzino la vista.
- Fixture temporanee con link/junction alle dipendenze, server loopback, cleanup e percorsi risolti controllati prima della rimozione. Nessuna rete esterna o interazione con credenziali/backend personali.
- Limiti: Windows e versioni indicate, non matrice browser/hosting. Non provati backend persistente/autenticato, conformita REST completa, PUT/PATCH, ETag/cache, paginazione, retry, CORS, limiti di byte o rollback. Il timeout illustrativo non viene atteso integralmente. Nessun framework router, loader asincrono, screen reader, BFCache, CSP, hash router o fallback remoto; scroll restoration con contenuto variabile non certificata.

### Verifica del vault

- Suite completa seriale prima della build: **1386 test superati**, 1135 Node.js 24.14.0 e 251 Chrome 155.0.8059.40, nessun test saltato.
- content:check con report: 911 documenti raggiungibili, zero errori strutturali, **608 avvisi editoriali**.
- content:test: nove test della trasformazione superati; nuovo file formattato e controllato con Prettier. README aggiornato per 42 file di test, storico recente mantenuto a 10 voci e [[_Meta/Controllo del vault|rapporto del vault]] rigenerato.

### Pubblicazione locale

- Build Quartz completata: 911 documenti, 3.719 file emessi, 2.003 HTML, 168 redirect e **135.224 riferimenti** verificati, zero errori. Restano gli avvisi gia noti su eval di note-properties e metadati Git della copia temporanea.
- Controllate entrambe le note con Chrome 155.0.8059.40 su desktop 1440 x 1000 e mobile 390 x 844. Screenshot ispezionati per titoli, testo, codice e tre tabelle; ultime colonne raggiungibili con scorrimento.
- Verificato lo scorrimento dei code interni ai pre: nessun overflow del documento, errore JavaScript o risposta HTTP fallita. Questa verifica delle note Quartz e separata dall'esecuzione dei demo.
- Riutilizzata l'anteprima esistente su http://localhost:8082/appunti/ e chiusi i browser di prova. Nessun commit, push, deploy remoto o modifica manuale agli HTML generati.

### Da proseguire

La revisione e proseguita con Server-side rendering, documentata di seguito. I promemoria e le altre aree non sono automaticamente certificati dalla revisione delle note. Tutte restano non revisionate fino al controllo e all'approvazione dell'utente.

## 2026-10-13 - Applicazioni: Server-side rendering

### Perimetro e correzioni

Letta integralmente e completata [[Programmazione/JavaScript/Pagine/Server-side rendering|Server-side rendering]], ultima delle **87 note JavaScript in Pagine** per questa passata. Conservati data originale, tipo tecnico, pubblicabilita e status non revisionato; aggiunti prerequisiti e correlazioni con percorsi completi. Nessuna nuova nota di contenuto o modifica agli indici.

- Distinti SSR per richiesta, SSG, CSR, progressive enhancement e hydration; corretta l'idea che SSR richieda necessariamente un framework o hydration. Precisati i limiti di SEO e prestazioni, senza promesse di miglioramento automatico.
- Sostituiti template con interpolazioni non protette e funzioni implicite con un demo completo in quattro file: Node HTTP, renderer, modulo client e avvio. La ricerca via form funziona senza JavaScript; il browser aggiunge soltanto un ordinamento opzionale.
- Esplicitati contratto della query e del loader, stato locale alla richiesta, escaping per contesto HTML, GET/HEAD, byte UTF-8, asset fisso, 400/404/405/500 e messaggi d'errore generici.
- Completati rischi della serializzazione JSON negli script, esposizione delle props, cache privata/pubblica, mismatch di hydration e stato globale condiviso. Chiariti header gia inviati nello streaming, RSC distinto da SSR, edge e limiti di GitHub Pages.
- Fonti primarie consultate e riportate nella nota; demo verificato con Node 24.14.0 e Chrome 155.0.8059.40. Nessuna installazione, aggiornamento delle dipendenze o modifica alla configurazione del sito.

### Verifica degli esempi

- **33 nuovi test superati**, 25 Node e otto Chrome. Codice estratto direttamente dal Markdown tramite AST; moduli reali nella fixture, server loopback e avvio reale di main in un processo figlio. Nel test CLI cambiano soltanto porta e URL stampato per non occupare la porta del lettore.
- Node: caratteri speciali e Unicode, input non stringa, encoding del titolo/input/nomi, contenuto iniziale, ricerca e nessun risultato, query ripetute, limite UTF-16 prima del trim, Content-Length in byte e HEAD senza corpo.
- Verificati asset fisso e route sconosciute, metodi non ammessi con Allow, target con autorita esterna, loader fallito e dati invalidi. Due richieste sincronizzate da un loader controllato provano la separazione di query e risultati durante la concorrenza.
- Chrome: form senza JavaScript, ordinamento dei nodi esistenti senza rete, script bloccato, ricerca vuota, 404 HTTP e tastiera mobile. Le prove di injection su query e nomi eliminano la CSP dalla sola risposta della fixture per verificare l'escaping senza che la policy mascheri un errore.
- Corretto un falso positivo iniziale del test: il pattern Error intercettava anche il messaggio italiano Errore interno. Corretto inoltre un riferimento a Modules con il percorso canonico Moduli prima della validazione finale.
- Fixture temporanee rimosse dopo verifica di percorso risolto, parent e prefisso; server, processo figlio e browser chiusi. Nessuna rete esterna, credenziale o dato personale.
- Limiti: non eseguiti hydration React, RSC, streaming, edge, cache/CDN, rigenerazione, database, autenticazione o deadline del loader. Nessuna matrice browser, benchmark, prova di carico o audit XSS/accessibilita completo. La CSP del demo non e una configurazione universale; i timeout e lo shutdown di un backend reale richiedono altro lavoro.

### Verifica del vault

- Suite completa seriale prima della build: **1419 test superati**, 1160 Node.js 24.14.0 e 259 Chrome 155.0.8059.40, nessun test saltato.
- content:check con report: 911 documenti raggiungibili, zero errori strutturali, **607 avvisi editoriali**. Nessun avviso riguarda le note JavaScript in Pagine; questo non equivale a certificazione tecnica.
- content:test: nove test della trasformazione superati. Nuovo file controllato con Prettier; README aggiornato per 43 file di test, storico recente mantenuto a 10 voci e [[_Meta/Controllo del vault|rapporto del vault]] rigenerato.

### Pubblicazione locale

- Build Quartz completata: 911 documenti, 3.719 file emessi, 2.003 HTML, 168 redirect e **135.274 riferimenti** verificati, zero errori. Restano gli avvisi gia noti su eval di note-properties e metadati Git della copia temporanea.
- Controllata la nota con Chrome 155.0.8059.40 su desktop 1440 x 1000 e mobile 390 x 844. Ispezionati sette screenshot di introduzione, codice e due tabelle; ultime colonne raggiungibili con scorrimento.
- Nessun overflow del documento, errore JavaScript o risposta HTTP fallita. Lo scorrimento dei code interni ai pre e verificato separatamente da quello delle tabelle. Questa verifica della pagina Quartz non e l'esecuzione del demo.
- Riutilizzata l'anteprima su http://localhost:8082/appunti/ e chiusi i browser di prova. Nessun commit, push, deploy remoto o modifica manuale agli HTML generati.

### Da proseguire

**Nessuna nota rimanente nelle 87 pagine JavaScript di questa passata.** I successivi controlli degli 11 promemoria sono registrati nel blocco seguente; le note degli altri linguaggi o delle altre aree non sono incluse nel conteggio.

Durante il confronto e stata letta anche [[Programmazione/React/Pagine/SSR e SSG|SSR e SSG in React]]: contiene ancora una sintesi troppo generale sui benefici del rendering e schemi con hydration implicita. Da riprendere nella revisione React; non e stata modificata o certificata in questo blocco.

Le note restano non revisionate fino al controllo e all'approvazione dell'utente. La copertura del registro e dei test non prova ogni frammento, browser, framework o configurazione di produzione.

## 2026-10-13 - Promemoria JavaScript

### Perimetro e correzioni

Lette integralmente e corrette tutte le **11 schede** dell'[[Programmazione/JavaScript/Promemoria/Indice Promemoria JavaScript|indice dei promemoria JavaScript]]. Conservati data originale, tipo operativo, pubblicabilita e status non revisionato. Nessuna nuova nota, spostamento o modifica all'indice: il percorso contiene gia tutti i collegamenti necessari.

- Sintassi essenziale e Funzioni: chiariti const, nullish/default, copia superficiale, contesto dei frammenti, alternative di dichiarazione, this/arguments delle arrow, callback sincrone/asincrone e bind.
- Array e Oggetti, Map e Set: distinti mutazione, valori restituiti, assenza, input vuoti e riferimenti condivisi. Raggruppamento protetto dalle chiavi ereditate tramite accumulatore senza prototipo; proiezione pubblica esplicita invece della sola rimozione di password.
- Stringhe e RegExp e Numeri e date: precisati UTF-16, limiti ASCII, lastIndex, sostituzioni con dollaro, parsing rispetto a validazione, precisione binaria, date invalide, UTC/locale e calendario rispetto a durata fissa.
- Moduli: sostituito l'export di un nome non dichiarato con un alias coerente; mini-file ESM completi, live binding, namespace, default, re-export e import dinamico. Contesto .mjs esplicito per browser HTTP e Node.
- Promise e async-await: corretti cleanup della catena, return await, combinatori e concorrenza; il timeout resta attivo fino alla lettura JSON e rilascia sempre il timer. Espliciti contratto della risposta ed errori del corpo.
- Fetch, JSON e storage: distinti status HTTP, 204/205, media type, consumo del corpo e schema applicativo. Abort con rifiuto gestito, limiti delle credenziali manuali, storage protetto da errori e proiezione delle impostazioni; clear separato e segnalato come distruttivo per l'intera origine.
- DOM ed eventi ed Errori e debug: corretti spostamento dei nodi, listener/capture/cleanup, campi form ripetuti e delegazione delle liste annidate. Chiariti readyState, errori asincroni, timer nel finally, console.assert e limiti delle osservazioni in console.
- Mantenuta la funzione di promemoria: snippet brevi e contesto minimo, rimandi alle note teoriche e fonti primarie nelle schede, senza duplicare interi capitoli.

### Verifica degli esempi

- **64 nuovi test superati** in javascript-promemoria.test.mjs: 49 Node e 15 Chrome. Undici dei test Node sono gruppi di sola verifica sintattica, uno per scheda; gli altri 38 verificano comportamenti selezionati. Il parsing di tutti i blocchi non prova l'esecuzione integrale di ogni frammento.
- Codice estratto dal Markdown tramite AST; per gli schemi vengono forniti i contesti dichiarati. ESM eseguito realmente da Node e Chrome in moduli temporanei, non soltanto analizzato dal parser.
- Date controllate in processi separati UTC ed Europe/Rome: sette giorni di calendario attraversando l'ora legale non equivalgono sempre a 168 ore. Verificati anche precisione, regex, chiavi speciali, proiezioni pubbliche e gestione dei riferimenti.
- Promise e Fetch provati con fake controllati e risposte native; server loopback con corpo JSON incompleto per verificare l'abort durante la lettura. Corretto un falso negativo iniziale del test attendendo l'avvio esplicito del lettore invece di contare microtask.
- Browser: DOM, listener, delegazione, readyState, FormData ripetuto, storage e reload, ESM, abort, console.assert e header di una richiesta intercettata. Quota e accesso negato simulati; clear eseguito soltanto nell'origine isolata della fixture.
- Fixture rimosse dopo controllo dei percorsi risolti; server e browser chiusi. Nessuna installazione, rete esterna, credenziale, modifica ai dati personali o alle dipendenze del sito.
- Limiti: Node 24.14.0 e Chrome 155.0.8059.40 su Windows, non matrice browser o fusi storici. Nessun backend autenticato, benchmark, audit di sicurezza, prova di quota reale o esecuzione indiscriminata degli schemi. Le verifiche visive di Quartz restano separate.

### Verifica del vault

- Suite completa eseguita serialmente prima della build: **1483 test superati**, 1209 Node e 274 Chrome, nessun test saltato.
- content:check con report: 911 documenti raggiungibili, zero errori strutturali, **597 avvisi editoriali**. Nessun avviso riguarda gli 11 promemoria; l'assenza di avvisi non certifica da sola il contenuto.
- content:test: nove test della trasformazione superati. Nuovo file controllato con Prettier; README aggiornato per 44 file di test, storico recente mantenuto a 10 voci e [[_Meta/Controllo del vault|rapporto del vault]] rigenerato.

### Pubblicazione locale

- Build Quartz completata: 911 documenti, 3.719 file emessi, 2.003 HTML, 168 redirect e **135.332 riferimenti** verificati, zero errori. Restano gli avvisi gia noti su eval di note-properties e metadati Git della copia temporanea.
- Verificate tutte le 11 schede con Chrome 155.0.8059.40 in 22 viste: desktop 1440 x 1000 e mobile 390 x 844. Titoli corretti, nessun overflow del documento, errore JavaScript o caricamento HTTP fallito.
- Controllato lo scorrimento dei blocchi di codice e delle cinque tabelle, comprese le ultime colonne. Ispezionati 11 screenshot rappresentativi, uno per scheda, con introduzioni, codice e tutte le tabelle su mobile. Queste prove del sito non sostituiscono l'esecuzione degli snippet.
- Riutilizzata l'anteprima esistente su http://localhost:8082/appunti/ e chiusi i browser di prova. Nessun commit, push, deploy remoto o modifica manuale agli HTML generati.

### Da proseguire

Completata questa passata su **87 note JavaScript e 11 promemoria**, 98 note di contenuto complessive. Rimangono i contenuti degli altri argomenti, incluso il punto gia segnalato su SSR e SSG in React. Non estendere questi risultati automaticamente a tutto il vault.

Le note restano non revisionate fino al controllo dell'utente. Non sono stati richiesti commit, push o deploy remoto.

## 2026-10-14 - Fondamenta React

### Perimetro

Lette integralmente e corrette le cinque note del blocco Fondamenta di React. Inizio di questa passata sull'area: **5 delle 59 note React**, con 54 ancora da esaminare. I risultati non certificano automaticamente le note correlate o le versioni precedenti degli esempi.

Conservati data originale, tipo teorico/tecnico, pubblicabilita e status non revisionato; aggiunti prerequisiti, correlazioni e fonti ufficiali. Nessuna nuova pagina o spostamento: l'indice contiene gia tutte le cinque note.

| Nota                                                                                            | Interventi                                                                                                                                        |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/React/Pagine/Introduzione e Toolchain\|Introduzione e Toolchain]]              | Distinti React/React DOM, JSX, framework e build; progetto completo in cinque file, versioni esplicite, root controllata e comandi separati.      |
| [[Programmazione/React/Pagine/JSX\|JSX]]                                                        | Corretti contesti impliciti, attributi, valori renderizzabili, Fragment con key, style, callback e limiti dell'escaping testuale.                 |
| [[Programmazione/React/Pagine/Componenti Funzionali vs Componenti a Classe\|Funzioni e classi]] | Due contatori realmente equivalenti, import, updater, initialValue, reset via key, limiti dei lifecycle e classi ancora supportate.               |
| [[Programmazione/React/Pagine/Props e Flusso di dati unidirezionale\|Props e flusso dati]]      | Proprietario dello stato, callback distinta da bubbling, oggetti non clonati, default e children; demo di filtro/selezione con input controllato. |
| [[Programmazione/React/Pagine/Rendering Condizionale e Liste\|Rendering e liste]]               | Stati UI espliciti, zero con &&, identita e key; demo di bozze locali con riordino ed eliminazione, senza mutare gli array precedenti.            |

### Fonti e ambiente

- Documentazione React e Vite consultata il 2026-10-14; versioni npm controllate prima di preparare la fixture. Fonti specifiche nelle singole note.
- React e React DOM 19.3.0, Vite 8.3.4, plugin React 6.1.2, Node 24.14.0, Chrome 155.0.8059.79. Pacchetti installati con versioni esatte e script di installazione disabilitati, soltanto in appunti-react-tools nella directory temporanea esterna.
- Nessuna modifica a package.json/lockfile o dipendenze di Quartz. Il demo e client-side; non e un'app SSR, un backend o un prodotto da distribuire.

### Verifica degli esempi

- **33 test superati** in react-fondamenti.test.mjs: 19 Node e 14 Chrome. Cinque gruppi Node controllano la sola sintassi dei blocchi JSX/JS, 13 controllano markup/comportamenti selezionati mediante React DOM server e uno la build del progetto. Non presentare il controllo sintattico come esecuzione completa.
- Codice estratto dal Markdown tramite AST, senza seconda implementazione dei componenti. Il progetto introduttivo conserva package/config/HTML/main/App della nota; i componenti delle altre note vengono montati in un banco di prova dedicato.
- Controllati valori predefiniti/null, attributi booleani, Fragment senza wrapper, style, oggetti non renderizzabili, testo escapato, children, stati vuoti/errore e dati congelati.
- Build tramite API Vite, dev server e preview di produzione reali. Browser con StrictMode, click, reload, contatori equivalenti e indipendenti, cambio di initialValue senza reset e key diversa con reset.
- Verificati label/input con useId, callback senza aggiornamento del padre, filtro e selezione persistente, reset, identita del nodo dopo reverse e mantenimento delle bozze delle righe superstiti.
- Variante negativa solo nella fixture: sostituire la key stabile con l'indice sposta la bozza sulla riga errata, come previsto. Non e una modifica all'esempio pubblicato o una mutation suite completa.
- Risolto un problema della fixture Windows: node_modules deve essere una directory locale per la cache Vite, con junction sulle singole dipendenze. Canonicalizzare soltanto il percorso non bastava. Rimossa inoltre dal demo la richiesta implicita a favicon.ico tramite un'icona data vuota.
- Server e contesti browser chiusi; junction rimosse senza attraversarle, poi fixture cancellate dopo verifica di percorso risolto, parent e prefisso. Nessuna rete esterna durante i test, credenziale o dato personale.

### Limiti

Non eseguiti il generatore create-vite, una reinstallazione per ogni fixture, Fast Refresh, ESLint/type checking, framework, hydration/RSC, lifecycle/effect o error boundary. Nessuna matrice browser, prova di carico, benchmark o audit completo di accessibilita/sicurezza. Il rendering statico nei test verifica markup, non l'implementazione di un sito SSR. La precedente suite JavaScript non e stata rieseguita in questo blocco.

### Verifica del vault

- content:check con report: **911 documenti raggiungibili, zero errori, 592 avvisi editoriali** (cinque in meno dopo l'aggiunta delle fonti). Non sono 592 errori tecnici accertati.
- content:test: **9 test superati**, separati dai 33 sugli esempi React.
- README dei test e rapporto aggiornati; storico recente mantenuto a 10 voci operative.

### Pubblicazione locale

- Build Quartz completata e ripetuta dopo una correzione editoriale alla tabella funzioni/classi: 911 documenti, 3.719 file emessi, 2.003 HTML, 168 redirect e **135.401 riferimenti verificati**, zero errori. Avvisi preesistenti su eval di note-properties e metadati Git della copia temporanea.
- L'anteprima precedente non era piu attiva: riavviato il server locale sulla porta 8082, senza finestre aggiuntive. Nessuna modifica manuale a site/public o alla configurazione del sito.
- Controllate tutte le cinque note in 10 viste Chrome: desktop 1440 x 1000 e mobile 390 x 844. Titoli corretti, nessun overflow del documento, errore JavaScript o caricamento HTTP fallito; codice e tabelle scorrono entro i rispettivi contenitori.
- Ispezionati otto screenshot rappresentativi di testo, codice e due tabelle, inclusa la nuova verifica della cella corretta. Il controllo delle pagine Quartz e distinto dai 33 test React. Browser QA chiusi; anteprima lasciata disponibile su http://localhost:8082/appunti/.

### Prossimo blocco

Stato e Rendering: [[Programmazione/React/Pagine/useState|useState]], [[Programmazione/React/Pagine/useEffect|useEffect]], [[Programmazione/React/Pagine/useRef|useRef]] e [[Programmazione/React/Pagine/Gestione Moduli|Gestione Moduli]], riutilizzata nell'indice per eventi, form e componenti controllati/non controllati.

Restano 54 note React. Il problema gia annotato in SSR e SSG resta aperto fino a quel blocco. Le note modificate restano non revisionate fino all'approvazione dell'utente; nessun nuovo commit o push eseguito.

## 2026-10-15 - React: Stato e Rendering

### Perimetro

Lette integralmente e corrette le quattro note del blocco Stato e Rendering. La passata React copre ora **9 note su 59**, con **50 ancora da esaminare**. Gestione Moduli e la stessa pagina richiamata dall'indice per form, eventi, controlled/uncontrolled e React Hook Form: non conteggiata piu volte.

Conservati date originarie, percorsi, tipo, pubblicabilita e status non revisionato; aggiunti prerequisiti, correlazioni e fonti ufficiali. Nessuna nuova nota, spostamento o necessita di aggiornare gli indici.

| Nota                                                             | Correzioni                                                                                                                                                                               |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/React/Pagine/useState\|useState]]               | Snapshot e coda, sostituzioni rispetto a updater, purezza, inizializzazione e identita; esempi completi per oggetti annidati, array e input controllato.                                 |
| [[Programmazione/React/Pagine/useEffect\|useEffect]]             | Commit rispetto a render/paint, dipendenze e Strict Mode; timer con cleanup e fetch con errori HTTP/JSON/schema, abort e protezione dalle risposte obsolete.                             |
| [[Programmazione/React/Pagine/useRef\|useRef]]                   | Ref rispetto a stato, assegnazione DOM, focus e timeout cancellabile; eliminato l'esempio che leggeva la ref nel render, conservando il tema del valore precedente con stato coordinato. |
| [[Programmazione/React/Pagine/Gestione Moduli\|Gestione Moduli]] | Eventi, semantica e controlli nativi, login con contratto asincrono, errori/reset e simulazione esplicita; FormData, select multipla e esempio funzionante React Hook Form.              |

### Fonti e prove

- Fonti React, MDN e sorgenti ufficiali React Hook Form consultate il 2026-10-15, link nelle note. Verificata la versione npm prima di installare React Hook Form 7.90.0 nella sola toolchain temporanea esterna.
- Eseguiti serialmente i due file di test React: **62 test superati**, 33 dei fondamenti piu 29 nuovi (8 Node, di cui quattro gruppi di sola sintassi, e 21 Chrome). Node 24.14.0, React/React DOM 19.3.0, Vite 8.3.4 per la regressione, Chrome 155.0.8059.79.
- Il nuovo banco di prova estrae gli snippet Markdown e li compila con esbuild in memoria. Fixture HTTP locale, Strict Mode e orologio Playwright per timer deterministici. Nessuna nuova dipendenza o modifica al lockfile del sito.
- Verificati updater/reset, copie annidate e array, titolo ripristinato, unico intervallo e cleanup, focus, timeout sostituito/annullato e precedente relativo all'evento.
- Fetch reale per profili e errori HTTP/JSON/schema. Mock differito dichiarato soltanto nei test delle risposte fuori ordine e dopo unmount: ignora intenzionalmente l'abort per verificare la protezione `active` e l'invalidazione dei signal.
- Verificati invio da tastiera, validazione HTML, attesa e lock, retry, reset, FormData e selezioni multiple, errori accessibili del campo React Hook Form. Credenziali fittizie; nessuna autenticazione o richiesta a servizi reali.
- Server e browser di prova chiusi. Il nuovo test non crea directory/junction di fixture; la regressione dei fondamenti conserva il proprio cleanup verificato.

### Limiti e seguito

Non sono stati eseguiti tutti i frammenti schematici, i comportamenti soltanto descritti in prosa, lint/type checking, Controller/resolver, Actions, SSR/hydration, backend o sicurezza dell'autenticazione. I test con mock non dimostrano cancellazione dell'elaborazione server. Non rieseguita la precedente suite JavaScript; risultati e date restano separati.

Prossimo blocco: Toolchain Base, con [[Programmazione/React/Pagine/Profiler e Debugging|Profiler e Debugging]], [[Programmazione/React/Pagine/CSS Modules|CSS Modules]] e [[Programmazione/React/Pagine/Styling base|Styling base]]. Introduzione e Toolchain, gia controllata, non va ricontata. Il punto gia annotato su SSR e SSG rimane aperto fino al relativo blocco.

Le note restano non revisionate fino all'approvazione dell'utente. Nessun commit, push o deploy remoto richiesto o eseguito.

### Verifica del vault e del sito

- content:check con report: **911 documenti raggiungibili, zero errori, 588 avvisi editoriali**, quattro in meno grazie alle fonti aggiunte. Gli avvisi non equivalgono a inesattezze tecniche accertate.
- content:test: **9 test superati**, separati dai 62 test React. Storico recente mantenuto a 10 voci operative; README e rapporto aggiornati.
- Build completa Quartz: **3.719 file emessi, 2.003 HTML, 168 redirect, 135.488 riferimenti verificati, zero errori**. Restano gli avvisi preesistenti su eval del plugin note-properties e metadati Git nella copia temporanea.
- Anteprima precedente non attiva: riavviata in background sulla porta libera 8082. Nessuna modifica manuale agli HTML o alla configurazione del sito.
- Verificate le quattro note in otto viste Chrome, desktop 1440 x 1000 e mobile 390 x 844. Titoli corretti, nessun overflow del documento, errore JavaScript o risposta HTTP fallita; controllati scorrimento del codice e visibilita dell'ultima colonna delle due tabelle.
- Ispezionati sei screenshot rappresentativi di testo, codice e tabelle. Questa verifica visiva e distinta dai test degli esempi; browser QA chiuso, anteprima disponibile su http://localhost:8082/appunti/.

## 2026-10-15 - React: Toolchain Base

### Perimetro

Lette integralmente e corrette Profiler e Debugging, CSS Modules e Styling base. Completato il **Percorso Base di React: 12 note uniche su 59**, con **47 ancora da esaminare**. Introduzione e Toolchain era gia revisionata e non viene ricontata per i suoi richiami nell'indice.

Conservati percorsi, data originaria, pubblicabilita e status non revisionato. Profiler e Debugging resta una nota operativa e segue le sezioni del relativo template; le altre due restano note tecniche. Nessuna nuova nota o modifica necessaria agli indici.

| Nota                                                                       | Correzioni                                                                                                                                                       |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/React/Pagine/Profiler e Debugging\|Profiler e Debugging]] | Procedura riproducibile, strumenti distinti, componente Profiler completo, metriche e limiti, sviluppo/produzione e diagnosi senza memoizzazione indiscriminata. |
| [[Programmazione/React/Pagine/CSS Modules\|CSS Modules]]                   | Scope per file, nomi esportati, cascata, composes e global; progetto completo con token, pulsante riusabile e scheda selezionabile.                              |
| [[Programmazione/React/Pagine/Styling base\|Styling base]]                 | CSS globale rispetto a inline style, variabili con unita, semantica e stati; demo completo di tema locale, slider, reset, focus e movimento ridotto.             |

### Fonti e prove

- Documentazione primaria React, Vite, CSS Modules, MDN e Chrome DevTools consultata il 2026-10-15; riferimenti nelle note.
- Riutilizzata la toolchain temporanea esterna: React/React DOM 19.3.0, Vite 8.3.4, plugin React 6.1.2, Node 24.14.0, Chrome 155.0.8059.79. Nessun pacchetto nuovo, nessuna modifica a dipendenze o configurazione di Quartz.
- **90 test React superati** nell'esecuzione finale seriale: 62 precedenti e 28 nuovi. Questi ultimi sono sei Node (tre gruppi di sola sintassi e tre verifiche delle build) e 22 Chrome.
- Tre progetti ricostruiti dal Markdown, con dev server e preview Vite reali. Testati campi/callback del Profiler in sviluppo e assenza di record nella produzione ordinaria, senza sostenere che il demo sia un benchmark.
- I primi test hanno rilevato un errore della fixture: Vite build lasciava NODE_ENV=production per il server dev nello stesso processo. Separati esplicitamente gli ambienti e controllata la configurazione; corretto anche react-fondamenti.test.mjs e rieseguita l'intera regressione. I risultati precedenti dei fondamenti non certificavano da soli l'esecuzione in sviluppo.
- Corretti anche un selettore di test troppo restrittivo per la label del select e un problema reale dell'esempio CSS Modules: il titolo lungo con font ingrandito superava il contenitore. Aggiunti wrapping al contenitore e dimensione esplicita del titolo.
- CSS Modules verificati su classi generate distinte, composizione, global discendente, ereditarieta dei token e influenza delle regole globali. Non equiparati a Shadow DOM.
- Styling verificato su tema, variabile dinamica, reset, disabled, focus e hover, movimento ridotto e layout a 320/390/1440 px, anche con font base al 200% e titolo senza spazi.
- Ispezionati quattro screenshot dei demo, separati dalla QA Quartz. Browser/server chiusi; fixture e junction rimosse dopo controllo del percorso, senza attraversare le directory delle dipendenze.

### Limiti e seguito

Non automatizzati i pannelli dell'estensione React DevTools, Performance tracks o una build speciale di profiling. Nessun benchmark, matrice browser, audit completo di accessibilita/contrasto, lint/type checking o verifica di Sass/utility/CSS-in-JS. I frammenti schematici hanno solo controllo sintattico. Non rieseguita la suite JavaScript.

Prossimo blocco: Percorso Intermedio, Hooks e Stato, iniziando da [[Programmazione/React/Pagine/useMemo e useCallback|useMemo e useCallback]], [[Programmazione/React/Pagine/useReducer|useReducer]] e [[Programmazione/React/Pagine/Custom Hooks|Custom Hooks]]. Il punto gia annotato su SSR e SSG resta aperto fino al relativo blocco.

Le note restano non revisionate fino all'approvazione dell'utente. Nessun commit, push o deploy remoto.

### Verifica del vault e del sito

- content:check con report: **911 documenti raggiungibili, zero errori, 585 avvisi editoriali**, tre in meno grazie alle fonti aggiunte. Gli avvisi non certificano errori tecnici.
- content:test: **9 test superati**, distinti dai 90 test React. Rapporto e README aggiornati; storico recente mantenuto a 10 voci operative.
- Build completa Quartz: **3.719 file emessi, 2.003 HTML, 168 redirect, 135.552 riferimenti verificati, zero errori**. Restano gli avvisi preesistenti su eval del plugin note-properties e metadati Git nella copia temporanea.
- Anteprima precedente non attiva: avviata in background sulla porta libera 8082. Nessuna modifica manuale agli HTML o alla configurazione di Quartz.
- Controllate tutte e tre le pagine in sei viste Chrome, desktop 1440 x 1000 e mobile 390 x 844: titoli corretti, nessun overflow del documento, errore JavaScript o risposta HTTP fallita. Verificate le tre tabelle del Profiler e la visibilita dell'ultima colonna.
- Verificato separatamente lo scorrimento dei blocchi code interni a pre: dieci blocchi larghi su mobile, tutti scorribili; nessun blocco largo su desktop. Il solo controllo del contenitore pre non sarebbe sufficiente a verificarli.
- Ispezionati sei screenshot Quartz: CSS Modules desktop e codice mobile, Styling base mobile e le tre tabelle del Profiler mobile. Questa QA e distinta dalle prove degli esempi. Browser QA chiuso; anteprima disponibile su http://localhost:8082/appunti/.

## 2026-10-15 - React: Hooks e Stato, prima parte

### Perimetro

Lette integralmente e corrette useMemo e useCallback, useReducer e Custom Hooks. La revisione tecnica React copre **15 note uniche su 59**, con **44 ancora da esaminare**. I richiami allo stesso file nell'indice, come Reducer pattern e Memoization strategy, non sono altre note.

Conservati percorsi, data originaria, tipo tecnico, pubblicabilita e status non revisionato. Integrati prerequisiti, collegamenti e fonti. Nessuna nuova pagina o modifica necessaria all'indice.

| Nota                                                                         | Correzioni                                                                                                                                                                            |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/React/Pagine/useMemo e useCallback\|useMemo e useCallback]] | Object.is, dipendenze, closure e cache invalidabile; memo non blocca stato/context. Catalogo completo con filtro e sconto, limiti delle misure e del Compiler.                        |
| [[Programmazione/React/Pagine/useReducer\|useReducer]]                       | Snapshot, coda, initializer e reset; reducer puri con copie annidate. Contatore completo e form con invalidita, correzione, conferma locale e reset, distinti dal progetto asincrono. |
| [[Programmazione/React/Pagine/Custom Hooks\|Custom Hooks]]                   | Contratto e punti di chiamata, stato indipendente, JSX restituibile e identita dell'API. Pannelli, titolo con ownership esplicita e debounce completo con cleanup e istanze separate. |

### Fonti e prove

- Documentazione primaria React 19.3 e MDN consultata il 2026-10-15, con collegamenti nelle note. Riutilizzati React/React DOM 19.3.0 e toolchain temporanea esterna; nessun nuovo pacchetto o aggiornamento del lockfile.
- **128 test React superati** nell'esecuzione finale seriale: 90 precedenti e 38 nuovi. Nuovi test: 14 Node (tre gruppi di sintassi, nove prove pure e due render statici) e 24 Chrome, dodici per ciascuno dei due ambienti.
- Esempi estratti dal Markdown: esbuild crea due bundle in memoria con NODE_ENV esplicito, development e production. Node 24.14.0, Chrome 155.0.8059.79; la regressione riesegue anche le precedenti build Vite 8.3.4.
- Stato e azioni congelati: filtro, reducer e initializer senza mutazioni; copie annidate, no-op, errori di azione e risultati ripetibili. Nessun algoritmo duplicato nella fixture.
- Browser: callback aggiornata quando cambia lo sconto, scelta conservata fino al clic; dispatch consecutivi, errori associati all'input, normalizzazione, reset con prop corrente e nuova key.
- Pannelli con stati/ID indipendenti; titolo aggiornato e ripristinato con un solo proprietario. Debounce con orologio Playwright e handle osservati: cambio rapido di valore, ritardo modificato, cleanup, remount, istanze indipendenti e funzioni conservate senza invocazione.
- Browser e server chiusi. Il nuovo test non crea directory di fixture o junction; le suite precedenti mantengono il loro cleanup. Nessuna autenticazione, rete esterna o persistenza nei demo.

### Limiti e seguito

Non misurate prestazioni o conteggi garantiti di render; nessun benchmark o React Compiler. Gli schemi hanno solo verifica sintattica e la tabella di invio asincrono e progettazione, non un backend implementato. Non verificati lint/type checking, comparator personalizzati, cache invalidata da Suspense/Fast Refresh, hydration, store esterni, coordinamento di titoli concorrenti, matrice browser o audit completo di accessibilita. I render statici non eseguono gli effect. Suite JavaScript non rieseguita.

Prossimo blocco: completare Hooks e Stato con [[Programmazione/React/Pagine/Context API|Context API]], [[Programmazione/React/Pagine/State Management Esterno|State Management Esterno]] e [[Programmazione/React/Pagine/Derived state|Derived state]]. Resta aperto il punto precedente su SSR e SSG fino al relativo blocco.

Le note restano non revisionate fino all'approvazione dell'utente. Nessun commit, push o deploy remoto.

### Verifica del vault

- content:check con report: **911 documenti raggiungibili, zero errori, 582 avvisi editoriali**, tre in meno grazie alle fonti aggiunte. Gli avvisi non certificano errori tecnici.
- content:test: **9 test superati**, distinti dai test degli esempi. README e rapporto aggiornati; storico recente mantenuto a 10 voci operative.
- Build completa Quartz: **3.719 file emessi, 2.003 HTML, 168 redirect, 135.608 riferimenti verificati, zero errori**. Restano gli avvisi preesistenti su eval del plugin note-properties e metadati Git della copia temporanea.
- Riutilizzata l'anteprima gia attiva sulla porta 8082, senza fermarla o modificarne la configurazione. Nessun intervento manuale sugli HTML generati.
- Verificate le tre note in sei viste Chrome, desktop 1440 x 1000 e mobile 390 x 844: contenuti aggiornati, titoli corretti, nessun overflow del documento, errore JavaScript o risposta HTTP fallita. Otto blocchi code larghi su mobile, tutti scorribili; nessuno su desktop. Verificata l'ultima colonna della tabella asincrona di useReducer.
- Ispezionati sei screenshot: useMemo e useCallback desktop/codice mobile, useReducer desktop/tabella mobile, Custom Hooks testo/codice mobile. Browser QA chiuso; anteprima disponibile su http://localhost:8082/appunti/. La QA del sito resta distinta dall'esecuzione degli esempi.

## 2026-10-15 - React: Context, Store e Stato Derivato

### Perimetro

Lette integralmente e corrette Context API, State Management Esterno e Derived state. Completato il blocco Hooks e Stato: la revisione tecnica React copre **18 note uniche su 59**, con **41 ancora da esaminare**. Le voci dell'indice che richiamano una stessa nota non sono conteggiate due volte.

Conservati percorsi, data originaria, tipo, pubblicabilita e status non revisionato. Context segue il template tecnico; le due note teoriche ora seguono le sezioni del relativo template. Aggiunti prerequisiti, collegamenti e fonti, senza creare duplicati o modificare l'indice.

| Nota                                                                               | Correzioni                                                                                                                                                                                                                                           |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/React/Pagine/Context API\|Context API]]                           | Distribuzione distinta dalla proprieta dello stato; default solo senza provider, undefined esplicito, annidamento e identita. Esempi completi di fallback e lingue indipendenti, guard e consumatori memo; limiti di memoizzazione e autorizzazione. |
| [[Programmazione/React/Pagine/State Management Esterno\|State Management Esterno]] | Scelta fra stato locale, URL, Context, client store e cache remota. Due demo alternativi completi Zustand/Redux Toolkit; selector, merge, Immer, reset, sottoscrizioni, durata e isolamento. Recoil segnalato come archiviato.                       |
| [[Programmazione/React/Pagine/Derived state\|Derived state]]                       | Input indipendenti e viste pure, effetto di sincronizzazione evitabile, ordinamento senza mutare. Carrello con quantita, totale e selezione per ID; bozza intenzionale con politica di reset tramite key.                                            |

### Fonti e prove

- Consultate fonti primarie React, Zustand, Redux/React Redux, TanStack Query e Jotai; stato del repository Recoil verificato. Collegamenti nelle note. Verificate anche le implementazioni installate di merge e useSyncExternalStore in Zustand.
- Installati esclusivamente nella toolchain temporanea esterna Zustand 5.0.15, Redux Toolkit 2.13.0 e React Redux 9.3.0. Nessun aggiornamento di dipendenze o lockfile Quartz.
- **166 test React superati** nella regressione seriale: 128 precedenti e 38 nuovi. Nuovi test: 16 Node (tre gruppi di sola sintassi, quattro render statici, nove prove pure/store) e 22 Chrome, undici per ambiente.
- Esempi estratti direttamente dalle note; bundle esbuild in memoria con NODE_ENV development/production esplicito e Strict Mode. React 19.3.0, Node 24.14.0 e Chrome 155.0.8059.79. Le suite precedenti rieseguono anche build Vite reali.
- Context: default, provider piu vicino, undefined, guard e valori falsy; provider indipendenti e consumatori memo aggiornati. Nuova prop iniziale distinta da reset tramite key.
- Store: factory isolate, snapshot congelati, transizioni e reset riutilizzabile, subscribe/unsubscribe. Nel browser entrambi i demo mantengono lo stato oltre lo smontaggio dei consumatori ma lo perdono al reload. Reset parziale Zustand conserva le azioni.
- Dati derivati: filtro e sort non mutano gli input, totale con quantita e zero sul vuoto, selezione aggiornata e conservata anche se nascosta dal filtro, rimozione e reset. Bozza preservata dopo nuove props della stessa identita, scartata dopo cambio di key.
- Server e browser chiusi; nessuna nuova fixture su disco o junction nel test aggiunto. Aggiornato il README con comando di installazione, regressione e limiti.

### Limiti e seguito

Nessun benchmark o conteggio fisso di render evitati, React Compiler, lint/type checking, hydration/SSR, middleware di persistenza, cache di rete, sincronizzazione fra schede o implementazione Jotai/Recoil. Schemi e anti-pattern hanno solo controllo sintattico; render statici non dimostrano un'app SSR. Nessuna matrice browser, backend reale o audit completo di accessibilita. Suite JavaScript non rieseguita.

Prossimo blocco: [[Programmazione/React/Pagine/React Router|React Router]], [[Programmazione/React/Pagine/Data Fetching e Cache|Data Fetching e Cache]] e [[Programmazione/React/Pagine/Validazione Dati|Validazione Dati]], nella sezione Routing, Data Fetching e Form. Gestione Moduli e gia stata revisionata e conteggiata. Resta aperto il punto su SSR e SSG fino al relativo blocco.

Le note restano non revisionate fino all'approvazione dell'utente. Nessun commit, push o deploy remoto.

### Verifica del vault

- content:check con report: **911 documenti raggiungibili, zero errori, 579 avvisi editoriali**. Gli avvisi non sono una certificazione di errori tecnici; rapporto aggiornato.
- content:test: **9 test superati**, distinti dall'esecuzione degli esempi React.
- Build completa Quartz: **3.719 file emessi, 2.003 HTML, 168 redirect e 135.669 riferimenti verificati, zero errori**. Restano gli avvisi preesistenti su eval del plugin note-properties e metadati Git della copia temporanea.
- Anteprima precedente non attiva: riavviata in background sulla porta libera 8082. Nessuna modifica manuale agli HTML generati o alla configurazione Quartz.
- Tre pagine verificate in sei viste Chrome, desktop 1440 x 1000 e mobile 390 x 844: HTTP 200, titoli e contenuti aggiornati, nessun overflow del documento, errore JavaScript o risposta HTTP fallita. Otto blocchi code larghi su mobile, tutti scorribili; nessuno su desktop. Tabella degli store leggibile fino all'ultima colonna.
- Ispezionati sei screenshot: Context desktop/codice mobile, State Management Esterno desktop/tabella mobile, Derived state testo/codice mobile. Usato scorrimento immediato e margine per la testata fissa per fotografare le sezioni corrette. Browser QA chiuso; anteprima disponibile su http://localhost:8082/appunti/. QA distinta dai test degli esempi.

## 2026-10-15 - React: Routing, Cache e Validazione

### Perimetro

Lette integralmente e corrette React Router, Data Fetching e Cache e Validazione Dati. Completato Routing, Data Fetching e Form: Gestione Moduli era gia revisionata. **21 note React uniche su 59, 38 ancora da esaminare**. Conservati percorsi, tipo tecnico, data originaria, publish e status non revisionato; aggiunti prerequisiti, collegamenti e fonti. Nessuna nuova pagina o modifica necessaria all'indice.

| Nota                                                                         | Correzioni                                                                                                                                                                                                                                                                                    |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/React/Pagine/React Router\|React Router]]                   | Distinte modalita, major e import; demo completo Data Mode con file JSON statico, layout/Outlet, query URL, loader, error boundary e fallback iniziale. Distinti percorso sconosciuto, record assente e 404 HTTP; segnalati requisiti di hosting e limiti client.                             |
| [[Programmazione/React/Pagine/Data Fetching e Cache\|Data Fetching e Cache]] | Sostituiti frammenti con dipendenze implicite e fetch senza gestione degli errori. Chiavi, stati v5, staleTime/gcTime e signal; frontend completo con contratto HTTP esplicito, aggiornamento ottimistico, rollback e riconciliazione. Backend non incluso e concorrenza limitata dichiarati. |
| [[Programmazione/React/Pagine/Validazione Dati\|Validazione Dati]]           | Rimosso il falso criterio email basato solo su @. Zod 4, input/output, coercion e campi sconosciuti; form completo con errori, focus, reset e testo normalizzato. Vincoli fra campi e schema API, distinti da sanitizzazione e autorizzazione.                                                |

### Fonti e prove

- Consultate fonti primarie React Router, TanStack Query, Zod e MDN. Verificati requisiti e versioni npm: Router 8.4.0, Query 5.104.3 e Zod 4.6.7, aggiunti solo alla toolchain temporanea esterna. React 19.3.0, Node 24.14.0 e Chrome 155.0.8059.79. Nessuna modifica alle dipendenze Quartz.
- **227 test React superati** nella regressione seriale: 166 precedenti e 61 nuovi, di cui 11 Node e 50 Chrome (25 sviluppo, 25 produzione). Esempi estratti dal Markdown, bundle in memoria con NODE_ENV esplicito e Strict Mode; precedenti build Vite rieseguite.
- Node: sintassi, parser task, copie, schema profilo e limiti, errori Zod, range, object/strict/loose, coercion distinta da validazione; QueryClient su chiavi equivalenti, deduplicazione, freschezza e invalidazione di query inattive.
- Browser/router: filtri e history, deep link/reload, errori di percorso/record/input/HTTP/JSON/schema, vuoto, navigazione cancellata e parser utenti. Il server locale fornisce il fallback SPA, senza presumere che ogni hosting lo faccia.
- Browser/query: GET e PATCH reali verso la fixture loopback. Verificati pending/vuoto/errori/retry, refetch con vecchi dati, risposta autorevole, rollback, refetch fallito e salvataggio riuscito prima di un errore. ID codificati, payload e ID di risposta, cancellazione allo smontaggio. Gate di risposta controllati, senza backend esterno.
- Le prime prove usavano check() come se il cambiamento della checkbox fosse sincrono; aggiornato il test a click e attesa della transizione, coerentemente con l'await di cancelQueries. Nessuna modifica dell'algoritmo per aggirare la prova.
- Browser/form: messaggi e focus, riferimenti ARIA, Enter, input distinto da output, testo non interpretato come HTML, reset e istanze indipendenti. Browser/server chiusi e cache Node ripulita; README aggiornato.

### Limiti e seguito

Non eseguiti action/fetcher, Framework Mode, SSR/hydration, HashRouter/basename, migrazione di un'app esistente, deploy remoto, lint/type checking o matrice browser. Nessuna verifica completa di offline, GC, polling, persistenza o scritture concorrenti; il backend dei test non certifica sicurezza/autorizzazione/idempotenza di un servizio reale. Resolver RHF, validazione async, conferma email e audit completo di accessibilita non implementati. Suite JavaScript non rieseguita.

Prossimo blocco: Component Patterns, con Compound Components Pattern, Control Props e State Reducer Pattern, Portals ed Error Boundaries. Il punto gia segnalato su SSR e SSG resta aperto fino al relativo blocco. Le note restano non revisionate fino al controllo dell'utente; nessun commit, push o deploy remoto.

### Verifica del vault

- content:check con report: **911 documenti raggiungibili, zero errori, 576 avvisi editoriali**. Gli avvisi non equivalgono automaticamente a errori tecnici.
- content:test: **9 test superati**, distinti dalle prove degli esempi React.
- Build Quartz: **3.719 file emessi, 2.003 HTML, 168 redirect, 135.710 riferimenti verificati e zero errori**. Restano gli avvisi preesistenti su eval nel plugin note-properties e metadati Git della copia temporanea.
- Anteprima sulla porta 8082 non piu attiva: riavviata in background sulla porta libera. Nessun intervento sugli HTML generati o sulla configurazione Quartz.
- Verificate tre pagine in sei viste Chrome, 1440 x 1000 e 390 x 844: HTTP 200, titoli/contenuti aggiornati, nessun errore JavaScript, risposta HTTP fallita o overflow del documento. Sei blocchi code larghi su mobile e uno su desktop, tutti scorribili; quattro tabelle controllate fino all'ultima colonna.
- Ispezionati otto screenshot: Router desktop e tabella mobile, due tabelle e codice mobile di Data Fetching, testo/codice/tabella mobile di Validazione. Browser QA chiuso; anteprima disponibile su http://localhost:8082/appunti/. QA Quartz distinta dai test degli esempi.

## 2026-10-15 - React: Component Patterns

### Perimetro

Lette integralmente e corrette Compound Components Pattern, Control Props e State Reducer Pattern, Portals ed Error Boundaries. **25 note React uniche su 59, 34 ancora da esaminare**. Conservati percorsi, data originaria, tipo tecnico, publish e status non revisionato. Indice gia completo per questo blocco; nessun nuovo percorso o redirect.

| Nota                                                                                                         | Correzioni                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [[Programmazione/React/Pagine/Compound Components Pattern\|Compound Components Pattern]]                     | Frammenti incompleti sostituiti con accordion completo: Context, guard, ID, pulsanti nativi, pannelli nascosti, contratto delle parti e tastiera. Distinte tabs, composizione, controlled e conservazione dello stato.               |
| [[Programmazione/React/Pagine/Control Props e State Reducer Pattern\|Control Props e State Reducer Pattern]] | Separati possesso dello stato, transizioni e markup. Toggle controlled/uncontrolled con richiesta al parent; reducer realmente collegato a useReducer, limite, reset e render prop completa. Nessun side effect nel reducer.         |
| [[Programmazione/React/Pagine/Portals\|Portals]]                                                             | Distinti albero React, DOM, CSS e modalita. Target client con placeholder SSR, demo Context/eventi e dialog nativo con showModal, Escape, focus e cleanup. Eliminata la falsa equivalenza tra attributi ARIA e comportamento modale. |
| [[Programmazione/React/Pagine/Error Boundaries\|Error Boundaries]]                                           | Matrice dei limiti, effect e Actions di transition, fallback guasto e server. Classe completa con reporting, reset e demo di isolamento; gestione locale degli errori async previsti e distinzione da Suspense/router.               |

### Fonti e prove

- Consultate documentazioni primarie React, MDN e WAI-ARIA APG, collegate nelle note. React e React DOM 19.3.0, Node 24.14.0, Chrome 155.0.8059.79. Nessuna dipendenza nuova ne modifica ai package/lockfile Quartz.
- **281 test React superati**, inclusi **54 nuovi**: 10 Node e 44 Chrome, 22 per ambiente. Quattro gruppi controllano solo la sintassi; quattro prove server/statiche e due reducer verificano i comportamenti selezionati. Bundle in memoria, NODE_ENV development/production esplicito, Strict Mode e regressione dei sei file precedenti con relative build Vite.
- Accordion: guard, ID/ARIA, tastiera, apertura unica, bozza mantenuta nel pannello nascosto, valore iniziale contro nuova key, gruppi indipendenti e provider annidati.
- Control Props: false controllato, richiesta accettata/rifiutata, default contro key, callback una volta per click e nessun submit. Reducer puro, limite applicato anche a dispatch diretti, reset e quattro azioni nel medesimo batch.
- Portal: posizione DOM, Context, bubbling React distinto da un listener DOM nativo, target mancante e cleanup. Render server senza document e hydration reale del placeholder senza mismatch, limitata a questo wrapper.
- Dialog: nome accessibile, stato nativo modale, focus iniziale, Tab, focus esterno impedito, Escape, annullamento, conferma, ritorno del focus, riapertura e smontaggio anche in Strict Mode.
- Error Boundary: isolamento e reset con perdita dello stato interno, fallimento ripetuto se la causa persiste, errori di effect e Action async, fallback guasto intercettato dal superiore. Eventi/timer producono gli errori browser esattamente previsti e non un fallback. Classe non efficace nel render server. SaveButton prova pending, rifiuto gestito e retry con Promise controllata, non HTTP reale.
- Errori attesi confrontati per messaggio; errori inattesi di console, pagina, root, hydration e HTTP fanno fallire i test. Nessuna assunzione sul numero fisso di chiamate a render/report in Strict Mode. Server e browser chiusi; README aggiornato.

### Limiti e seguito

Non eseguiti audit screen reader, matrice browser, scroll locking, positioning di menu/tooltip, target rimosso dinamicamente, controlled combinato con reducer, streaming SSR/RSC, boundary di framework/router, lazy/use con Promise o servizio remoto di osservabilita. Niente lint/type checking o audit di sicurezza. Il test di hydration riguarda soltanto il placeholder di ClientPortal; non risolve il punto aperto sulla nota SSR e SSG. Suite JavaScript non rieseguita.

Prossimo blocco: UX e Accessibilita, con WAI-ARIA, Focus Management, Animazioni e Micro-interazioni e Internazionalizzazione. Le note restano non revisionate fino al controllo dell'utente. Nessun commit, push o deploy remoto.

### Verifica del vault

- content:check con report: **911 documenti raggiungibili, zero errori, 572 avvisi editoriali**. Riduzione di quattro avvisi rispetto al blocco precedente; non e una certificazione tecnica di tutte le note.
- content:test: **9 test superati**, distinti dai 281 test React.
- Build Quartz: **3.719 file emessi, 2.003 HTML, 168 redirect, 135.751 riferimenti verificati e zero errori**. Restano gli avvisi preesistenti su eval nel plugin note-properties e metadati Git della copia temporanea.
- Anteprima gia attiva sulla porta 8082, riutilizzata senza avviare un secondo server. Nessuna modifica manuale agli HTML o alla configurazione Quartz.
- Verificate quattro pagine in otto viste Chrome, 1440 x 1000 e 390 x 844: HTTP 200, titoli/contenuti aggiornati, nessun errore JavaScript, HTTP fallito o overflow del documento. Sette blocchi di codice larghi su mobile, tutti scorribili; tre tabelle leggibili senza larghezza oltre il viewport.
- Ispezionati otto screenshot: quattro aperture desktop e tre tabelle piu codice/testo dei portal su mobile. Browser QA chiuso; anteprima disponibile su http://localhost:8082/appunti/. La QA Quartz non esegue gli esempi React, gia verificati dalla suite separata.

## 2026-10-15 - React: UX e Accessibilita

### Perimetro

Lette integralmente e corrette WAI-ARIA, Focus Management, Animazioni e Micro-interazioni e Internazionalizzazione. **29 note React uniche su 59, 30 ancora da esaminare**. Nessuna nuova pagina: mantenuti percorsi, date originarie, publish e status non revisionato; l'indice gia collega tutte le note. Aggiunti prerequisiti, fonti e collegamenti pertinenti senza duplicare il dialog completo gia presente in Portals.

| Nota                                                                                           | Correzioni                                                                                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/React/Pagine/WAI-ARIA\|WAI-ARIA]]                                             | Distinti ruolo, comportamento, nome e descrizione. Tabella degli attributi e limiti di aria-hidden/disabled, disclosure e form completi, ID univoci, messaggi di errore e live region. Eliminato il frammento di dialog presentato senza comportamento. |
| [[Programmazione/React/Pagine/Focus Management\|Focus Management]]                             | Il precedente input non era un dialog. Ora editor inline con focus dopo commit e ripristino, gestione di Escape, skip link e CSS; distinti tabindex, inert, roving tabindex, aria-activedescendant e focus di navigazione.                              |
| [[Programmazione/React/Pagine/Animazioni e Micro-interazioni\|Animazioni e Micro-interazioni]] | CSS completo con preferenza ridotta mirata; Motion con AnimatePresence, key stabile, uscita inerte e annunci separati; React Spring con molla e politica reduced motion. Distinti lifecycle logico/visivo, proprieta e limiti prestazionali.            |
| [[Programmazione/React/Pagine/Internazionalizzazione\|Internazionalizzazione]]                 | Factory e risorse indipendenti, provider e bootstrap completi, plurali/fallback, gestione cambio lingua, lang/dir. Distinti locale, valuta, fuso, date senza ora, escaping JSX, limiti backend/SSR e variazioni Intl tra runtime.                       |

### Fonti e prove

- Consultate fonti primarie React, MDN, WAI-ARIA APG, Motion, React Spring e i18next/react-i18next. Verificate versioni e peer dependencies dal registro npm: Motion 14.2.0, Spring Web 10.1.2, i18next 26.4.5, react-i18next 17.0.16 e axe-core 4.14.0 installati solo nella toolchain temporanea esterna. Nessuna modifica alle dipendenze Quartz.
- **328 test React superati** nella regressione completa: 281 precedenti e **47 nuovi**, di cui 11 Node e 36 Chrome (18 per ambiente). React/React DOM 19.3.0, Node 24.14.0 e Chrome 155.0.8059.79. Quattro gruppi sono controlli di sola sintassi; i test funzionali estraggono il codice dai Markdown.
- ARIA: attivazione nativa da tastiera, hidden e tabulazione, stato conservato, due istanze senza collisioni; form con label, descrizioni, errore, stato e testo escapato.
- Focus: mount senza sottrarre focus, apertura, salvataggio con Enter, annullamento/Escape e ritorno al pulsante, bozza scartata, render non invasivo, skip link. IME provato con evento sintetico, non con un metodo di input reale.
- Animazioni: CSS hover/transition/focus e variante ridotta; Motion con uscita mantenuta nel DOM, inert/aria-hidden, rimozione e riapertura; Spring nei due regimi con valori finali e cleanup. Prove funzionali, non benchmark o misure di fluidita.
- i18n: factory isolata anche per risorse mutabili, plurali 0/1/2/1000000, fallback/chiavi mancanti, valuta e fuso espliciti, interpolazione sicura come testo. Bootstrap reale e reload senza persistenza, lang/dir e cleanup, orario Rome anche con browser America/Los_Angeles. Pending/errore/retry simulati, senza backend remoto.
- Corrette due assunzioni del banco di prova: il runtime Node non raggruppava il numero italiano a quattro cifre; il mock di changeLanguage installato dopo il mount non sostituiva il metodo nel wrapper di useTranslation. Mock anticipato, stato disabled atteso e nota aggiornata sulle variazioni di formattazione. Nessuna modifica del codice applicativo per aggirare i test.
- Dodici scansioni axe su stati selezionati, tag WCAG 2 A/AA e 2.1 A/AA, senza violazioni rilevate. Non sono una certificazione di conformita. Solo l'avviso noto Motion sulla preferenza ridotta e ammesso nei test dedicati; altri errori console/pagina/HTTP falliscono la suite.
- Server/browser di test chiusi, bundle in memoria; README aggiornato. La regressione include le build Vite precedenti; il nuovo blocco usa esbuild e CSS estratto dalle note.

### Limiti e seguito

Nessun screen reader reale, audit normativo, dispositivo touch o matrice browser. Non coperti integralmente zoom/forced colors, IME reale, focus di route, widget compositi, drag, layout animation, Web Animations/View Transitions o cambi di preferenza durante l'uscita. Niente backend di traduzioni, persistenza, SSR/hydration, UI RTL completa, Trans/ICU o copertura di tutti i locale/plurali/fusi. Il render statico non certifica SSR. Suite JavaScript non rieseguita.

Proseguire con Performance e Internals, saltando le note gia revisionate richiamate anche in quel blocco. Il punto aperto su SSR e SSG resta per il relativo capitolo. Le note rimangono non revisionate fino al controllo dell'utente; nessun commit, push o deploy remoto.

### Verifica del vault

- content:check con report: **911 documenti raggiungibili, zero errori, 569 avvisi editoriali**. Tre avvisi in meno; gli avvisi non corrispondono automaticamente a inesattezze tecniche.
- content:test: **9 test superati**, distinti dai test React.
- site:build: **3.719 file generati, 2.003 HTML, 168 redirect e 135.797 riferimenti verificati, zero errori**. Restano gli avvisi preesistenti relativi a `eval` in `note-properties` e ai metadati Git non disponibili nella copia temporanea.
- Riutilizzata l'anteprima gia attiva su http://localhost:8082/appunti/: quattro note controllate in **otto viste desktop/mobile e dieci screenshot**, senza errori di caricamento o overflow del documento. Verificati 14 blocchi di codice larghi e scorribili su mobile, uno su desktop e quattro tabelle, incluse le ultime colonne dopo lo scorrimento. Browser QA chiuso; anteprima lasciata attiva.
- La verifica grafica di Quartz e distinta dai test degli esempi React e dalle scansioni axe: non certifica l'accessibilita completa e non sostituisce prove con screen reader reali.

## 2026-10-15 - React: Performance e Internals, Primo Blocco

### Perimetro

Lette integralmente e corrette Virtual DOM, Fiber Architecture e Concurrent Mode, Batching e React Compiler. **33 note React uniche su 59, 26 ancora da esaminare**. Profiler e Debugging e useMemo e useCallback erano gia revisionate: non vengono ricontate. Nessuna nuova nota o modifica di percorsi; YAML, date originarie, publish e status non revisionato conservati. L'indice gia collega tutte le pagine.

| Nota                                                                                                       | Correzioni                                                                                                                                                                                                                                                            |
| ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/React/Pagine/Virtual DOM\|Virtual DOM]]                                                   | Distinti elementi React, Fiber, render, riconciliazione, commit e paint. Demo completo di riordino delle righe con bozze, ID, reset intenzionale e immutabilita; identita locale al parent, key diversa da prop e limiti delle ottimizzazioni.                        |
| [[Programmazione/React/Pagine/Fiber Architecture e Concurrent Mode\|Fiber Architecture e Concurrent Mode]] | Terminologia storica e dettagli interni separati dalle API pubbliche. Scheduling cooperativo, commit sincrono, assenza di parallelismo automatico; ricerca completa con input urgente, risultati memoizzati e transition, senza promettere una velocita non misurata. |
| [[Programmazione/React/Pagine/Batching\|Batching]]                                                         | Raggruppamento non equivalente a una sola chiamata al render. Coda, ordine degli updater/sostituzioni, snapshot e confini async; demo osservabile e integrazione flushSync con focus, costi e limiti espliciti.                                                       |
| [[Programmazione/React/Pagine/React Compiler\|React Compiler]]                                             | Config Vite 8/plugin-react 6 realmente provato, annotation/infer/opt-out, runtime per versione. Catalogo completo, verifica dell'output generato e confronto con baseline non compilata; lint, correttezza e vantaggi prestazionali distinti.                         |

### Fonti e prove

- Documentazioni primarie React e sorgente Fiber al tag 19.3.0; fonti storiche React 18 chiaramente identificate. Versioni npm verificate dopo il fallimento DNS della lettura nel sandbox: Compiler 1.0.0, plugin-babel 0.2.4 e Babel core 7.29.0 installati solo nella toolchain temporanea esterna. Package/lockfile Quartz invariati.
- **359 test React superati**, inclusi **31 nuovi**: nove Node/toolchain e 22 Chrome (11 development e 11 production). Quattro gruppi sono soltanto controlli di sintassi. React/React DOM 19.3.0, Vite 8.3.4, plugin-react 6.1.2, Node 24.14.0 e Chrome 155.0.8059.79.
- Test sul codice estratto dai Markdown: identita DOM, bozze e key, rimozione/rimontaggio, filtro locale e transition, coda dello stato e snapshot, ref/focus con flushSync. I probe Promise/timer sono fixture dichiarate e controllano i commit, non un numero imposto di render.
- Compilazione Babel reale con ispezione AST, annotation/infer e opt-out, confronto del markup originale/compilato con props congelate e testo escapato. Config della nota usato in build Vite e sviluppo; verificata presenza della trasformazione e catalogo funzionante anche nella baseline con opt-out.
- Prima esecuzione bloccata dalla junction dell'intera node_modules su Windows: sostituita con link ai singoli pacchetti. Nella seconda, 28/31 prove riuscite; corrette assunzioni dei test sugli helper generati dal Compiler e sulla visibilita di un ul vuoto. Nessuna modifica al codice applicativo per aggirare i test. Nuova suite e regressione completa poi riuscite.
- NODE_ENV esplicito e Strict Mode. Errori console/pagina/HTTP inattesi fanno fallire i test. Server/browser chiusi, fixture temporanea rimossa dopo verifica del percorso e scollegamento delle junction. README aggiornato.

### Limiti e seguito

Nessun benchmark di fluidita o latenza, prova esaustiva dello scheduler/lanes, richieste HTTP nel demo di ricerca o certificazione di accessibilita. Non verificati gating, compiler per librerie pubblicate, React 17/18, SSR/hydration/RSC o nuove regole ESLint. La suite JavaScript non e stata rieseguita; il punto aperto su SSR e SSG resta nel capitolo relativo.

Proseguire con Virtualizzazione delle liste e Suspense e Lazy Loading, prima dei contenuti server-side. Le note restano non revisionate fino al controllo dell'utente. Nessun commit, push o deploy remoto.

### Verifica del vault

- content:check con report: **911 documenti raggiungibili, zero errori, 566 avvisi editoriali**, tre in meno del blocco precedente. Gli avvisi non certificano la correttezza tecnica.
- content:test: **9 test superati**, distinti dai test React.
- QA Quartz sulle quattro note in **otto viste**, desktop 1440 x 1000 e mobile 390 x 844: HTTP 200, titoli e testo aggiornati, nessun errore JavaScript/HTTP o overflow del documento. Otto blocchi di codice larghi su mobile e uno su desktop, tutti scorribili; quattro tabelle entro il viewport. **Dieci screenshot ispezionati**, incluse le tabelle e due esempi su mobile.
- Riutilizzata l'anteprima esistente sulla porta 8082 senza avviare un altro server. Browser QA chiuso; anteprima lasciata attiva. La QA del sito non esegue gli esempi React: questi sono verificati dalla suite separata.
- Build finale, inclusa l'ultima precisazione sull'opt-out del Compiler: **3.719 file generati, 2.003 HTML, 168 redirect e 135.849 riferimenti verificati, zero errori**. Restano gli avvisi preesistenti su eval nel plugin note-properties e metadati Git della copia temporanea. Nessuna modifica manuale agli HTML generati.

## 2026-10-15 - React: Virtualizzazione e Suspense

### Perimetro

Lette integralmente e corrette Virtualizzazione delle liste e Suspense e Lazy Loading, completando Performance e Internals. **35 note React uniche su 59, 24 ancora da esaminare**. Suspense compare anche nel capitolo successivo, ma viene contata una sola volta. Nessuna nuova nota o modifica dei percorsi; date originarie, publish e status non revisionato conservati. L'indice collega gia entrambe le note.

| Nota                                                                                       | Correzioni                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/React/Pagine/Virtualizzazione delle liste\|Virtualizzazione delle liste]] | Sostituito il frammento incompleto con FixedSizeList v1 con esempi TanStack Virtual versionati e completi: lista fissa e misurata, CSS, ID, overscan e scroll. Distinti windowing, fetch/paginazione e Virtual DOM; chiariti perdita dello stato, focus, DOM parziale e limiti di stampa/ricerca/accessibilita. |
| [[Programmazione/React/Pagine/Suspense e Lazy Loading\|Suspense e Lazy Loading]]           | Separati bundler, import, lazy, fallback ed error boundary. Pannello completo con stato, CSS e controlli esterni; cache del codice diversa dallo stato, import non cancellato dalla chiusura, rifiuto memorizzato e limiti del reset/reload. Chiariti effect, Promise compatibili, transition e limiti server.  |

### Fonti e prove

- Consultate le documentazioni primarie React, TanStack Virtual, react-window, Vite e MDN. Verificata la dipendenza TanStack React Virtual 3.14.20 e installata soltanto nella toolchain temporanea esterna, senza cambiare package/lockfile Quartz.
- **388 test React superati**, 359 precedenti e **29 nuovi**: cinque Node/toolchain, di cui due controlli di sola sintassi, e 24 Chrome, 12 development e 12 production. React/React DOM 19.3.0, Vite 8.3.4, plugin-react 6.1.2, Node 24.14.0 e Chrome 155.0.8059.79. Codice e CSS estratti dai Markdown, NODE_ENV esplicito e Strict Mode.
- Virtualizzazione: 5.000 record con meno di 50 righe montate, geometria fissa, Inizio/Fine, PageDown e focus, riordino per ID, riduzione del dataset dal fondo, svuotamento e ripristino. Righe misurate con testi diversi, resize a 390 px e assenza di sovrapposizioni fino all'ultimo record.
- Suspense: probe con Promise controllate per risoluzione/rifiuto, loader invocato una volta anche dopo reset del boundary, bozza persa dopo unmount, boundary annidati e attesa gestita in effect che non sospende. Rafforzata l'attesa del reset e registrato il listener di risposta prima di sbloccare l'import, evitando assunzioni temporali nel banco di prova.
- Build Vite reale con manifest e chunk separata non precaricata dall'HTML. Import del pannello solo all'apertura, cache al successivo mount, titolo parent conservato e bozza scartata. Ritardo tramite Playwright: fallback, controlli utilizzabili, chiusura senza annullamento e riapertura sullo stesso caricamento.
- Errore di valutazione del modulo simulato con JavaScript HTTP 200: isolamento nel boundary, riapertura ancora fallita e reload esplicito riuscito solo dopo rimozione del guasto. Reload perde lo stato non persistito. Non e una prova di ogni errore HTTP o di un deploy reale.
- Quattro nuove scansioni axe e dodici ripetute dal blocco UX senza violazioni rilevate negli stati selezionati; non equivalgono a conformita completa. Errori inattesi di pagina, HTTP o console fanno fallire le prove; ammesso solo il messaggio dell'errore di modulo intenzionale nei due casi dedicati.
- Server/browser chiusi, fixture rimosse dopo verifica dei percorsi e scollegamento delle junction. README dei test aggiornato; suite JavaScript non rieseguita.

### Limiti e seguito

Nessun benchmark, screen reader reale, matrice browser, widget virtualizzato interattivo, griglia o backend di infinite loading. Non collaudati cambi di altezza da immagini/font, tutte le politiche cache/CDN, deploy obsoleti reali, retry automatici, SSR streaming, hydration o RSC. Le due prove statiche non certificano SSR. La nota distingue esplicitamente il demo da una soluzione completa di accessibilita o distribuzione.

Proseguire con Server Components e SSR e SSG nel blocco React Moderno e Server-Side; conservato il punto aperto su SSR e SSG. Note non revisionate fino al controllo dell'utente, nessun commit, push o deploy remoto.

### Verifica del vault

- content:check con report: **911 documenti raggiungibili, zero errori, 564 avvisi editoriali**, due in meno. Il rapporto non certifica la correttezza tecnica di tutte le note.
- content:test: **9 test superati**, separati dai test degli esempi React.
- Build Quartz: **3.719 file generati, 2.003 HTML, 168 redirect e 135.897 riferimenti verificati, zero errori**. Restano gli avvisi preesistenti su eval in note-properties e metadati Git della copia temporanea.
- Due note controllate in **quattro viste** (1440 x 1000 e 390 x 844), con HTTP 200, titolo/contenuto aggiornato e nessun errore JavaScript/HTTP o overflow del documento. Dieci blocchi di codice larghi su mobile, tutti scorribili; tabella Virtualizzazione entro il viewport e tabella Suspense scorribile fino all'ultima colonna. **Sei screenshot ispezionati**, comprese tabelle e codice su mobile.
- Riutilizzata l'anteprima su http://localhost:8082/appunti/ e chiuso il browser QA. Anteprima lasciata attiva; nessuna modifica manuale agli HTML generati. La QA Quartz non esegue gli esempi React, verificati nella suite separata.

## 2026-10-15 - React: Server Components, SSR e SSG

### Perimetro

Lette integralmente e corrette Server Components e SSR e SSG, primo blocco di React Moderno e Server-Side. **37 note React uniche su 59, 22 ancora da esaminare**. Chiusa la segnalazione precedente su SSR e SSG: prestazioni/SEO non migliorano automaticamente e hydration non e obbligatoria per ogni pagina renderizzata sul server. Nessuna nuova nota o modifica dei percorsi; date, tipo teorico, publish e status non revisionato conservati. Indice gia completo per queste pagine.

| Nota                                                                 | Correzioni                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/React/Pagine/Server Components\|Server Components]] | Distinti RSC, SSR e Client Components prerenderizzati; confine degli import diverso dalla composizione JSX, serializzazione non limitata a JSON e output server comunque divulgabile. Progetto Next completo con catalogo pubblico, guard server-only, componenti composti e CSS; Server Functions/Actions e requisiti delle mutazioni separati dal demo di sola lettura. |
| [[Programmazione/React/Pagine/SSR e SSG\|SSR e SSG]]                 | Corretti benefici e hydration implicita; contratti delle API React, mismatch, cache/errori/CSP e limiti dell'hosting statico. Route per richiesta con connection, streaming osservabile con ritardo didattico ed export alternativo del catalogo, senza confondere RSC e HTML.                                                                                            |

### Fonti e prove

- Documentazioni ufficiali React e Next consultate per direttive, serializzazione, sicurezza, rendering, streaming ed export. Next 16.4.1 e server-only 0.0.1 verificati/installati solo nella toolchain temporanea esterna; nessuna modifica a package/lockfile Quartz.
- **410 test React superati**, inclusi **22 nuovi**: sei Node/API, sei build/HTTP e dieci Chrome. Due gruppi sono di sola sintassi. Next 16.4.1, dipendenze React/React DOM 19.3.0, Node 24.14.0 e Chrome 155.0.8059.79; codice estratto dai Markdown.
- Tre build Next Webpack: catalogo con route live/stream, export statico e variante negativa con import del catalogo in un modulo client. Manifest controllato, server avviato con la CLI next start; export servito da HTTP Node senza runtime Next.
- Catalogo: proiezione pubblica, copie indipendenti, prezzo e testo escapato. Il test unitario neutralizza il marker server-only; il guard vero viene controllato nella build negativa, leggendo gli errori strutturati di Webpack tramite plugin della sola fixture negativa. HTML e bundle client privi dei marcatori interni del demo, senza estendere il risultato a un audit generale dei segreti.
- SSR: documenti con ID differenti e policy privata/no-store; lettura degli ID con parse5. Browser con timestamp/ID coerenti dopo hydration, click locale senza nuova navigazione. Streaming HTTP non compresso con shell/fallback prima del dettaglio e successiva sostituzione nel browser: ordine verificato, non latenza o paint garantiti.
- Export: HTML generato e servito identico da server statico. Catalogo leggibile senza JavaScript; in entrambe le distribuzioni interazione dopo hydration, tastiera, ID ARIA, stato indipendente e reload. Mobile senza overflow e due scansioni axe senza violazioni rilevate negli stati scelti, non equivalenti a conformita completa.
- Probe React separati dal protocollo Next: renderToString/static markup non aspettano la sospensione; prerenderToNodeStream attende; hydrateRoot conserva il nodo compatibile e segnala/ricrea l'albero con mismatch intenzionale. Gli errori inattesi fanno fallire la suite; il mismatch usa onRecoverableError.
- Prima esecuzione 19/22: corretti tre controlli del banco di prova che assumevano un valore di attributo e stringhe precise nei log CLI. Diagnostiche di build ora strutturate e output dei figli raccolto fino a close. Seconda esecuzione e regressione completa riuscite, senza cambiamenti applicativi per aggirare i test.
- Processi/server/browser chiusi, fixture eliminate dopo verifica dei percorsi e scollegamento delle junction. Avvisi Next su cache build assente e lockfile superiore ignorato non trattati come errori applicativi. README aggiornato; suite JavaScript non rieseguita.

### Limiti e seguito

Non provati Next in sviluppo/Turbopack, Server Functions/Actions, mutazioni, database, sessioni/autorizzazioni, ISR, CDN, CSP, disconnessioni/abort delle query, basePath o percorsi dinamici esportati. Il comando Python della nota non viene eseguito: il server statico della fixture e Node. Nessun benchmark, screen reader reale, matrice browser o audit completo di sicurezza/accessibilita.

Proseguire con Actions e form actions e useActionState. Le note restano non revisionate fino al controllo dell'utente; nessun commit, push o deploy remoto.

### Verifica del vault

- content:check con report: **911 documenti raggiungibili, zero errori, 563 avvisi editoriali**, uno in meno. Non e una certificazione della correttezza tecnica dell'intero vault.
- content:test: **9 test superati**, distinti dai test React.
- Build Quartz: **3.719 file generati, 2.003 HTML, 168 redirect e 135.941 riferimenti verificati, zero errori**. Restano gli avvisi preesistenti su eval nel plugin note-properties e metadati Git della copia temporanea.
- Due note controllate in **quattro viste**, desktop 1440 x 1000 e mobile 390 x 844: HTTP 200, titoli/contenuti aggiornati, nessun errore JavaScript/HTTP o overflow del documento. Dieci blocchi di codice larghi su mobile, tutti scorribili; entrambe le tabelle entro il viewport. **Sei screenshot ispezionati**, comprese tabelle e codice mobile.
- La prima apertura dell'anteprima ha restituito connessione rifiutata: server non piu attivo. Riavviato preview-site.mjs in background senza finestra, PID 7472, porta 8082; QA successiva riuscita. Browser QA chiuso, anteprima lasciata disponibile su http://localhost:8082/appunti/. Nessuna modifica manuale agli HTML generati; verifica Quartz distinta dai test applicativi.

## 2026-10-16 - React: Actions e useActionState

### Perimetro

Lette integralmente e corrette Actions e form actions e useActionState. **39 note React uniche su 59, 20 ancora da esaminare**. Nessuna nuova pagina o modifica dei percorsi; indice gia completo. Conservati data originaria, tipo, publish e status non revisionato; aggiunti prerequisiti, collegamenti e fonti ufficiali.

| Nota                                                                           | Correzioni                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/React/Pagine/Actions e form actions\|Actions e form actions]] | Distinti evento, URL HTML, Action client e Server Function; corretti firme, pending nei discendenti, reset e limiti dell'hosting statico. Esempio completo con due submitter, trasformazione locale, risultato e reset intenzionale; eliminata la dipendenza da una API non definita.                                               |
| [[Programmazione/React/Pagine/useActionState\|useActionState]]                 | Sostituito il falso login riuscito con una demo locale esplicita. Validazione, conferma e bozza separate, input controllato per conservare il testo, pending/readOnly, rifiuto previsto ed eccezione. Aggiunto contatore per la coda sequenziale; precisati reset/key, dispatch fuori Action, error boundary e ambito di permalink. |

### Fonti e prove

- Consultate documentazioni primarie React, React DOM, MDN e Next.js. Nessuna nuova dipendenza: usata la toolchain esterna esistente. I demo sono client-only, non implementazioni di Server Functions o autenticazione.
- **444 test React superati**, 410 precedenti e **34 nuovi**. La nuova suite comprende 13 Node/toolchain (due gruppi di sola sintassi), 11 Chrome development e 10 production. React/React DOM 19.3.0, Node 24.14.0, Chrome 155.0.8059.80; bundle esbuild con NODE_ENV esplicito e Strict Mode.
- Codice estratto dai Markdown: validazione di stringhe/File/null, normalizzazione, stato congelato, rifiuto previsto ed eccezione propagata. Eseguiti i servizi locali con i ritardi didattici originali; nessuna API remota.
- Browser: dati del pulsante submit, pending, disabilitazione dopo raccolta dati, reset al termine e invio successivo. Confermato che un errore restituito normalmente non impedisce il reset uncontrolled. Il form controllato mantiene bozza e ultima conferma; Svuota bozza non resetta il risultato. Provati anche Enter e viewport mobile.
- Probe dichiarati separatamente: formAction prevale, initialState non resetta dopo il dispatch ma key rimonta, tre azioni sequenziali usano i risultati precedenti; rigetto del primo cancella la coda e raggiunge il boundary. Il caso development fuori Action attende e verifica l'avviso intenzionale senza pending.
- Sei nuove scansioni axe su stati selezionati senza violazioni rilevate, non equivalenti a conformita completa. Errori inattesi console/pagina/HTTP fanno fallire la suite; i rigetti attesi usano onCaughtError. Prima esecuzione e regressione entrambe riuscite.
- Fixture e browser/server di test chiusi; eliminazione temporanea con verifica del percorso. Nessuna junction o installazione aggiuntiva. README aggiornato; suite JavaScript non rieseguita.

### Limiti e seguito

Non provati Server Functions/Actions, permalink o funzionamento senza JavaScript, mutazioni HTTP, database, autorizzazioni, concorrenza fra utenti, idempotenza, retry di rete o annullamento server. I callback differiti servono a controllare l'ordine, non sono un backend. Nessun benchmark, screen reader reale o matrice browser. Le prove di reset/coda sono comportamentali, non una certificazione di tutte le API React.

Proseguire con useOptimistic e useFormStatus. Note non revisionate fino all'approvazione dell'utente; nessun commit, push o deploy remoto.

### Verifica del vault

- content:check con report: **911 documenti raggiungibili, zero errori, 562 avvisi editoriali**, uno in meno. Non certifica la correttezza tecnica delle altre note.
- content:test: **9 test superati**, distinti dai test React.
- Build Quartz: **3.719 file generati, 2.003 HTML, 168 redirect e 135.993 riferimenti verificati, zero errori**. Restano gli avvisi preesistenti su eval nel plugin note-properties e metadati Git della copia temporanea.
- QA delle due note su desktop 1440 x 1000 e mobile 390 x 844: HTTP 200, titoli/contenuto aggiornati, nessun errore JavaScript/HTTP o overflow del documento. Quattro blocchi di codice larghi e due tabelle su mobile, tutti scorribili, comprese le ultime colonne.
- **Nove screenshot finali ispezionati**, con titoli desktop, tabelle mobile a entrambe le estremita e codice. Le prime catture desktop erano gia scorse: ripetute dopo scroll esplicito all'inizio, senza modificare il sito.
- Anteprima trovata spenta e riavviata in background senza finestra, PID 32996, su http://localhost:8082/appunti/. Browser QA chiusi, anteprima lasciata disponibile. Nessuna modifica manuale agli HTML generati; controlli Quartz distinti dall'esecuzione degli esempi.

## 2026-10-16 - React: useOptimistic e useFormStatus

### Perimetro

Lette integralmente e corrette useOptimistic e useFormStatus. **41 note React uniche su 59, 18 ancora da esaminare**. Nessun cambio di percorsi o nuove pagine; indice gia collegato. Conservati data originaria, tipo tecnico, publish e status non revisionato. Aggiunti prerequisiti, rimandi e fonti primarie.

| Nota                                                         | Correzioni                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/React/Pagine/useOptimistic\|useOptimistic]] | Distinti bozza, base e previsione; reducer puro, rebase e conferma effettiva nel parent. Demo completo di commenti con correlazione requestId, deduplicazione, risposta normalizzata, bozza conservata, rifiuto previsto e boundary per errori inattesi. Il ritorno al valore base non viene presentato come rollback del server. |
| [[Programmazione/React/Pagine/useFormStatus\|useFormStatus]] | Corretti import, ambito antenato, payload distinto dagli input correnti e pending distinto dall'esito. Demo completo con due form, controlli riusabili, validazione e stato del risultato. Precisati onSubmit, pulsanti esterni con form, metadati null a riposo e limiti di method come indicatore HTTP.                         |

### Fonti e prove

- Consultate documentazioni ufficiali React/React DOM e MDN; letto anche il codice React DOM 19.3.0 installato per i metadati dell'invio. Nessun aggiornamento delle dipendenze: toolchain esterna esistente.
- **483 test React superati**, 444 precedenti e **39 nuovi**: otto Node/toolchain (due gruppi di sola sintassi), 16 Chrome development e 15 production. React/React DOM 19.3.0, Node 24.14.0, Chrome 155.0.8059.80. Codice estratto dai Markdown, esbuild con NODE_ENV esplicito e Strict Mode.
- Commenti: reducer/merge con dati congelati, deduplicazione, FormData con null/File, controllo minimo della risposta e correlazione. Servizio didattico realmente eseguito con ritardo, normalizzazione e rifiuto tipizzato. Nel browser attesa visibile, nodo conservato per key, base aggiornata dal parent e bozza preservata; rifiuto e retry esplicito.
- Conferme esterne e aggiornamenti della lista durante l'attesa non vengono persi. Un record gia confermato non viene duplicato o eliminato per ripristinare una vecchia base. Il probe che ignora onConfirm dimostra la perdita della previsione anche dopo una risposta riuscita: non e il comportamento del demo completo.
- Form: due istanze con ID e dati distinti, Enter, pending del solo form inviato, input readOnly, risultato precedente preservato su errore di validazione. Gli errori inattesi raggiungono il boundary della fixture, non un falso successo.
- Probe separati: hook nello stesso componente e all'esterno senza contesto; attributo HTML form non trasferisce il contesto React. onSubmit async da solo non attiva pending. FormData conserva i dati inviati dopo una modifica del campo; action identifica anche formAction del pulsante. A riposo data/method/action null; nel client senza prop method, metadato get durante invio. Non viene dedotta una richiesta GET da questo valore.
- Setter ottimistico fuori Action provato con avviso atteso in sviluppo. Quattro nuove scansioni axe su stati selezionati senza violazioni rilevate, non una certificazione di accessibilita; nessun overflow dei demo a 390 px. Errori inattesi console/pagina/HTTP fanno fallire la suite.
- Prima esecuzione e regressione completa riuscite. Fixture rimosse dopo verifica dei percorsi; server e browser di test chiusi. Nessuna installazione o junction aggiuntiva; README aggiornato. Suite JavaScript non rieseguita.

### Limiti e seguito

Nessuna prova di Server Functions, mutazioni HTTP, database, autorizzazione, idempotenza, persistenza, offline, annullamento o concorrenza fra utenti. Servizi e conferme esterne sono locali o fixture controllate. Non sono un benchmark, una matrice browser o prove con screen reader reale. Il reducer opzionale senza secondo argomento e documentato; la sua forma con updater non e esercitata da questa suite.

Proseguire con use hook e Framework Next.js e Remix. Le note rimangono non revisionate fino all'approvazione dell'utente; nessun commit, push o deploy remoto.

### Verifica del vault

- content:check con report: **911 documenti raggiungibili, zero errori, 562 avvisi editoriali**, invariati. I controlli editoriali non certificano la correttezza tecnica delle altre note.
- content:test: **9 test superati**, distinti dalle prove React.
- Build Quartz: **3.719 file generati, 2.003 HTML, 168 redirect e 136.032 riferimenti verificati, zero errori**. Restano gli avvisi preesistenti su eval nel plugin note-properties e metadati Git della copia temporanea.
- QA delle due note su desktop 1440 x 1000 e mobile 390 x 844: HTTP 200, titoli e contenuto aggiornati, nessun errore JavaScript/HTTP o overflow del documento. Quattro blocchi di codice larghi su mobile, tutti scorribili; entrambe le tabelle rientrano nel viewport.
- **Sei screenshot finali ispezionati**, con titoli desktop, tabelle e codice mobile. Anteprima esistente riutilizzata su http://localhost:8082/appunti/ senza riavviarla; browser QA chiusi. HTML generati non modificati manualmente; verifiche Quartz distinte dai test degli esempi React.

## 2026-10-16 - React: use e framework

### Perimetro

Lette e corrette use hook e Framework Next.js e Remix. **43 note React uniche su 59, 16 ancora da esaminare**. Nessun cambio di percorsi, indici o redirect: le pagine erano gia raggiungibili. Conservati data, tipo, publish e status non revisionato; aggiunti prerequisiti, collegamenti e fonti ufficiali.

| Nota                                                                                 | Correzioni                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/React/Pagine/use hook\|use]]                                        | Distinti lettura, caricamento e cache; regole condizionali, identita della Promise, Suspense e boundary degli errori. Demo completo con evento, Promise stabile, retry e risposta tardiva; Context condizionale con label esplicita e variante browser() per React DOM 19.3. Precisati mancata cancellazione e confine RSC.     |
| [[Programmazione/React/Pagine/Framework Next.js e Remix\|Framework Next.js e Remix]] | Distinti Next App/Pages Router, React Router Data/Framework Mode e Remix v2 dal nuovo stack Remix. Confronto per requisiti, convenzioni URL e contratto loader/action. Progetto SSR completo con ricerca GET, dati pubblici, errori HTTP e progressive enhancement; limiti del deploy statico e rimandi ai demo Next esistenti. |

### Fonti e prove

- Consultate documentazioni ufficiali React/React DOM, Next, Remix e React Router, oltre ai requisiti npm di @react-router/dev 8.4.0. Letto l'entry point server predefinito installato per verificare la dipendenza isbot.
- **510 test React superati**, 483 precedenti e **27 nuovi** in react-use-framework.test.mjs: sette Node/toolchain, sette Chrome development, sette production e sei di integrazione router. Due test sono di sola sintassi. Node 24.14.0, React/React DOM 19.3.0, React Router 8.4.0, Vite 8.3.4, Chrome 155.0.8059.80. Regressione seriale completa in circa 217 secondi, prima della build Quartz; suite JavaScript non rieseguita.
- Eseguiti i tre moduli use estratti dalle note: risultato/attesa/rigetto, re-render senza nuova operazione, retry e risultato tardivo. Default/undefined/provider annidati, early return condizionale e aggiornamenti Context; browser() provato in SSR e client, senza sottoscrizione resize implicita.
- Build e server SSR router reali: GET filtrato, 400 per query duplicate, 404 URL e 405 POST senza action; campo interno assente da HTML e asset client. Ricerca, Enter, reload, Tutti e Indietro anche senza JavaScript. Pending reso osservabile ritardando una richiesta dati; documento conservato dopo hydration.
- Cinque scansioni axe su stati selezionati senza violazioni, non una certificazione; controllato overflow mobile dei demo Context/catalogo. Errori inattesi console/pagina/HTTP fanno fallire le prove browser.
- Prima build fallita per preparazione della fixture Windows; seconda per isbot mancante che induceva installazione implicita. Corretti pacchetti dichiarati e collegamenti della fixture, poi risolto il test della label rendendola esplicita. Esecuzione finale del blocco: 27/27.
- Aggiunti @react-router/dev e @react-router/serve 8.4.0 soltanto nella toolchain temporanea esterna; nessun package/lockfile Quartz modificato. Audit esterno: un low su @babel/core 7.29.0 gia presente (GHSA-4x5r-pxfx-6jf8), senza aggiornamenti forzati. Junction scollegate prima della rimozione verificata delle fixture; ripulita anche quella rimasta dalla prova fallita.

### Limiti e seguito

Non provati migrazione Remix, RSC del router, deploy remoto, mutazioni, autorizzazioni, persistenza, invalidazione distribuita, cache per utente o concorrenza backend. Le Promise del demo sono locali; il catalogo usa un server HTTP reale ma dati fissi. Confronto Next appoggiato alle note e prove server-rendering esistenti. Nessun benchmark, screen reader reale o matrice browser.

Proseguire con useTransition e useDeferredValue e Gestione della memoria e AbortController. Note non revisionate fino al controllo dell'utente; nessun commit, push o deploy remoto.

### Verifica del vault

- content:check con report: **911 documenti raggiungibili, zero errori, 561 avvisi editoriali**, uno in meno. Non certifica la correttezza tecnica delle altre note.
- content:test: **9 test superati**, separati dai test degli esempi.
- Build Quartz: **3.719 file generati, 2.003 HTML, 168 redirect e 136.087 riferimenti verificati, zero errori**. Invariati gli avvisi su eval nel plugin note-properties e metadati Git della copia temporanea.
- QA delle due pagine su desktop 1440 x 1000 e mobile 390 x 844: HTTP 200, titoli/contenuti aggiornati, nessun errore JavaScript/HTTP o overflow del documento. Entrambe le tabelle rientrano nel viewport; dieci blocchi di codice larghi su mobile hanno scorrimento orizzontale verificato nel contenitore code, non soltanto nel pre esterno.
- **Sei screenshot finali ispezionati**. La prima attesa QA cercava una stringa contigua nell'HTML evidenziato e non riconosceva il codice della pagina framework: ripetuto il controllo sul testo renderizzato, senza modificare gli HTML. Anteprima esistente riutilizzata su http://localhost:8082/appunti/ e lasciata disponibile; browser QA e processi dei demo chiusi.

## 2026-10-18 - React: concorrenza e gestione risorse

### Perimetro

Lette integralmente e corrette useTransition e useDeferredValue e Gestione della memoria e AbortController. **45 note React uniche su 59, 14 ancora da esaminare**. Percorsi, indice e redirect invariati; conservati data originaria, tipo, publish e status non revisionato. Aggiunti prerequisiti, collegamenti e fonti ufficiali.

| Nota                                                                                                               | Correzioni                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/React/Pagine/useTransition e useDeferredValue\|useTransition e useDeferredValue]]                 | Distinti scheduling, thread, debounce e cancellazione. Filtro spostato nel figlio memoizzato con props stabili, input urgente e due demo completi. Precisati callback immediata, initialValue, Actions dopo await, ordine delle risposte, Suspense e limiti di isPending.                                      |
| [[Programmazione/React/Pagine/Gestione della memoria e AbortController\|Gestione della memoria e AbortController]] | Separati risorse, obsolescenza e leak. Demo completo con loader locale, cancel, timeout e retry; guardia per risposte tardive, controller per tentativo, controllo HTTP/JSON/schema. Aggiunto esempio distinto di listener e timer; chiariti abort del corpo, motivi personalizzati e mancato rollback server. |

### Fonti e prove

- Consultate documentazioni primarie React/React DOM, MDN e Chrome DevTools; letta anche la nota useEffect per evitare una seconda spiegazione base. Nessuna nuova dipendenza, modifica infrastrutturale o installazione.
- Nuova suite react-concurrency-resources.test.mjs: **24/24 superati**, otto Node/toolchain (due di sola sintassi), otto Chrome development e otto production. React/React DOM 19.3.0, Node 24.14.0, Chrome 155.0.8059.80, esbuild 0.27.3; codice estratto dai Markdown, Strict Mode e NODE_ENV esplicito.
- Regressione seriale completa: **534 test React superati**, 510 precedenti e 24 nuovi, in circa 196 secondi. Nessun test fallito o saltato; suite JavaScript non rieseguita. Build Quartz avviata soltanto al termine della regressione.
- Provati filtro e schema, loader locale reale, ID/label SSR, profilo senza effect server, risultato vuoto, reset, errore, cancel e retry. La fixture del loader rende controllabili risposte fuori ordine, timeout e risoluzioni dopo annullamento/smontaggio.
- Probe API distinti dai demo: callback sincrona, transition pending con contenuto precedente e aggiornamento urgente; useDeferredValue con input nuovo e risultato vecchio finche la Promise corrente non e risolta.
- fetchProfile eseguito contro HTTP locale: URL codificata, 404/500, JSON/schema errati, annullamento durante lettura del corpo. Listener e timer verificati separatamente, incluso il ciclo extra Strict Mode. Non misurata la garbage collection.
- Quattro scansioni axe su stati selezionati senza violazioni e controllo overflow mobile, non una certificazione. Errori inattesi console/pagina/HTTP fanno fallire le prove. Server/browser chiusi, bundle in memoria; nessuna junction o fixture su disco aggiuntiva.

### Limiti e seguito

Non provati deadline, prestazioni, heap snapshot, carico, WebSocket, observer, cache condivise, autenticazione, mutazioni HTTP o rollback server. Il backend di test e locale e didattico; le Promise controllate non sono una rete reale. Nessuna matrice browser o prova con screen reader. Le API che ignorano signal non diventano cancellabili automaticamente.

Proseguire con Protezione XSS e Gestione Autenticazione, poi CSRF e Content Security Policy. Note non revisionate fino al controllo dell'utente; nessun commit, push o deploy remoto.

### Verifica del vault

- content:check con report: **911 documenti raggiungibili, zero errori, 559 avvisi editoriali**, due in meno. Non certifica le altre note.
- content:test: **9 test superati**, distinti dall'esecuzione degli esempi React.
- Build Quartz: **3.719 file generati, 2.003 HTML, 168 redirect e 136.141 riferimenti verificati, zero errori**. Restano gli avvisi preesistenti su eval nel plugin note-properties e metadati Git della copia temporanea.
- QA desktop 1440 x 1000 e mobile 390 x 844: HTTP 200, titoli ed esempi aggiornati, nessun errore JavaScript/HTTP o overflow del documento. Entrambe le tabelle rientrano nel viewport; quattro blocchi di codice larghi su mobile e uno su desktop hanno scorrimento effettivo verificato nel contenitore code.
- **Sei screenshot finali ispezionati**: due aperture desktop, due tabelle mobile e due esempi mobile. Anteprima trovata spenta; il primo riavvio durante la rigenerazione non ha trovato index.html. Riavviata dopo la creazione del file, verificata HTTP 200 e lasciata disponibile su http://localhost:8082/appunti/ (PID 30336). Browser QA chiusi; nessuna modifica manuale agli HTML.

## 2026-10-18 - React: XSS e autenticazione

### Perimetro

Lette integralmente e corrette Protezione XSS e Gestione Autenticazione. **47 note React uniche su 59, 12 ancora da esaminare**. Conservati data, tipo, status non revisionato e publish. Nessun cambio di percorsi, indici o redirect; aggiunti prerequisiti, collegamenti e fonti primarie.

| Nota                                                                             | Correzioni                                                                                                                                                                                                                                                                                                                          |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/React/Pagine/Protezione XSS\|Protezione XSS]]                   | Sostituita sanitizeHtml non definita con un modulo DOMPurify eseguibile. Distinti testo, HTML, props e URL; policy di otto tag senza attributi, allowlist di destinazione e limiti espliciti per SSR/Trusted Types. Rimandi alla teoria JavaScript senza duplicare un sanitizer manuale.                                            |
| [[Programmazione/React/Pagine/Gestione Autenticazione\|Gestione Autenticazione]] | Sostituiti bootstrap incompleto e API implicite con un contratto same-origin e client completo. Separati loading/anonimo/errore/logout; guardie contro risultati obsoleti, controllo HTTP/JSON/schema, retry e bozza rimossa al cambio identita. Corretti limiti di HttpOnly, token in memoria, route guard, CSRF, refresh e cache. |

### Fonti e prove

- Consultate fonti ufficiali React, DOMPurify, MDN e OWASP. Letta la nota JavaScript Sanitizzazione input e confrontate CSRF/API layer per mantenere confini e rimandi coerenti.
- Registry e release indicano DOMPurify 3.4.17; aggiunto soltanto alla toolchain temporanea React. Non aggiornata quella JavaScript ne i pacchetti del sito. Audit con il solo low preesistente su @babel/core 7.29.0 (GHSA-4x5r-pxfx-6jf8); nessun aggiornamento forzato.
- Nuova suite react-xss-auth.test.mjs: dieci prove Node/toolchain, tredici Chrome development e tredici production, di cui due di sola sintassi. Codice estratto dai Markdown, Strict Mode, NODE_ENV esplicito; React/React DOM 19.3.0, Node 24.14.0, DOMPurify 3.4.17 e Chrome 155.0.8059.80.
- **570 test React superati**, 534 precedenti e 36 nuovi, senza test falliti o saltati. Regressione seriale completa in circa 205 secondi, prima della build Quartz. La prima esecuzione del blocco aveva 34 prove, poi aggiunte due su CSRF rifiutato e nome utente come testo; nessun errore rilevato. Suite JavaScript non rieseguita.
- Sanitizer reale senza CSP: testo separato da HTML, policy e DOM risultante, payload esclusi/malformati, vuoto/reset, limiti e URL ingannevoli. Nomi utente come testo, non HTML; server-side rich text rifiutato senza integrazione DOM.
- Sessione con HTTP loopback reale e cookie HttpOnly: bootstrap, 401/403/500, JSON/schema errati, POST/CSRF, cookie scaduto e logout fallito. Fixture controllate per risultati fuori ordine, errore rete, smontaggio, cambio identita e doppio logout. Non verificate credenziali o autorizzazione reale.
- Sei scansioni axe su stati selezionati e controllo overflow mobile, non una certificazione. Errori inattesi console/pagina/HTTP e richieste esterne fanno fallire i test. Nessuna junction o fixture su disco aggiuntiva.

### Limiti e seguito

La fixture non implementa un sistema di autenticazione: niente password, MFA, OIDC, PKCE, refresh token o autorizzazioni per record. Cookie su HTTP loopback, quindi nessuna prova di HTTPS/Secure/prefisso \_\_Host- o matrice SameSite. CSP, Trusted Types, CSRF cross-site, SSR del rich text e cache condivise richiedono prove dedicate. Gli otto payload non certificano assenza universale di XSS; nessun audit o screen reader reale.

Proseguire con CSRF e Content Security Policy. Le note restano non revisionate fino al controllo dell'utente; nessun commit, push o deploy remoto.

### Verifica del vault

- content:check con report: **911 documenti raggiungibili, zero errori, 557 avvisi editoriali**, due in meno. Non certifica la correttezza delle altre note.
- content:test: **9 test superati**, separati dai test tecnici degli esempi.
- Build Quartz: **3.719 file generati, 2.003 HTML, 168 redirect e 136.197 riferimenti verificati, zero errori**. Invariati gli avvisi preesistenti su eval nel plugin note-properties e metadati Git della copia temporanea.
- QA delle due pagine su desktop 1440 x 1000 e mobile 390 x 844: HTTP 200, titoli ed esempi aggiornati, nessun errore JavaScript/HTTP o overflow del documento. Quattro blocchi di codice larghi su mobile e uno su desktop scorrono nel contenitore code. Tabelle leggibili; verificato anche lo scorrimento del contenitore della tabella di autenticazione su mobile.
- **Sei screenshot finali ispezionati**, con aperture desktop, tabelle ed esempi mobile. Anteprima esistente riutilizzata su http://localhost:8082/appunti/ senza riavvio; browser QA chiusi e HTML non modificati manualmente. Superati anche diff --check e formattazione della nuova suite.

## 2026-10-18 - React: CSRF e Content Security Policy

### Perimetro

Lette integralmente e corrette CSRF e Content Security Policy. **49 note React uniche su 59, 10 ancora da esaminare**. Date, type e publish conservati; status non revisionato. Nessuna nuova pagina, modifica di indice, spostamento o redirect.

| Nota                                                                             | Correzioni                                                                                                                                                                                                                                                                                                  |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/React/Pagine/CSRF\|CSRF]]                                       | Distinti autenticazione, autorizzazione, cookie, SameSite, CORS e token. Contratto same-origin esplicito e form eseguibile: endpoint fisso, validazione, cookie/token/JSON, status 204, errori, doppio invio e cleanup. Limiti di Origin, Fetch Metadata, double-submit, retry e cancellazione esplicitati. |
| [[Programmazione/React/Pagine/Content Security Policy\|Content Security Policy]] | Separati SPA statica, nonce dinamico, hash e framework SSR. Baseline e demo React CSR completo con CSS esterno, shell Node e route limitate. Chiariti nonce, strict-dynamic, report-only, Vite, Next, cache, CSS-in-JS e Trusted Types; nessuna modifica alla CSP di Quartz.                                |

### Fonti e prove

- Consultate fonti ufficiali OWASP, MDN, React, Vite, Next.js, Node ed esbuild. Confrontate la CSP JavaScript e le note React su autenticazione/XSS per evitare esempi e responsabilita incoerenti.
- Nuova suite react-csrf-csp.test.mjs: **31 test superati**, di cui uno di sola sintassi. React/React DOM 19.3.0, Node 24.14.0, esbuild 0.27.3 e Chrome 155.0.8059.80; codice estratto dai Markdown. Form development/production con Strict Mode, contatore CSP production.
- HTTP locale reale per cookie HttpOnly, token/origini invalidi, metodo/schema/Content-Type, form cross-origin same-site e preflight. Provati errore rete simulato, doppio submit e scrittura che prosegue dopo abort client. Due scansioni axe su stati selezionati, non un audit.
- CSP applicata al documento: script senza nonce, nonce errato e script esterno non autorizzato bloccati; contatore e CSS funzionanti. Solo report-only permette il flag e genera una violazione. Baseline self provata separatamente.
- Server della nota eseguito con porta effimera e readFile virtuale: bundle reali in memoria, route/MIME/404/405/500 verificati. Nessuna installazione npm o scrittura fixture durante questa suite; pacchetti e lockfile del sito invariati.
- Le prime due esecuzioni hanno rilevato un'interferenza del routing Playwright sul preflight, non un errore dell'esempio. Disabilitato tutto il routing nel contesto CORS; verificato OPTIONS nativo e assenza della mutazione. Errori intenzionali ammessi soltanto nelle prove negative dedicate.
- Regressione completa: **601 test React superati**, 570 precedenti e 31 nuovi; nessun fallimento o test saltato. Esecuzione seriale in circa 216 secondi, prima della build Quartz. Browser e server di prova chiusi.

### Limiti e seguito

Non implementati backend di autenticazione completo, limiti del body, autorizzazione per record, HMAC double-submit o rotazione token. Le due origini usano porte diverse sullo stesso host: non e una matrice cross-site/SameSite, TLS o cookie di terze parti. Non verificati CSP con Next, streaming SSR, CDN, report remoto, Trusted Types, CSS-in-JS, worker o lazy chunk. Redirect verificato come opzione, non con una catena HTTP. La suite non certifica sicurezza universale o accessibilita completa; JavaScript resta una regressione separata.

Proseguire con Testing Jest e Testing Cypress e Playwright, poi le altre note di Testing e Qualita e Architettura Frontend. Note non revisionate fino al controllo dell'utente. Nessun commit, push o deploy remoto.

### Verifica del vault

- content:check con report: **911 documenti raggiungibili, zero errori e 556 avvisi editoriali**, uno in meno. Non certifica il contenuto di tutte le note.
- content:test: **9 test superati**, separati dai test React.
- Build Quartz riuscita: **3.719 file, 2.003 HTML, 168 redirect e 136.256 riferimenti verificati, zero errori**. Avvisi preesistenti su eval nel plugin note-properties e metadati Git della copia temporanea invariati.
- QA desktop 1440 x 1000 e mobile 390 x 844 delle due note: HTTP 200, titoli/codice aggiornati, nessun errore browser/HTTP o overflow del documento. Tutte le tabelle rientrano nel viewport. Verificato lo scorrimento effettivo di nove blocchi larghi su mobile e uno su desktop.
- **Sei screenshot ispezionati**, aperture desktop, tabelle ed esempi mobile. Anteprima gia attiva riutilizzata su http://localhost:8082/appunti/ (PID 30336), browser QA chiusi. Nessuna modifica manuale agli HTML. Superati diff --check e Prettier della nuova suite; storico mantenuto a dieci voci.

## 2026-10-18 - React: Jest e test nel browser

### Perimetro

Lette integralmente e corrette Testing Jest e Testing Cypress e Playwright. **51 note React uniche su 59, 8 ancora da esaminare**. Conservati date, type operational-note, publish e status non revisionato. Struttura operativa, prerequisiti, collegamenti e fonti aggiornati; nessuno spostamento o modifica a indici e redirect.

| Nota                                                                                       | Correzioni                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/React/Pagine/Testing Jest\|Testing Jest]]                                 | Configurazione completa Jest/jsdom/Babel, distinta da Vite e da ESM nativo. Query, attese, mock e cleanup chiariti. Form eseguibile con servizio iniettato, validazione, pending, guardia contro doppi invii, bozza e retry; errore di servizio distinto da campo invalido. Sette test effettivi e limiti della coverage. |
| [[Programmazione/React/Pagine/Testing Cypress e Playwright\|Testing Cypress e Playwright]] | Stesso componente condiviso, adapter HTTP e shell Vite completi. Configurazioni e tre casi per ciascun runner: successo, validazione e retry esplicito. Distinti Promise Playwright e coda Cypress, retry delle assertion e dei test, webServer e anteprima esterna. Nessun backend/persistenza impliciti nei mock.       |

### Fonti e prove

- Consultate documentazioni ufficiali Jest, Testing Library, Playwright, Cypress e Vitest. Pin e compatibilita controllati; toolchain separata in appunti-react-testing-tools nella directory temporanea. Non aggiornati i pacchetti del sito o la precedente toolchain React.
- Nuova suite react-testing-runners.test.mjs: **23 test superati**, di cui uno di sola sintassi. Node 24.14.0, React 19.3.0, Jest 30.5.2, Babel 7.29.7, Vite 8.3.4, Playwright Test 1.62.1, Cypress 16.2.0 e Chrome 155.0.8059.80. Codice e configurazioni estratti dai Markdown.
- Jest CLI esegue **7 test con coverage** e nessun avviso act ignorato. Prova negativa nella sola copia temporanea: rimossa la validazione del vuoto, due test devono fallire con exit code 1, poi il sorgente viene ripristinato.
- Build Vite reale; Playwright Test CLI con webServer esegue **3 test** e Cypress Module API con anteprima esterna ne esegue **3**. Analizzati i report JSON e rifiutati fallimenti, skip e flaky. Questi tredici casi sono interni ai gruppi della suite Node, non aggiunti una seconda volta al totale.
- Controlli separati su normalizzazione/UTF-16, render SSR e adapter con Fetch simulato: input, payload, status, Content-Type, JSON/schema, credenziali omesse ed errore rete. Form in Strict Mode; errori di validazione e servizio producono aria-invalid distinti.
- Regressione completa: **624 test React superati**, 601 precedenti e 23 nuovi, senza test saltati o falliti; esecuzione seriale in circa 243 secondi, prima della build Quartz. Server e browser chiusi, junction scollegate e fixture eliminate dopo verifica del percorso. Suite JavaScript non rieseguita.
- Audit della nuova toolchain: 19 segnalazioni moderate propagate dalla dipendenza transitiva sprintf-js ([GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c)), nessuna high/critical. Non applicato il downgrade automatico a Jest/babel-jest 25; toolchain precedente invariata.

### Limiti e seguito

Test browser con API simulate, non collaudo end-to-end di un backend, database o sessione reale. Non provati Vitest, MSW, ESM nativo Jest, TypeScript, fake timer, Cypress component testing, login/storageState/cy.session, altri browser o screen reader. Nessuna nuova scansione axe in questo blocco. Coverage e controesempio mirato non certificano correttezza universale; i sette test Jest non coprono specificamente unmount e risposta incoerente del servizio.

Proseguire con Test di accessibilita e Linting e Formattazione, poi Storybook, Visual regression testing e Architettura Frontend. Note non revisionate fino al controllo dell'utente; nessun commit, push o deploy remoto.

### Verifica del vault

- content:check con report: **911 documenti raggiungibili, zero errori e 554 avvisi editoriali**, due in meno. Non certifica la correttezza tecnica di tutte le note.
- content:test: **9 test superati**, distinti dalle prove React e dei runner.
- Build Quartz riuscita: **3.719 file, 2.003 HTML, 168 redirect e 136.324 riferimenti verificati, zero errori**. Invariati gli avvisi preesistenti su eval nel plugin note-properties e metadati Git della copia temporanea.
- QA desktop 1440 x 1000 e mobile 390 x 844: HTTP 200, titoli e nuovi esempi presenti, nessun errore console/pagina/HTTP o overflow del documento. Verificato lo scorrimento effettivo di 22 blocchi di codice e della tabella comparativa larga su mobile; le altre tre tabelle rientrano nel viewport.
- **Sei screenshot ispezionati**, con aperture desktop, tabelle ed esempi mobile. Anteprima esistente riutilizzata su http://localhost:8082/appunti/ (PID 30336), browser QA chiusi. Nessuna modifica manuale agli HTML; Prettier della nuova suite e diff --check superati.

## 2026-10-18 - React: accessibilita e linting

### Perimetro

Lette integralmente e corrette Test di accessibilita e Linting e Formattazione. **53 note React uniche su 59, 6 ancora da esaminare**. Conservati date, type operational-note, publish e status non revisionato; nessuna modifica a percorsi, indici o redirect. Template operativo, fonti e rimandi alle note correlate.

| Nota                                                                             | Correzioni                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/React/Pagine/Test di accessibilita\|Test di accessibilita]]     | Rimossi i riferimenti a componenti di esempio non definiti, sostituiti da una pagina Vite che riusa i moduli WAI-ARIA/Portals. Quattro test Playwright e cinque scansioni axe con allegati, stati dinamici, tastiera, nome/descrizione e ritorno focus. Separati automatico, inconcludente e verifica manuale; limiti espliciti per screen reader e conformita. |
| [[Programmazione/React/Pagine/Linting e Formattazione\|Linting e Formattazione]] | Sostituita la config vuota con ESLint 10, preset Hooks, globali per ambiente e ignore. Aggiunti config Prettier, script read-only/fix, componente positivo, controesempio e print-config. Spiegati compatibilita plugin, warning bloccanti, differenza da Compiler e limiti JSX/TypeScript/CI.                                                                  |

### Fonti e prove

- Consultate fonti ufficiali W3C WAI/APG, Playwright, axe, React, ESLint, Prettier e repository dei plugin. Confrontate le note WAI-ARIA, Focus Management, Portals, Testing e le basi JavaScript ESLint/Prettier.
- Controllate le peer dependency: React plugin 7.37.5 e jsx-a11y 6.10.2 non dichiarano ESLint 10; non installati ne forzati. La baseline usa ESLint 10.13.0 e Hooks 7.1.1, senza proporre ESLint 9 fuori manutenzione. Nessun aggiornamento delle dipendenze Quartz o delle toolchain precedenti.
- Nuova suite react-accessibility-lint.test.mjs: **26 test mirati superati** in circa 20 secondi. Node 24.14.0, React 19.3.0, Prettier 3.9.10, axe 4.14.0 e Playwright Test 1.62.1. Una prova di sola sintassi e una di solo render SSR del TitleCounter; configurazioni e moduli estratti dai Markdown.
- ESLint CLI e API reali: progetto positivo, JSX, scope browser/Node/CommonJS/Jest, regole Hooks, globali errati, warning e soppressioni inutili. Prettier check lascia intatti i file, write modifica soltanto la fixture e non nasconde il bug dell'effect. Ignore verificati con un file generato intenzionalmente non valido.
- Vite build e quattro test Playwright originali: disclosure con Enter/Space/Tab, campo nascosto escluso, errore descritto, conferma locale, dialog, Escape e ripristino focus. Cinque scansioni axe con report completo, zero violazioni e zero incomplete nei soli stati provati. I quattro casi interni non sono sommati nuovamente ai 26 gruppi Node.
- Prova negativa: eliminato lang soltanto nella copia temporanea, ricompilato e verificato che la scansione originale fallisca con html-has-lang. Directory validate prima della rimozione, junction scollegate e processi chiusi.
- Toolchain separata appunti-react-quality-tools nella directory temporanea: **audit npm senza advisory**, nessun aggiornamento forzato. Gli advisory delle toolchain precedenti non vengono modificati o dichiarati risolti.
- Regressione seriale completa: **650 test React superati**, 624 precedenti e 26 nuovi, senza fallimenti o test saltati, in circa 263 secondi. Build Quartz avviata dopo la conclusione; suite JavaScript non rieseguita.

### Limiti e seguito

Nessuna certificazione WCAG, screen reader o verifica manuale di zoom, contrasto dei temi e reflow. Demo Chrome statico locale, non backend o matrice completa di browser. La prova del TitleCounter e limitata a lint e SSR, non al suo effect nel browser. Non verificati TypeScript, Next, editor, pre-commit, plugin React/JSX aggiuntivi o CI remota.

Proseguire con Storybook e Visual regression testing, poi le quattro note di Architettura Frontend. Stato non revisionato fino al controllo dell'utente; nessun commit, push o deploy remoto.

### Verifica del vault

- content:check con report: **911 documenti raggiungibili, zero errori e 552 avvisi editoriali**, due in meno. Non certifica il contenuto di tutte le note.
- content:test: **9 test superati**, distinti dall'esecuzione dei test tecnici.
- Build Quartz riuscita: **3.719 file, 2.003 HTML, 168 redirect e 136.390 riferimenti verificati, zero errori**. Restano gli avvisi preesistenti su eval nel plugin note-properties e metadati Git della copia temporanea.
- QA delle due note su desktop 1440 x 1000 e mobile 390 x 844: HTTP 200, titoli/esempi aggiornati, nessun errore JavaScript/console/HTTP o overflow del documento. Verificato lo scorrimento effettivo di 14 blocchi di codice larghi e una tabella mobile; le altre tre tabelle rientrano nel viewport.
- **Sei screenshot ispezionati**, aperture desktop, tabelle e codice mobile. Anteprima esistente riutilizzata su http://localhost:8082/appunti/ (PID 30336); browser QA chiusi e HTML non modificati manualmente. Prettier della nuova suite e diff --check superati; storico mantenuto a dieci voci.

## 2026-10-19 - React: Storybook e visual regression

### Perimetro

Lette integralmente e riscritte Storybook e Visual regression testing. **55 note React uniche su 59, 4 ancora da esaminare**. Conservati date, type operational-note, publish e status non revisionato. Template operativo, fonti e collegamenti completi; nessuno spostamento, nuovo indice o redirect.

| Nota                                                                                 | Correzioni                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/React/Pagine/Storybook\|Storybook]]                                 | Installazione e configurazione React/Vite aggiornate, componente reale con CSS, cinque storie CSF, Controls e due play con assertion. Vitest Browser Mode eseguibile, annotazioni automatiche dell'addon 10.6.2; distinti catalogo, build, interazioni, accessibilita e screenshot. Dati, provider, isolamento e pubblicazione trattati con limiti espliciti. |
| [[Programmazione/React/Pagine/Visual regression testing\|Visual regression testing]] | Configurazione Playwright e sei confronti su tre storie/due viewport. Ambiente deterministico, baseline versionate, fallimento senza creazione implicita, aggiornamento mirato e artefatti. Chiariti tolleranza colore, numero di pixel, mask, animazioni, piattaforme e differenza tra viewport mobile e dispositivo.                                        |

### Fonti e prove

- Consultate documentazioni ufficiali Storybook, Vitest e Playwright e confrontati i pacchetti installati. Toolchain separata appunti-react-storybook-tools: Storybook 10.6.2, React 19.3.0, Vite 8.3.4, Vitest 5.0.5 e Playwright Test/Playwright 1.62.1. Audit npm senza advisory; dipendenze del sito e altre toolchain invariate.
- Nuova suite react-storybook-visual.test.mjs: **9 test mirati superati** in circa 45 secondi. Configurazioni e sorgenti estratti dai Markdown; un gruppo controlla soltanto la sintassi.
- Vitest reale esegue cinque storie; il callback rimosso nella sola fixture fa fallire Activated e lascia verdi gli altri quattro casi. Il wrapper di test permette a Vite di servire le junction esterne, senza alterare gli snippet originali.
- Storybook compilato realmente; verificati cinque ID, Docs, manager e iframe. Playwright Test prova baseline assente senza creazione, aggiornamento esplicito di sei PNG e confronto successivo senza riscrivere gli hash.
- Modifica CSS intenzionale nella fixture: build, confronto fallito e diff PNG presente. Baseline intatte; ripristino del CSS, nuova build e confronto verde senza aggiornamento dei riferimenti. Le cinque storie e i sei casi visuali sono interni ai gruppi Node, non contati nuovamente.
- Regressione seriale completa: **659 test React superati**, 650 precedenti e 9 nuovi, senza fallimenti o test saltati, in circa 355 secondi. Node 24.14.0 e Chrome 155.0.8059.80; browser/processi chiusi e fixture rimosse dopo controllo dei percorsi e scollegamento delle junction. Suite JavaScript non rieseguita; build Quartz avviata soltanto dopo la regressione.

### Limiti e seguito

Solo Windows/Chrome, tema chiaro e due viewport; nessuna matrice browser, dispositivo fisico, servizio remoto, backend o CI remota. Le baseline temporanee verificano il meccanismo, non sono un'approvazione umana dell'aspetto di un prodotto. Non provati MSW, TypeScript, Next, decorators applicativi o addon a11y. Le prove del blocco precedente restano distinte. Nessun commit, push o deploy remoto.

Rimangono Design system, Feature-based architecture, State colocato e API layer. Tutte le note modificate restano non revisionate fino al controllo dell'utente.

### Verifica del vault

- content:check con report: **911 documenti raggiungibili, zero errori e 550 avvisi editoriali**, due in meno; non certifica il contenuto delle altre note.
- content:test: **9 test superati**, distinti dai test tecnici.
- Build Quartz riuscita: **3.719 file, 2.003 HTML, 168 redirect e 136.432 riferimenti verificati, zero errori**. Avvisi preesistenti su eval del plugin note-properties e metadati Git della copia temporanea invariati.
- QA delle due note su desktop 1440 x 1000 e mobile 390 x 844: HTTP 200, titoli e snippet aggiornati, nessun errore pagina/console/HTTP o overflow del documento. Scorrimento effettivo verificato per 16 blocchi larghi tra i viewport e una tabella mobile; le altre tabelle rientrano nello spazio disponibile.
- **Sei screenshot finali ispezionati**, aperture desktop, tabelle e codice mobile. Disattivato lo scorrimento animato nella sola sessione di acquisizione per inquadrare gli elementi, senza modificare il CSS del sito. Anteprima preesistente riutilizzata su http://localhost:8082/appunti/ (PID 30336); browser QA chiusi, HTML generati non modificati manualmente. Prettier della suite e diff --check superati; storico mantenuto a dieci voci.

## 2026-10-19 - React: design system e architettura per feature

### Perimetro

Lette integralmente e riscritte Design system e Feature-based architecture. **57 note React uniche su 59, 2 ancora da esaminare**. Conservati date, type theory-note, publish e status non revisionato. Accorpate le sezioni duplicate; nessuno spostamento o modifica a indici e redirect.

| Nota                                                                                   | Correzioni                                                                                                                                                                                                                                                           |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/React/Pagine/Design system\|Design system]]                           | Distinti sistema, libreria e catalogo. Token e risoluzione CSS, contratti, governance e compatibilita. TextField React 19 completo, controllato, con label, descrizioni, errore testuale, ref e temi; separata la responsabilita del form dalla primitiva condivisa. |
| [[Programmazione/React/Pagine/Feature-based architecture\|Feature-based architecture]] | Confini e dipendenze invece del solo albero di cartelle; API pubblica, import, shared, stato e routing. Demo completo con policy pura, due form indipendenti e composizione Vite, riusando TextField. Chiariti limiti di index, lint, FSD, monorepo e persistenza.   |

### Fonti e prove

- Consultate fonti ufficiali React, USWDS, GOV.UK Design System, WAI, MDN, SemVer, Redux, Feature-Sliced Design ed ESLint. La convenzione app -> features -> shared e una scelta del demo, non una regola obbligatoria di React o l'adozione completa di FSD.
- Nuova suite react-design-architecture.test.mjs: **35 test mirati superati**, 17 gruppi Node e 18 casi browser, in circa otto secondi. Due gruppi verificano solo sintassi e due solo render SSR. Node 24.14.0, React 19.3.0, Vite 8.3.4 e Chrome 155.0.8059.80; sorgenti estratti dai Markdown.
- Verificate policy UTF-16, trim, tipi invalidi, escaping e relazioni ARIA. Build Vite reale e grafo esbuild; deep import e dipendenza shared -> feature introdotti nella sola fixture compilano ma vengono rilevati dal controllo dei confini. Controllo limitato all'esempio, non analizzatore generale di architettura.
- Development e production: istanze indipendenti, ID stabili, focus/ref, errore e correzione, submit con Enter, cambio tema senza reset, testo non HTML e perdita della conferma al reload. Probe sul componente originale per required nativo, disabled, Tab e FormData; produzione a 320/390/1440px nei due temi senza overflow.
- Quattro scansioni axe negli stati di errore chiaro/scuro, zero violazioni e zero incomplete. Non sono una certificazione di accessibilita; nessuna verifica con screen reader, zoom o forced colors.
- Riutilizzate toolchain esistenti senza nuove installazioni o audit npm. Server e browser della suite mirata chiusi, junction scollegate e directory temporanea rimossa dopo controllo del percorso. Dipendenze Quartz invariate.
- Regressione seriale completa: **694 test React superati**, 659 precedenti e 35 nuovi, senza fallimenti o test saltati, in circa 358 secondi. Processi e fixture dei test chiusi/rimossi; suite JavaScript non rieseguita. Build Quartz avviata solo dopo la conclusione della regressione.

### Limiti e seguito

Esempio locale React 19/Vite, senza autenticazione, backend o persistenza. Non provati React 18, hydration, framework routing, package distribuiti, altri browser o CI remota. Il controllo del grafo non copre genericamente alias, cicli, import dinamici o feature multiple. Le scansioni automatiche e le misure di overflow non approvano l'aspetto di un prodotto.

Rimangono **State colocato e API layer**. Le note restano non revisionate fino all'approvazione dell'utente; nessun commit, push o deploy remoto.

### Verifica del vault

- content:check con report: **911 documenti raggiungibili, zero errori e 548 avvisi editoriali**, due in meno; nessun avviso sulle due note del blocco. Non certifica il contenuto delle altre note.
- content:test: **9 test superati**, distinti dai test degli esempi React.
- Build Quartz riuscita: **3.719 file, 2.003 HTML, 168 redirect e 136.485 riferimenti verificati, zero errori**. Restano gli avvisi preesistenti su eval del plugin note-properties e metadati Git della copia temporanea.
- QA delle due pagine su desktop 1440 x 1000 e mobile 390 x 844: HTTP 200, titoli e snippet aggiornati, nessun errore pagina/console/HTTP o overflow del documento. Scorrimento effettivo di nove blocchi di codice e una tabella su mobile; albero delle cartelle leggibile senza scorrimento orizzontale.
- **Sei screenshot ispezionati**: aperture desktop, tabella/albero e codice mobile. Scorrimento animato disattivato nella sola sessione QA. Anteprima preesistente riutilizzata su http://localhost:8082/appunti/ (PID 30336); browser chiusi, HTML non modificati manualmente. Suite formattata con Prettier, sezioni principali univoche e storico mantenuto a dieci voci.

## 2026-10-19 - React: stato colocato e API layer

### Perimetro

Lette integralmente e riscritte State colocato e API layer: **59 note React uniche su 59 esaminate**. Conclusa la revisione tecnica delle pagine attualmente presenti, non una certificazione di ogni frammento o una copertura di tutte le API React. Conservati date, type, publish e status non revisionato; nessun nuovo percorso, indice o redirect.

| Nota                                                           | Correzioni                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/React/Pagine/State colocato\|State colocato]] | Proprietario, consumatori e durata al posto della regola assoluta sullo stato locale. Distinti Context, custom hook, URL, cache e valori derivati. Catalogo completo con filtro condiviso, dettaglio locale, due istanze, hidden/unmount e reset per key; chiariti inizializzazione e limiti prestazionali.                                                |
| [[Programmazione/React/Pagine/API layer\|API layer]]           | Trasporto, feature, cache e UI separati. Client JSON con contratto limitato, Headers, status, 204, errori distinti e signal. DTO validati e proiettati, operazioni per dominio, effetti delle scritture sul backend espliciti e integrazione con ProfilePanel esistente. Cache alternativa con signal inoltrato; credenziali, SSR e backend non impliciti. |

### Fonti e prove

- Consultate fonti ufficiali React, MDN e TanStack Query. Confrontate le note Derived state, Data Fetching e Cache, Gestione della memoria e AbortController, Introduzione e Toolchain e Feature-based architecture.
- Nuova suite react-colocation-api.test.mjs: prima esecuzione mirata **59/59**, poi aggiunto un caso di abort prima degli header, per **60 casi**. Configurazioni e moduli estratti dai Markdown, due build Vite reali. Node 24.14.0, React 19.3.0, Vite 8.3.4 e Chrome 155.0.8059.80.
- 42 gruppi Node, inclusi due di sola sintassi e uno di render SSR; 18 casi browser. Verificati filtro e immutabilita, DTO e ID, Headers, JSON, 200/201/204, errori HTTP/rete/protocollo/body, input invalidi e signal. Server locale per Fetch reale e abort durante la lettura, con controllo di bodyUsed e motivo originale.
- Development/production: stato condiviso dai fratelli, dettaglio locale, cataloghi indipendenti, hidden, unmount, key, focus e tastiera. Probe su initialQuery; produzione a 320/390/1440px. Due scansioni axe, zero violazioni e zero incomplete nei soli stati provati.
- UI API con richieste intercettate: successo, cambio ID, errore, retry, testo non HTML e risposta incoerente rifiutata. Opzioni Query controllate eseguendo direttamente queryFn, senza dichiarare una nuova verifica dell'intera cache.
- Nessuna nuova installazione o audit npm: toolchain temporanee esistenti riusate, dipendenze Quartz invariate. Test senza dati o credenziali reali; nessun commit, push o deploy remoto.
- Regressione seriale completa: **754 test React superati**, 694 precedenti e 60 nuovi, nessun fallimento o test saltato, in circa 376 secondi. Browser, server e fixture chiusi/rimossi dopo verifica dei percorsi e scollegamento delle junction. Suite JavaScript non rieseguita; build Quartz avviata dopo la conclusione dei test.

### Limiti e seguito

Non verificati backend di produzione, autorizzazioni, CORS cross-origin, idempotenza, retry automatici, upload FormData, stream di download, SSR dell'adapter, client generati o CI remota. Solo Windows/Chrome; nessun benchmark, screen reader o certificazione WCAG. Timeout e obsolescenza del ProfilePanel hanno prove distinte nella suite gia esistente.

La revisione React corrente e conclusa. Tutte le note modificate restano **non revisionate dall'utente**; le altre aree e le versioni future richiedono controlli separati.

### Verifica del vault

- content:check con report: **911 documenti raggiungibili, zero errori e 546 avvisi editoriali**, due in meno. Nessun avviso nell'area React; questo non certifica tutte le API descritte o il contenuto delle altre aree.
- content:test: **9 test superati**, distinti dalle prove degli esempi React.
- Build Quartz riuscita: **3.719 file, 2.003 HTML, 168 redirect e 136.554 riferimenti verificati, zero errori**. Invariati gli avvisi preesistenti su eval del plugin note-properties e metadati Git della copia temporanea.
- QA delle due note a 1440 x 1000 e 390 x 844: HTTP 200, titoli e nuovi esempi presenti, nessun errore pagina/console/HTTP o overflow del documento. Sei blocchi di codice e due tabelle scorrono realmente su mobile; la tabella del contratto HTTP rientra nello spazio disponibile.
- **Sei screenshot ispezionati**, aperture desktop e tabelle/codice mobile. Disattivato lo scorrimento animato nella sola sessione QA per l'inquadratura; nessuna modifica manuale al CSS o agli HTML. Anteprima preesistente http://localhost:8082/appunti/ (PID 30336) lasciata attiva, browser QA chiusi. Prettier della nuova suite e diff --check superati; sezioni principali univoche e storico a dieci voci.

## 2026-10-20 - TypeScript: fondamenti del linguaggio

### Perimetro

Dopo la conclusione e il push della revisione React, avviato il percorso TypeScript: **7 note su 83**, l'intero capitolo Fondamenti del Linguaggio. Letti indice, template e tutte le note del blocco. Date, percorsi, type e publish conservati; status ancora non revisionato fino al controllo dell'utente. Nessuna pagina nuova o spostata.

| Nota                                                                                                  | Correzioni                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [[Programmazione/TypeScript/Pagine/Introduzione a TypeScript\|Introduzione a TypeScript]]             | Separati checker, emissione e runtime; strict e opzioni aggiuntive, CLI locale riproducibile, artefatti precedenti dopo errore, UI distinta dall'autorizzazione server.        |
| [[Programmazione/TypeScript/Pagine/Tipi primitivi\|Tipi primitivi]]                                   | Limiti di number, BigInt, wrapper e null; prezzo in centesimi con controlli runtime; assenza distinta da undefined con exactOptionalPropertyTypes.                             |
| [[Programmazione/TypeScript/Pagine/Variabili e annotazioni di tipo\|Variabili e annotazioni di tipo]] | Contratto distinto da conversione e narrowing; callback contestuali, inizializzazione e calcolo reale di un totale al posto della falsa creazione utente.                      |
| [[Programmazione/TypeScript/Pagine/Inferenza dei tipi\|Inferenza dei tipi]]                           | Literal/widening, readonly non runtime, array e stato iniziale; ritorni inferiti, indice potenzialmente assente. Corretto related YAML spezzato in due stringhe non collegate. |
| [[Programmazione/TypeScript/Pagine/any, unknown e never\|any, unknown e never]]                       | Scope di any, unknown utilizzabile con controlli, never distinto da void; parser JSON con proiezione, campi propri e limiti espliciti; catch e switch esaustivo.               |
| [[Programmazione/TypeScript/Pagine/Union e Intersection Types\|Union e Intersection Types]]           | Union non esclusiva, discriminante, proprieta impossibili e conflitti; intersection distinta dallo spread runtime.                                                             |
| [[Programmazione/TypeScript/Pagine/Type Aliases e Interfaces\|Type Aliases e Interfaces]]             | Tipizzazione strutturale, merging e extends; interfaccia non come filtro dei campi o valore runtime. Proiezione esplicita e contratti DTO/dominio.                             |

### Fonti e prove

- Fonti ufficiali TypeScript, Node.js e MDN riportate nelle note. Baseline TypeScript **5.9.3** gia disponibile nel sito; non dichiarata come ultima versione. Dipendenze e lockfile invariati.
- Nuova suite `_Meta/tests/typescript-fondamenti.test.mjs`: **52 test superati** su Node **24.14.0**, zero fallimenti o test saltati, circa 68 secondi.
- Compilati con il vero checker i 23 blocchi indipendenti, oltre alla continuazione ricomposta. Verificati diagnostici negativi e tipi inferiti, senza asserire che codice trasformato equivalga a codice controllato.
- Eseguiti i risultati JavaScript per output, limiti numerici, parser e proiezione dei campi. CLI reale su fixture isolata: noEmit, `.cjs`, noEmitOnError e vecchio output conservato. Directory temporanea rimossa dopo verifica del percorso.
- Limiti: non ogni frammento inline, matrice di compilatori/runtime, bundler, API remote o sicurezza di produzione. Non rieseguite le suite JavaScript e React, non modificati i loro esempi.

### Verifica del vault

- content:check con report: **911 documenti raggiungibili, zero errori e 539 avvisi editoriali**, sette in meno.
- content:test: **9 test superati**, separati dalle prove TypeScript.
- Build Quartz riuscita: **3.719 file, 2.003 HTML, 168 redirect e 136.638 riferimenti verificati, zero errori**. Restano soltanto gli avvisi preesistenti su eval del plugin note-properties e metadati Git della copia temporanea.
- QA delle sette pagine su desktop 1440 x 1000 e mobile 390 x 844 con Chrome 155.0.8059.85: HTTP 200, testi aggiornati, nessun errore pagina/console/HTTP o overflow del documento. Verificato lo scorrimento effettivo di 27 blocchi di codice e una tabella su mobile.
- Quattro screenshot ispezionati delle sezioni di Introduzione a TypeScript e Type Aliases e Interfaces. Anteprima esistente riutilizzata su http://localhost:8082/appunti/; browser di prova chiusi, HTML e CSS non modificati manualmente. Storico mantenuto a dieci voci.

### Prossimo blocco

La revisione e proseguita con Funzioni, Oggetti e Collezioni, documentato di seguito. Nessun commit o push della revisione TypeScript eseguito.

## 2026-10-20 - TypeScript: funzioni, oggetti e collezioni

### Perimetro e correzioni

Lette e corrette le sette note del secondo capitolo base: **14 note TypeScript su 83** in questa passata. Percorsi, date, type, publish e status non revisionato conservati; nessuna pagina creata o spostata, nessun indice o redirect da aggiornare.

| Nota                                                                                              | Correzioni                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/TypeScript/Pagine/Funzioni tipizzate\|Funzioni tipizzate]]                       | Parametri opzionali/default/rest, callback contestuali, void esplicito e contestuale, Promise; selezione locale distinta da invio o validazione email.                                    |
| [[Programmazione/TypeScript/Pagine/Oggetti e proprieta opzionali\|Oggetti e proprieta opzionali]] | Assenza, undefined e null, opzione exact, default e Partial; anteprima email che dichiara di non inviare messaggi.                                                                        |
| [[Programmazione/TypeScript/Pagine/Array, Tuple e Readonly\|Array, Tuple e Readonly]]             | Indici fuori limite, tuple modificabili, readonly superficiale e riferimenti condivisi; ordinamento su copia e confronto numerico.                                                        |
| [[Programmazione/TypeScript/Pagine/Enums e Literal Types\|Enums e Literal Types]]                 | Reverse mapping, lista runtime con guard, compatibilita numerica, const enum e limiti di type stripping; nessuna preferenza assoluta fra union ed enum.                                   |
| [[Programmazione/TypeScript/Pagine/Assertion e casting dei tipi\|Assertion e casting dei tipi]]   | Corretto predicate che controllava solo la presenza dei campi; verifica dei tipi reali e proprieta proprie, non conversione di as/!, DOM e limiti tra realm. Prerequisites YAML riparato. |
| [[Programmazione/TypeScript/Pagine/Firme di funzione e overload\|Firme di funzione e overload]]   | Firma interna non pubblica, input union, runtime unico, assenza di prova sui singoli rami; split/join distinto da CSV, firme chiamabili e ReturnType.                                     |
| [[Programmazione/TypeScript/Pagine/Index Signatures\|Index Signatures]]                           | Lookup corretto per non restituire proprieta ereditate; chiavi assenti, opzioni separate, Record finito/aperto, pattern e metadata. Related Record collegato alla nota Utility Types.     |

### Fonti e prove

- Consultate fonti ufficiali TypeScript, Node.js e MDN, riportate nelle note. Baseline TypeScript **5.9.3**, senza aggiornamenti delle dipendenze.
- Estratto supporto comune `_Meta/tests/typescript-examples.mjs` per evitare duplicazione del checker. Nuova suite di **67 test**: 29 blocchi compilati, un controllo di versione, 36 gruppi Node e un caso browser con piu input.
- Regressione seriale delle due suite: **119 test superati**, zero fallimenti o test saltati, circa 73 secondi. Confermati anche i 52 test precedenti dopo l'estrazione del supporto comune.
- Verificati output, diagnostici attesi, readonly/tuple, optional/exact, enum, guard, overload e dizionari. Controprove con guard, lookup e implementazione di overload volutamente errati soltanto nelle fixture in memoria.
- DOM in browser isolato: input valido, valore non conforme a una email comunque letto, campo mancante, elemento errato e altro realm. Browser chiuso dopo la prova; nessuna richiesta a un servizio reale.
- Limiti: non ogni frammento inline, matrice di toolchain/browser, parser CSV, validazione email completa, backend o sicurezza contro getter/Proxy ostili. Suite React e JavaScript non rieseguite.

### Verifica del vault

- content:check con report: **911 documenti raggiungibili, zero errori e 532 avvisi editoriali**, sette in meno.
- content:test: **9 test superati**, separati dalle prove TypeScript.
- Build Quartz riuscita: **3.719 file, 2.003 HTML, 168 redirect e 136.723 riferimenti verificati, zero errori**. Invariati gli avvisi preesistenti su eval del plugin note-properties e metadati Git della copia temporanea.
- QA delle sette pagine a 1440 x 1000 e 390 x 844, Chrome 155.0.8059.85: HTTP 200, contenuti aggiornati, nessun errore pagina/console/HTTP o overflow del documento. Scorrimento effettivo di 28 blocchi di codice e una tabella verificato su mobile.
- Quattro screenshot ispezionati di Oggetti e proprieta opzionali e Index Signatures. Anteprima esistente riutilizzata e lasciata attiva su http://localhost:8082/appunti/; browser QA chiusi, HTML e CSS non modificati manualmente. Prettier e diff --check superati; storico a dieci voci.

### Prossimo blocco

La revisione e proseguita con Programmazione ad Oggetti, documentato di seguito. Modifiche non ancora inviate con commit o push.

## 2026-10-20 - TypeScript: programmazione ad oggetti e generics

### Perimetro e correzioni

Lette e corrette le cinque note del terzo capitolo base: **19 note TypeScript su 83** in questa passata. Consultati indice, template e note correlate. Date, percorsi, publish, type e status non revisionato conservati; nessuna pagina nuova o spostata, nessun indice o redirect da aggiornare.

| Nota                                                                                                            | Correzioni                                                                                                                                                                                                                                                           |
| --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/TypeScript/Pagine/Classi\|Classi]]                                                             | Istanze/costruttori/statici, controllo di inizializzazione e limiti di !; timer monotono con clock iniettabile, this/bind/arrow, ordine dei campi, override e declare.                                                                                               |
| [[Programmazione/TypeScript/Pagine/Visibilita e modificatori di accesso\|Visibilita e modificatori di accesso]] | readonly distinto dalla visibilita; private/protected statici e #private runtime, compatibilita e riferimenti annidati. Sostituito l'esempio Password in chiaro con una factory per titoli; limiti runtime del costruttore privato e parameter properties espliciti. |
| [[Programmazione/TypeScript/Pagine/Classi astratte\|Classi astratte]]                                           | Divieto di new statico, metodi astratti eliminati e costruttore emesso; repository concreto in memoria con assenza/errori, firme new/abstract new e rischi degli hook nel costruttore.                                                                               |
| [[Programmazione/TypeScript/Pagine/Implementazione di interfacce\|Implementazione di interfacce]]               | implements come controllo del lato istanza, non inferenza o ereditarieta; proprieta opzionali non create, firma del costruttore e bivarianza. Sostituito il falso client SMTP con un test double dichiaratamente locale e verificato l'await di notify.              |
| [[Programmazione/TypeScript/Pagine/Generics\|Generics]]                                                         | Relazioni tra tipi e cancellazione runtime, literal, array vuoto, constraint e sottotipi. Controesempio esplicito di aggiornamento scorretto, preservazione dell'identita, slot generico e dati esterni distinti da contenitori tipizzati.                           |

### Fonti e prove

- Fonti ufficiali TypeScript, Node.js e MDN consultate e riportate nelle note. Baseline **TypeScript 5.9.3**, **Node 24.14.0**, nessuna nuova dipendenza.
- Nuova suite `_Meta/tests/typescript-oggetti-generics.test.mjs`: **54 casi**, 23 compilazioni dei blocchi, un controllo versione e 30 gruppi statici/runtime. Supporto condiviso riusato senza modifiche.
- Regressione seriale completa delle tre suite: **173 test superati**, 119 precedenti e 54 nuovi, zero fallimenti o test saltati, circa 109 secondi. Inclusa la prova DOM del blocco precedente; nessuna riesecuzione delle suite JavaScript/React.
- Prima esecuzione mirata 53/54 per un codice diagnostico atteso errato nel test, non per un esempio invalido. Corretto l'atteso per il literal con proprieta extra e aggiunta la verifica separata della variabile senza id.
- Verificati casi riusciti, assenza, rejection e controlli statici negativi. Controprove del codice che compila ma fallisce o viola il contratto: campi non pronti, metodi bivarianti, first senza undefined e sottotipo literal cambiato da uno spread.
- Limiti: non ogni frammento inline o versione di compilatore, loader, browser o target. Nessun SMTP, database, autenticazione, validazione email completa o sicurezza delle credenziali. Timer non usato come benchmark; esempi in memoria, non servizi esterni.

### Verifica del vault

- content:check con report: **911 documenti raggiungibili, zero errori e 527 avvisi editoriali**, cinque in meno.
- content:test: **9 test superati**, distinti dalle prove TypeScript.
- Build Quartz riuscita, ripetuta dopo la rifinitura della tabella: **3.719 file, 2.003 HTML, 168 redirect e 136.786 riferimenti verificati, zero errori**. Invariati gli avvisi preesistenti su eval del plugin note-properties e metadati Git della copia temporanea.
- QA finale delle cinque pagine a 1440 x 1000 e 390 x 844, Chrome 155.0.8059.85: HTTP 200, nuovi contenuti presenti, nessun errore pagina/console/HTTP o overflow del documento. Scorrimento effettivo di **22 blocchi di codice e una tabella** su mobile.
- Sei screenshot ispezionati: quattro nella prima passata e due della tabella dei modificatori dopo averne accorciato le celle e spostato i dettagli nel testo. La rifinitura non ha modificato gli snippet gia collaudati. Nessuna modifica manuale a CSS/HTML.
- Anteprima esistente su http://localhost:8082/appunti/ riutilizzata e lasciata attiva; browser QA chiusi. Prettier, diff --check, metadati e titoli controllati; storico mantenuto a dieci voci.

### Prossimo blocco

La revisione e proseguita con Narrowing e Controllo dei Tipi, documentato di seguito. Nessun commit o push della revisione TypeScript.

## 2026-10-20 - TypeScript: narrowing e controllo dei tipi

### Perimetro e correzioni

Revisionate le sei note del primo capitolo intermedio: **25 note TypeScript su 83** in questa passata. Letti indice, template e note correlate su validazione/guardie runtime. Conservati date, percorsi, type, publish e status non revisionato; nessuna nota creata o spostata, nessuna modifica a indice o redirect.

| Nota                                                                                  | Correzioni                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/TypeScript/Pagine/Type Narrowing\|Type Narrowing]]                   | Tipo dichiarato e tipo nel flusso, uscite anticipate, truthiness/nullish, snapshot e alias, closure. Riparato prerequisites YAML spezzato per any/unknown/never.                                                |
| [[Programmazione/TypeScript/Pagine/Type Guards\|Type Guards]]                         | Differenze fra typeof, in, hasOwn, instanceof e Array.isArray; policy JSON con campi propri e limiti, array sparsi e mutazioni successive. Prerequisites YAML riparato.                                         |
| [[Programmazione/TypeScript/Pagine/Discriminated Unions\|Discriminated Unions]]       | Relazione tag/payload, successo vuoto, widening e satisfies, destructuring const rispetto a let/rest. Formatter distinto da pagamento/validazione e stato distinto da transizione.                              |
| [[Programmazione/TypeScript/Pagine/Exhaustiveness Checking\|Exhaustiveness Checking]] | never statico e throw runtime, nuova variante e cast elusivo, ritorni rispetto a copertura, mapping Record. Rimossa serializzazione automatica del payload dagli errori; prerequisites YAML riparato.           |
| [[Programmazione/TypeScript/Pagine/Type predicates\|Type predicates]]                 | Contratto anche del ramo false, categoria number, modello interno distinto da validazione/autorizzazione, filtri inferiti da TS 5.5, Boolean e NonNullable. Controesempio esplicito di classificatore parziale. |
| [[Programmazione/TypeScript/Pagine/Assertion functions\|Assertion functions]]         | Ritorno normale, fiducia del checker e throw non generato, config solo strutturale, asserts condition, NonNullable, arrow annotata, catch e async. Related YAML riparato.                                       |

### Fonti e prove

- Consultate e citate fonti ufficiali TypeScript e MDN. Baseline **TypeScript 5.9.3**, **Node 24.14.0**; dipendenze invariate. I riferimenti a funzionalita introdotte in versioni precedenti non significano che quelle versioni siano state tutte eseguite.
- Nuova suite `_Meta/tests/typescript-narrowing.test.mjs`: **62 test**, 26 compilazioni dei blocchi, un controllo versione e 35 gruppi statici/runtime. Verifiche tra realm con VM Node, non una nuova matrice browser.
- Regressione seriale delle quattro suite: **235 test superati**, 173 precedenti e 62 nuovi, zero fallimenti o test saltati, circa 149 secondi. Inclusa la prova DOM precedente; suite JavaScript e React non rieseguite.
- Prima esecuzione 61/62 per un'aspettativa errata del test su una riscrittura con ternario, che non conserva il narrowing. Confermati i controlli nullish diretti e trasformato il ternario in controprova negativa. Tutti i 26 blocchi delle note compilavano gia.
- Provati input validi/invalidi, nullish/falsy, payload mancanti, array sparsi, proprieta ereditate, alias mutati, ritorni e diagnostici. Controprove di predicate/assertion ingannevoli e di cast a never soltanto nelle fixture; blocco unsafe in nota chiaramente etichettato.
- Limiti: non tutti i frammenti inline, compilatori, browser o schemi; nessuna protezione universale contro Proxy/getter/iteratori ostili, autorizzazione, pagamento o validazione URL. Nessuna richiesta applicativa a servizi esterni.

### Verifica del vault

- content:check con report: **911 documenti raggiungibili, zero errori e 522 avvisi editoriali**; nessuno relativo alle sei note del blocco.
- content:test: **9 test superati**, separati dalle prove TypeScript.
- Build Quartz riuscita: **3.719 file, 2.003 HTML, 168 redirect e 136.859 riferimenti verificati, zero errori**. Invariati gli avvisi preesistenti su eval del plugin note-properties e metadati Git della copia temporanea.
- QA delle sei pagine a 1440 x 1000 e 390 x 844, Chrome 155.0.8059.85: HTTP 200, contenuti aggiornati presenti, nessun errore pagina/console/HTTP o overflow del documento. Scorrimento effettivo di **25 blocchi di codice** verificato su mobile.
- Quattro screenshot ispezionati di Type predicates e Assertion functions, desktop e mobile. Anteprima esistente riutilizzata e lasciata attiva su http://localhost:8082/appunti/; browser QA chiusi. Nessuna modifica manuale a CSS/HTML.
- Prettier e diff --check superati; metadati conservati e storico mantenuto a dieci voci. Nessuna dipendenza o configurazione di pubblicazione modificata.

### Prossimo blocco

La revisione e proseguita con Tipi Avanzati, documentato di seguito. Nessun commit o push; lo status resta non revisionato fino al controllo dell'utente.

## 2026-10-21 - TypeScript: tipi avanzati

### Perimetro e correzioni

Revisionate le nove note del capitolo Tipi Avanzati: **34 note TypeScript su 83**. Letti indice, template e note correlate per tenere separati gli approfondimenti successivi. Conservati date, percorsi, type, publish e status; nessuna nota creata o spostata, nessuna modifica a indici o redirect.

| Nota                                                                                          | Correzioni                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/TypeScript/Pagine/Generics avanzati\|Generics avanzati]]                     | Vincoli rispetto al sottotipo, chiave/valore, default, readonly e limiti del repository in memoria: sostituzione, identita e chiave non aggiornata.                                 |
| [[Programmazione/TypeScript/Pagine/Conditional Types\|Conditional Types]]                     | Assegnabilita, distribuzione del parametro e non della union concreta, never/any/unknown, tuple wrapper, unwrap singolo rispetto ad Awaited e filtro statico.                       |
| [[Programmazione/TypeScript/Pagine/Mapped Types\|Mapped Types]]                               | Stato del form costruito realmente, propagazione modificatori, exactOptionalPropertyTypes, readonly superficiale, remapping/filtro/collisioni e mancata rimozione dei dati runtime. |
| [[Programmazione/TypeScript/Pagine/Template Literal Types\|Template Literal Types]]           | Prodotto cartesiano, nome/payload correlati, funzione di log non emitter, parser del solo prefisso con suffisso vuoto, limiti di pattern e casing.                                  |
| [[Programmazione/TypeScript/Pagine/Indexed Access Types\|Indexed Access Types]]               | Tipo del campo rispetto al literal, indici di tuple/array, noUncheckedIndexedAccess, letture opzionali e NonNullable non validante.                                                 |
| [[Programmazione/TypeScript/Pagine/Keyof e typeof\|Keyof e typeof]]                           | Getter generico preciso, typeof statico/runtime, chiavi numeriche/symbol e comuni alle union, Object.keys non equivalente alla vista strutturale.                                   |
| [[Programmazione/TypeScript/Pagine/Infer nei Conditional Types\|Infer nei Conditional Types]] | Ritorno statico, never[] rispetto a unknown[], readonly e tuple vuote/aperte, constraint su infer, ultima firma di overload e declare senza implementazione.                        |
| [[Programmazione/TypeScript/Pagine/Recursive types\|Recursive types]]                         | Tipi ricorsivi rispetto a visite, limiti del modello JSON, cicli e numeri non finiti, caso base, readonly profondo limitato a dati semplici e alias mutabili.                       |
| [[Programmazione/TypeScript/Pagine/Variadic tuple types\|Variadic tuple types]]               | Riparato prerequisites YAML, tuple/array e label, input readonly rispetto al risultato, wrapper senza log degli argomenti, this/Promise/errori, concat e partial application.       |

### Fonti e prove

- Consultate fonti ufficiali TypeScript e MDN, citate nelle note. Baseline **TypeScript 5.9.3**, **Node 24.14.0** e dipendenze esistenti; nessun aggiornamento del compilatore. I riferimenti alle release di introduzione non sono una matrice di esecuzione su quelle release.
- Prima compilazione dei **34 blocchi TypeScript**: zero diagnostici. Aggiunta `_Meta/tests/typescript-tipi-avanzati.test.mjs`, con supporto condiviso invariato, per verificare risultati type-level e contratti runtime.
- Nuova suite riuscita al primo tentativo: **66/66 test**, 34 compilazioni, un controllo versione e 31 gruppi statici/runtime, zero fallimenti o test saltati, circa 106 secondi.
- Regressione seriale delle cinque suite: **301 test superati**, 235 precedenti e 66 nuovi, zero fallimenti o test saltati, circa 290 secondi. Inclusa la prova DOM preesistente; suite JavaScript/React non rieseguite. Build avviata solo dopo la conclusione della regressione.
- Limiti: non ogni frammento inline, versione o configurazione; nessun database, servizio email, sistema di eventi, validatore JSON universale, autenticazione o benchmark. Le strutture cicliche non sono attraversate senza limiti; il test di istanziazione ricorsiva verifica il diagnostico del checker, non una profondita universale.

### Verifica del vault

- content:check con report: **911 documenti raggiungibili, zero errori e 514 avvisi editoriali**, otto in meno; nessuno relativo alle nove note del capitolo.
- content:test: **9 test superati**, distinti dalle prove TypeScript. Metadati, H1 e limite di dieci voci nello storico verificati con il parser del vault.
- Build Quartz riuscita: **3.719 file, 2.003 HTML, 168 redirect e 136.945 riferimenti verificati, zero errori**. Invariati gli avvisi preesistenti su eval nel plugin note-properties e metadati Git della copia temporanea.
- QA delle nove pagine a 1440 x 1000 e 390 x 844, Chrome 155.0.8059.85: HTTP 200, nuovi contenuti presenti, nessun errore pagina/console/HTTP o overflow del documento. Scorrimento effettivo di **32 blocchi di codice** su mobile.
- Quattro screenshot ispezionati di Mapped Types e Variadic tuple types, desktop e mobile. Prima verifica interrotta da un marcatore testuale che usava apostrofi ASCII, mentre Quartz li rende tipografici; verificato il testo renderizzato e ripetuto l'intero controllo con marcatori indipendenti dalla punteggiatura, senza modificare le note.
- L'anteprima precedente non era attiva: verificata libera la porta 8082, riavviato il server in background senza finestra e lasciato disponibile su http://localhost:8082/appunti/. Browser QA chiusi; nessuna modifica manuale a HTML/CSS.
- Prettier e diff --check superati. Nessuna dipendenza, lockfile o configurazione di pubblicazione modificata; storico mantenuto a dieci voci.

### Prossimo blocco

La revisione e proseguita con Moduli e Configurazione, documentato di seguito. Nessun commit o push della revisione TypeScript.

## 2026-10-21 - TypeScript: moduli e configurazione

### Perimetro e correzioni

Revisionate le sette note del capitolo: **41 note TypeScript su 83** in questa passata. Conservati date, percorsi, type, publish e status non revisionato; nessuna pagina nuova o spostata, nessun indice o redirect da modificare.

| Nota                                                                                  | Correzioni                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/TypeScript/Pagine/tsconfig\|tsconfig]]                               | Distinti selezione dei file, import, rootDir, target/lib/types, controllo ed emissione. Config Node completa, comandi diagnostici, ereditarieta e limiti di skipLibCheck; output precedenti non eliminati da noEmit/noEmitOnError. |
| [[Programmazione/TypeScript/Pagine/Moduli ES e CommonJS\|Moduli ES e CommonJS]]       | Separati esempi ESM e CommonJS, package type ed estensioni runtime. NodeNext per file, import type, verbatimModuleSyntax, interop e limiti di require(ESM) in Node 24.                                                             |
| [[Programmazione/TypeScript/Pagine/Module resolution\|Module resolution]]             | Distinti tipi e implementazioni, NodeNext/Bundler, export map e sottopercorsi pubblici. Esempio completo mediante config condivisa, traceResolution e diagnosi dell'output.                                                        |
| [[Programmazione/TypeScript/Pagine/Path aliases\|Path aliases]]                       | baseUrl non obbligatorio e nessuna riscrittura da paths. Due progetti verificabili: bundle esbuild e package imports # nativi Node, con prerequisiti e metadati da distribuire.                                                    |
| [[Programmazione/TypeScript/Pagine/Project references\|Project references]]           | Risolta incoerenza app/api. Grafo domain/api completo, build da zero, dichiarazioni e cache, -p rispetto a -b, stopBuildOnErrors, output vecchi e pulizia limitata agli artefatti riconosciuti.                                    |
| [[Programmazione/TypeScript/Pagine/Strict mode\|Strict mode]]                         | Famiglia di flag esplicita nella baseline 5.9.3, opzioni aggiuntive, null, indici e optional esatti. Distinti any, validazione runtime e strict JavaScript; riparato prerequisites YAML spezzato.                                  |
| [[Programmazione/TypeScript/Pagine/Source maps e debugging\|Source maps e debugging]] | Progetto compilato e errore intenzionale, confronto degli stack con flag Node, mappe esterne/inline e contenuto sorgente. Procedura Inspector locale, catena delle trasformazioni e pubblicazione privata delle mappe.             |

### Fonti e prove

- Fonti ufficiali TypeScript, Node.js ed esbuild consultate e riportate nelle note. Baseline **TypeScript 5.9.3**, **Node 24.14.0**, **esbuild 0.27.3**. Nessuna dipendenza o lockfile modificato.
- Nuova suite `_Meta/tests/typescript-moduli-configurazione.test.mjs`: **31 test superati al primo tentativo**, circa 49 secondi. Configurazioni e snippet estratti dai Markdown, CLI del compilatore ed esbuild reali, output eseguito in Node.
- Regressione seriale completa delle sei suite: **332 test superati**, 301 precedenti e 31 nuovi, zero fallimenti o test saltati, circa 460 secondi. Inclusa la prova DOM precedente; suite JavaScript/React non rieseguite. Build Quartz avviata soltanto a regressione conclusa.
- Provati anche gli errori attesi: import ESM senza estensione, export privato, dichiarazione senza JavaScript, alias non riscritto, package imports mancanti, dipendenza non compilata, progetto senza composite, opzioni source map incompatibili e controlli strict aggiuntivi.
- Le fixture usano `@types/node` 25.3.0 gia presente in site, tramite typeRoots temporaneo; gli esempi vengono eseguiti in Node 24. Non e una certificazione generale di compatibilita tra quelle due major. La suite richiede le versioni fissate e non installa pacchetti.
- Directory temporanee rimosse dopo verifica del percorso assoluto. Nessun servizio remoto, dato reale, pubblicazione di pacchetti o modifica al browser personale. Non sono testati tutti i target, toolchain, flag, breakpoint o prestazioni; la procedura Inspector e documentata ma non avviata. La riga TypeScript nello stack e invece verificata automaticamente.

### Verifica del vault

- content:check con report: **911 documenti raggiungibili, zero errori e 507 avvisi editoriali**, sette in meno; nessuno nelle sette note. Metadati, H1 e prerequisiti verificati.
- content:test: **9 test della trasformazione superati**, distinti dalle prove TypeScript.
- Prima build Quartz riuscita: **3.719 file, 2.003 HTML, 168 redirect e 137.013 riferimenti verificati, zero errori**. Soltanto gli avvisi preesistenti su eval del plugin note-properties e metadati Git nella copia temporanea.
- Prima QA delle sette pagine a 1440 x 1000 e 390 x 844, Chrome 155.0.8059.85: HTTP 200, contenuti aggiornati, nessun errore pagina/console/HTTP o overflow del documento. Verificato lo scorrimento di 19 blocchi di codice e due tabelle su mobile.
- Cinque screenshot iniziali ispezionati. La tabella dei flag strict era scorrevole ma poco leggibile su mobile: convertita in elenco senza cambiare informazioni, configurazioni o snippet gia testati. Nessuna modifica manuale a HTML/CSS.
- Build finale dopo la rifinitura riuscita con gli stessi conteggi: **3.719 file, 2.003 HTML, 168 redirect, 137.013 riferimenti e zero errori**. Ripetuta la QA delle sette pagine sui due viewport: nessun errore pagina/console/HTTP o overflow, scorrimento effettivo di 19 blocchi di codice e una tabella su mobile.
- Altri due screenshot di Strict mode ispezionati, desktop e mobile: elenco leggibile senza scorrimento orizzontale. Sette screenshot complessivi; snippet e configurazioni invariati rispetto ai 332 test superati.
- Anteprima esistente su http://localhost:8082/appunti/ riutilizzata e lasciata attiva; browser QA chiusi. Prettier e diff --check superati, storico mantenuto a dieci voci. Nessun HTML/CSS, dipendenza o configurazione di pubblicazione modificati manualmente.

### Prossimo blocco

La revisione e proseguita con Utility e Pattern di Tipo, documentato di seguito. Nessun commit o push della revisione TypeScript.

## 2026-10-22 - TypeScript: utility e pattern di tipo

### Perimetro e correzioni

Revisionate le sei note del capitolo: **47 note TypeScript su 83**. Conservati date, percorsi, type, publish e status non revisionato. Nessuna pagina nuova o spostata, nessun indice o redirect da aggiornare.

| Nota                                                                                            | Correzioni                                                                                                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [[Programmazione/TypeScript/Pagine/Utility Types\|Utility Types]]                               | Omit distinto dalla proiezione runtime e dalla serializzazione; allowlist dei campi aggiornabili, patch esplicita con undefined/falsy, utility standard, Record, overload, Awaited e NoInfer. Collegamenti related YAML resi riferimenti a note esistenti. |
| [[Programmazione/TypeScript/Pagine/Utility Types personalizzati\|Utility Types personalizzati]] | Nullable superficiale con modificatori conservati, RequireKeys composto e funzione con garanzie limitate; null/undefined ed exact, Omit distributivo con discriminanti. Rimando alla ricorsione invece di duplicare una falsa utility universale.          |
| [[Programmazione/TypeScript/Pagine/Brand Types\|Brand Types]]                                   | Sostituito il controllo email includes-at con due parser di ID dal formato dimostrativo esplicito; unknown, lunghezza e newline, unique symbol, brand cancellato, assertion, serializzazione e autorizzazione separata.                                    |
| [[Programmazione/TypeScript/Pagine/satisfies operator\|satisfies operator]]                     | Controllo statico distinto da conversione e validazione; inferenza contestuale di stringhe/booleani, stato mutabile annotato, chiavi finite/aperte, excess property checks, campi extra e optional non materializzati.                                     |
| [[Programmazione/TypeScript/Pagine/as const\|as const]]                                         | Binding rispetto a contenuto, tuple, riferimenti condivisi, copie e funzioni readonly, limiti sintattici e contesto mutabile. Nessuna promessa di freeze profondo.                                                                                         |
| [[Programmazione/TypeScript/Pagine/const type parameters\|const type parameters]]               | Inferenza dei literal in chiamata, perdita nelle variabili, identita runtime e vincoli. Tupla mutabile precisa nella baseline, non fallback automatico a string[]; compatibilita delle dichiarazioni distinta dal runtime.                                 |

### Fonti e prove

- Consultate fonti ufficiali TypeScript, interventi dei manutentori e MDN; riferimenti nelle note. Baseline **TypeScript 5.9.3**, **Node 24.14.0**. Nessun aggiornamento di dipendenze o lockfile.
- Un controllo preliminare sul checker ha smentito l'aspettativa di fallback a string[] derivata dalle vecchie release note 5.0. Verificata la modifica ufficiale nella PR 55229 e aggiornati sia const type parameters sia as const. Non eseguita una matrice di compilatori storici.
- Nuova suite `_Meta/tests/typescript-utility-pattern.test.mjs`: **52/52 test superati al primo tentativo**, circa 99 secondi. Ventuno blocchi estratti dai Markdown e compilati in strict, un controllo della versione e 30 gruppi statici/runtime; supporto condiviso invariato.
- Regressione seriale delle sette suite: **384 test superati**, 332 precedenti e 52 nuovi, nessun fallimento o test saltato, circa 561 secondi. Compresa la prova DOM preesistente con Playwright/Chrome; suite JavaScript e React non rieseguite. Build avviata soltanto a regressione conclusa.
- Testati risultati e diagnostici attesi, serializzazione senza campo riservato dopo proiezione, patch con zero/undefined, optional con exact attivo/disattivo, union e modificatori, parser con prefissi errati/newline, brand incompatibili, JSON, alias e mutazioni. Controprove con any/assertion soltanto nelle fixture.
- Limiti: una baseline, non ogni frammento inline, utility, piattaforma o versione. Nessun backend, database, invio email, standard UUID, validazione completa di email/URL, autorizzazione o prova universale di immutabilita. Gli esempi di patch e draft dichiarano esplicitamente le verifiche che non eseguono.

### Verifica del vault

- content:check con report: **911 documenti raggiungibili, zero errori e 501 avvisi editoriali**, sei in meno; nessuno relativo alle sei note. Metadati, data, H1 e fonti controllati con il parser del vault.
- content:test: **9 test della trasformazione superati**, distinti dalle prove TypeScript.
- Build Quartz riuscita: **3.719 file, 2.003 HTML, 168 redirect e 137.082 riferimenti verificati, zero errori**. Invariati gli avvisi su eval nel plugin note-properties e metadati Git della copia temporanea.
- QA delle sei pagine a 1440 x 1000 e 390 x 844, Chrome 155.0.8059.85: HTTP 200, nuovi contenuti presenti, nessun errore pagina/console/HTTP o overflow del documento. Scorrimento effettivo verificato per **19 blocchi di codice** su mobile.
- Quattro screenshot ispezionati di as const e const type parameters, desktop/mobile. Testo e gerarchia leggibili, blocchi lunghi contenuti nel proprio scroller. Nessuna modifica manuale a HTML/CSS.
- Anteprima esistente su http://localhost:8082/appunti/ riutilizzata e lasciata attiva; browser QA chiuso e scheda personale non modificata. Prettier e diff --check superati; storico mantenuto a dieci voci, eliminata la voce operativa piu vecchia secondo la convenzione del vault.

### Prossimo blocco

La revisione e proseguita con Type System in Profondita, documentato di seguito. Nessun commit o push.

## 2026-10-22 - TypeScript: type system in profondita

### Perimetro e correzioni

Revisionate tutte le otto note del capitolo: **55 note uniche TypeScript su 83**. Conservati date, percorsi, type, publish e status non revisionato. Nessuna nuova pagina, spostamento, modifica a indici o redirect.

- [[Programmazione/TypeScript/Pagine/Structural typing|Structural typing]]: compatibilita direzionale, proprieta in eccesso, campi non rimossi, identita runtime, classi private, weak types e contratti minimi.
- [[Programmazione/TypeScript/Pagine/Variance|Variance]]: reader/writer, invarianza, proprieta funzione rispetto a metodi, array mutabili, viste readonly e limiti delle annotazioni in/out.
- [[Programmazione/TypeScript/Pagine/Distributive conditional types|Distributive conditional types]]: parametro nudo, wrapper, union concreta, filtri, array misti, never/any/unknown e distribuzione annidata.
- [[Programmazione/TypeScript/Pagine/Type inference avanzata|Type inference avanzata]]: contextual typing, const, widening e default dei generics. La Map sostituisce il cast a Record totale, che prometteva chiavi non necessariamente presenti.
- [[Programmazione/TypeScript/Pagine/Declaration Merging|Declaration Merging]]: ambiti, conflitti, overload, Window tramite export e declare global; controesempio di interfaccia che non inizializza i campi della classe.
- [[Programmazione/TypeScript/Pagine/Module augmentation|Module augmentation]]: progetto ESM completo, differenza dai moduli ambient, specifier, implementazione e import del plugin; limiti di alias/default export e integrazioni opzionali.
- [[Programmazione/TypeScript/Pagine/Namespace|Namespace]]: valori emessi rispetto a soli tipi, merging, visibilita dei membri, namespace ambient, ambito globale/modulo e vincoli della pipeline.
- [[Programmazione/TypeScript/Pagine/Decorators|Decorators]]: modalita moderna/legacy, this/argomenti/ritorno, ordine di applicazione, inizializzazione dei field, comandi reali e metadati distinti.

### Fonti e prove

- Consultate fonti ufficiali TypeScript e aggiunte nelle note. Baseline **TypeScript 5.9.3**, **Node 24.14.0**. Nessuna dipendenza, lockfile o configurazione del sito modificati.
- Nuova suite `_Meta/tests/typescript-type-system.test.mjs`: **51 test**, con 35 blocchi TypeScript e due configurazioni JSON estratti dalle note, controllo statico, esecuzione Node e una prova DOM reale in Chrome. Progetti multifile e comandi CLI usano il compilatore installato.
- Primo giro: **50/51 superati**, circa 77 secondi. La sola mancata corrispondenza riguardava il diagnostico atteso nella fixture di dichiarazione ambient: il consumer riporta TS2307, non TS2664. Corretta l'aspettativa e superata la prova mirata; il caso .ts con augmentation verso modulo inesistente verifica distintamente TS2664.
- Le prove includono errori statici previsti e fallimenti runtime intenzionali intercettati: metodo bivariante, array mutato, campo mai inizializzato, plugin non caricato, namespace ambient e metodo estratto senza ricevitore.
- Limiti: una baseline, non una matrice di compilatori/runtime. Nessun test di framework Express, dependency injection, reflect-metadata o Symbol.metadata. La prova Window esegue l'emit CommonJS con uno shim exports in un DOM reale; non certifica un'applicazione browser ESM completa.
- Directory temporanee rimosse solo dopo verifica dei percorsi; nessun servizio remoto, pacchetto installato, credenziale o browser personale. Supporto condiviso dei test invariato.
- Regressione seriale completa delle otto suite: **435 test superati**, 384 precedenti e 51 nuovi, nessun fallimento o test saltato, circa 662 secondi. Incluse le prove DOM; suite JavaScript/React non rieseguite. Build Quartz avviata soltanto a regressione conclusa.

### Verifica del vault

- content:check con report: **911 documenti raggiungibili, zero errori e 495 avvisi editoriali**, sei in meno. Nessuno relativo alle otto note.
- content:test: **9 test della trasformazione superati**. Metadati, H1 e conteggi dell'indice controllati separatamente.
- Build Quartz riuscita: **3.719 file, 2.003 HTML, 168 redirect e 137.198 riferimenti verificati, zero errori**. Circa cinque minuti; solo gli avvisi preesistenti su eval del plugin note-properties e metadati Git nella copia temporanea.
- QA delle otto pagine a **1440 x 1000** e **390 x 844**, Chrome **155.0.8059.85**: HTTP 200, contenuti aggiornati, nessun errore pagina/console/HTTP o overflow del documento. Scorrimento effettivo verificato per **34 blocchi su mobile** e due comandi lunghi su desktop.
- Ispezionati sei screenshot di Variance, Module augmentation e Decorators, desktop/mobile. Gerarchia e testo leggibili; codice lungo confinato negli scroller. Nessuna modifica manuale a HTML/CSS.
- Anteprima esistente su http://localhost:8082/appunti/ riutilizzata e lasciata attiva; browser QA chiuso. Prettier, diff --check e dieci voci dello storico verificati. I conteggi sono su note uniche: Declaration Merging compare in due capitoli dell'indice ma conta una sola volta.

### Prossimo blocco

La revisione e proseguita con Interoperabilita con JavaScript, documentata di seguito. Declaration Merging resta conteggiata una sola volta.

## 2026-10-22 - TypeScript: interoperabilita con JavaScript

### Perimetro e correzioni

Revisionate le sei note non ancora coperte del capitolo: **61 note TypeScript uniche su 83**. Declaration Merging era gia revisionata e non viene ricontata. Conservati date, percorsi, type, publish e status non revisionato. Nessuna nota nuova o spostata; nessun indice o redirect da modificare.

| Nota                                                                                                              | Correzioni                                                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [[Programmazione/TypeScript/Pagine/Migrazione da JavaScript a TypeScript\|Migrazione da JavaScript a TypeScript]] | Separati inclusione, controllo ed emissione; progetto ESM completo prima/dopo, JS non controllato e any, import runtime coerenti e output obsoleti. Riparato il riferimento YAML alla nota any/unknown/never.                  |
| [[Programmazione/TypeScript/Pagine/Typing di librerie JavaScript\|Typing di librerie JavaScript]]                 | Modulo CommonJS locale reale con d.cts, unknown e controlli espliciti; stringify puo restituire undefined o fallire. Distinti dichiarazione, implementazione distribuita, modulo ambient, augmentation e wrapper.              |
| [[Programmazione/TypeScript/Pagine/JSDoc e type checking in JavaScript\|JSDoc e type checking in JavaScript]]     | checkJs e direttive per file, generics e array vuoti, type/satisfies, import solo di tipi e generazione dichiarazioni. Corretta l'idea che JSDoc serva solo a tipi semplici o debba essere necessariamente abbandonato.        |
| [[Programmazione/TypeScript/Pagine/Dichiarazioni e file d.ts\|Dichiarazioni e file d.ts]]                         | Progetto ESM con sorgente, output e consumer, tipi pubblici ed exports. Scope dei file, suffissi, emitDeclarationOnly, global augmentation e dipendenze delle dichiarazioni distinti dal runtime.                              |
| [[Programmazione/TypeScript/Pagine/DefinitelyTyped\|DefinitelyTyped]]                                             | Versioni e dipendenze dei tipi, pacchetti scoped, types/typeRoots e import espliciti. Debounce reale con flush/cancel; compatibilita limitata all'API verificata, non a tutta la libreria.                                     |
| [[Programmazione/TypeScript/Pagine/Generazione di tipi da API\|Generazione di tipi da API]]                       | Schema OpenAPI locale completo, generatore fissato e consumer compilabile. Presenza/nullabilita, check dell'output, errori HTTP/JSON e parser esplicito; nessun client o validatore attribuito alla sola generazione dei tipi. |

### Fonti e prove

- Fonti ufficiali TypeScript, DefinitelyTyped, Lodash, OpenAPI e openapi-typescript, piu MDN per JSON; riferimenti nelle note. Baseline **TypeScript 5.9.3**, **Node 24.14.0**, **openapi-typescript 7.13.0**, **Lodash 4.18.1**, **@types/lodash 4.17.27**.
- Strumenti aggiuntivi installati in una cartella temporanea esterna con script di installazione disabilitati. Nessuna dipendenza o lockfile del vault/site modificati. Versioni e procedura riproducibile in `_Meta/tests/README.md`.
- Nuova suite `_Meta/tests/typescript-interoperabilita.test.mjs`: **33/33 test riusciti al primo giro**, circa 94 secondi. Un controllo baseline, sei editoriali e 26 gruppi statici/runtime; 17 blocchi JS/TS, 11 configurazioni JSON e uno schema OpenAPI estratti dai Markdown.
- Regressione mirata seriale: **115 test superati**, 33 nuovi + 31 Moduli e Configurazione + 51 Type System, zero fallimenti o test saltati, circa 219 secondi. Inclusa la prova DOM precedente. Build avviata solo dopo la conclusione dei test.
- Le altre sei suite TypeScript e le suite JavaScript/React non sono state rieseguite; il precedente risultato completo da 435 test rimane distinto. Nessuna modifica al supporto condiviso dei test.
- Provati noEmit/noEmitOnError e artefatti vecchi, checkJs/direttive, dichiarazioni false o senza runtime, firme JSDoc, emissione d.ts, exports, globali non inizializzati, pacchetti @types reali e debounce.
- La CLI OpenAPI reale verifica schema valido/invalido, required/nullable, file mancante/obsoleto e consumer incompatibile dopo rigenerazione. Fetch e simulato: URL codificata, HTTP 404, JSON malformato, 204, dati inattesi ed errore di rete. Nessuna richiesta a servizi remoti.
- Limiti: una baseline e Windows, non tutte le versioni o API Lodash. Nessuna pubblicazione npm, integrazione GraphQL/Prisma/RPC o validazione completa del contratto API. Il parser proietta id/email e non verifica formato email, nickname o autorizzazione. Fixture ripulite dopo controllo dei percorsi assoluti; browser di test chiuso, browser personale non modificato.

### Verifica del vault

- content:check con report: **911 documenti raggiungibili, zero errori e 490 avvisi editoriali**, cinque in meno; nessuno nelle sei note. Metadati, H1, fonti e comandi separati verificati.
- content:test: **9 test della trasformazione superati**, distinti dalle prove TypeScript.
- Build Quartz riuscita: **3.719 file, 2.003 HTML, 168 redirect e 137.286 riferimenti verificati, zero errori**. Restano soltanto gli avvisi preesistenti su eval del plugin note-properties e metadati Git nella copia temporanea.
- QA delle sei pagine a **1440 x 1000** e **390 x 844**, Chrome **155.0.8059.85**: HTTP 200, contenuti aggiornati, nessun errore pagina/console/HTTP o overflow del documento. Verificato lo scorrimento effettivo di **22 blocchi di codice su mobile**; nessuno richiede scorrimento su desktop.
- Ispezionati sei screenshot di Migrazione, JSDoc e Generazione di tipi da API, desktop/mobile. Titoli e testo leggibili, codice lungo confinato nei propri scroller. Nessuna modifica manuale a HTML o CSS.
- Anteprima esistente su http://localhost:8082/appunti/ riutilizzata e lasciata attiva; browser QA chiuso. Conteggio verificato dall'indice e dal registro: 83 note uniche, 61 revisionate tecnicamente, 22 rimanenti. Storico mantenuto a dieci voci.

### Prossimo blocco

La revisione e proseguita con Validazione e Confine Runtime, documentata di seguito. Nessun commit o push.

## 2026-10-22 - TypeScript: validazione e confine runtime

### Perimetro e correzioni

Revisionate tutte le cinque note del capitolo: **66 note TypeScript uniche su 83**. Conservati date, percorsi, type, publish e status non revisionato. Nessuna pagina aggiunta o spostata, nessun indice o redirect da aggiornare.

- [[Programmazione/TypeScript/Pagine/Validazione runtime e tipi statici|Validazione runtime e tipi statici]]: distinti decodifica, forma, proiezione e regole applicative; assertion che non converte, parser con campi propri e risultato pubblico, limiti di unknown, getter, mutazioni e autorizzazione. Riparato il prerequisito YAML any/unknown/never.
- [[Programmazione/TypeScript/Pagine/Schema validation con Zod|Schema validation con Zod]]: progetto ESM completo e versioni fissate, schema applicato ai dati, input/output e uso del risultato. Chiariti chiavi extra, coercion, assenza/null, default/prefault, errori propagati, metodi async e limiti della conversione JSON Schema.
- [[Programmazione/TypeScript/Pagine/Type guards runtime|Type guards runtime]]: promessa nei due rami, forma distinta da criteri di dominio, NaN/Infinity, proprieta ereditate, identita e mutazioni, array sparsi e falsa guardia basata su output trasformato.
- [[Programmazione/TypeScript/Pagine/Parsing sicuro di input esterni|Parsing sicuro di input esterni]]: parser di porta con sintassi e intervallo espliciti, rifiuto di booleani/array/oggetti senza coercion, errori discriminati. Documento JSON con limite del testo, forma e valore distinti; limiti di trasporto, duplicati e alias numerico dichiarati.
- [[Programmazione/TypeScript/Pagine/API contract|API contract]]: protocollo oltre i tipi statici, decoder locale per status e payload, proiezione dei campi e messaggi remoti non esposti. Distinti adapter HTTP, DTO, schema/generazione, compatibilita direzionale e test del provider.

### Fonti e prove

- Consultate fonti ufficiali TypeScript, Zod, MDN, OpenAPI e Node; riferimenti nelle note. Baseline **TypeScript 5.9.3**, **Node 24.14.0**, **Zod 4.6.7**.
- Zod installato soltanto in una directory temporanea esterna, con script di installazione disabilitati. Nessuna dipendenza o lockfile del sito modificati; istruzioni riproducibili nel README dei test.
- Nuova suite `_Meta/tests/typescript-validazione-runtime.test.mjs`: **47 test**, 13 blocchi TypeScript estratti dai Markdown in nove unita compilate, due configurazioni JSON e un progetto CLI NodeNext con quattro entry point ESM.
- Primo giro: **40/47 superati**, circa 78 secondi. Sette problemi del runner locale corretti: riferimenti importati/esportati nelle espressioni di verifica e Promise cross-realm della VM. Nessuna modifica ai supporti condivisi o indebolimento degli esempi; riesecuzione mirata Zod con 12 test riusciti, incluso il controllo editoriale.
- Provati payload validi/invalidi, null/array/ereditarieta, getter che lanciano, copie e mutazioni, vincoli Zod e inferenza, default e coercion, guardie e rami falsi, parser di porta con newline/estremi/tipi inattesi, JSON duplicato o troppo lungo, status e risposte errate.
- Regressione seriale mirata: **142 test superati**, 47 nuovi + 62 Narrowing + 33 Interoperabilita, nessun fallimento o test saltato, circa 227 secondi. Build Quartz avviata soltanto a test conclusi. Le altre suite TypeScript e quelle JavaScript/React non sono rieseguite; il precedente risultato completo da 435 test resta una verifica storica distinta.
- Limiti: una baseline su Windows, non tutte le versioni o i contesti cross-realm. Nessun servizio HTTP remoto, autenticazione, autorizzazione, transazione o verifica reale delle email. Il limite del testo non controlla download/memoria complessiva; i parser non isolano codice ostile e il decoder locale non collauda il provider. Fixture rimosse solo dopo verifica del percorso assoluto.

### Verifica del vault

- content:check con report: **911 documenti raggiungibili, zero errori e 486 avvisi editoriali**, quattro in meno; nessuno nelle cinque note. Metadati, H1, fonti e comandi separati verificati.
- content:test: **9 test della trasformazione superati**, distinti dalle prove TypeScript.
- Build Quartz riuscita: **3.719 file, 2.003 HTML, 168 redirect e 137.351 riferimenti verificati, zero errori**. Soltanto gli avvisi preesistenti su eval del plugin note-properties e metadati Git nella copia temporanea.
- QA delle cinque pagine a **1440 x 1000** e **390 x 844**, Chrome **155.0.8059.85**: HTTP 200, nuovi contenuti presenti, nessun errore pagina/console/HTTP o overflow del documento. Scorrimento effettivo verificato per **14 blocchi di codice su mobile**, nessuno necessario su desktop.
- Ispezionati sei screenshot di Zod, Parsing e API contract, desktop/mobile. Testo e gerarchia leggibili; codice lungo confinato nei propri scroller. Nessuna modifica manuale agli HTML/CSS.
- Anteprima esistente su http://localhost:8082/appunti/ riutilizzata e lasciata attiva; browser QA chiuso, browser personale non modificato. Prettier e diff --check superati. Conteggio verificato dall'indice: 83 note uniche, 66 revisionate tecnicamente e 17 rimanenti; storico mantenuto a dieci voci.

### Prossimo blocco

La revisione e proseguita con Framework e Applicazioni, documentato di seguito. Nessun commit o push.

## 2026-10-22 - TypeScript: framework e applicazioni

### Perimetro e correzioni

Revisionate tutte le sei note del capitolo: **72 note TypeScript uniche su 83**. Conservati date, percorsi, type, publish e status non revisionato. Nessuna pagina aggiunta o spostata; indici e redirect invariati.

- [[Programmazione/TypeScript/Pagine/TypeScript con React|TypeScript con React]]: progetto TSX/Vite completo, checker distinto dalla trasformazione, props/callback, stato nullable, eventi e ref con prova nel browser. Chiariti readonly, chiavi, children e limiti del typing.
- [[Programmazione/TypeScript/Pagine/TypeScript con Node.js|TypeScript con Node.js]]: CLI ESM reale, JSON e porta validati, argomenti e codici di uscita, percorsi da cwd e limiti di readFile. Distinti compilazione, loader e type stripping nativo senza checker.
- [[Programmazione/TypeScript/Pagine/API tipizzate|API tipizzate]]: eliminata la falsa creazione utente; client di anteprima con schema condiviso, input/output, status/content type, errori distinti e abort anche durante il body. Espliciti limiti di risposta, credenziali e risultato discriminato.
- [[Programmazione/TypeScript/Pagine/TypeScript con Express-Fastify|TypeScript con Express/Fastify]]: implementati entrambi i server con lo stesso protocollo, Zod, limiti e messaggi pubblici. Distinti parsing/schema, generic e validazione, error handler Express 5, lifecycle e validator/serializer Fastify.
- [[Programmazione/TypeScript/Pagine/TypeScript con Next.js|TypeScript con Next.js]]: params asincroni e PageProps generato, typedRoutes, typegen, build reale e confini server/client. Catalogo dichiarato come fixture, DTO proiettato, not-found e interazione locale; niente finto backend.
- [[Programmazione/TypeScript/Pagine/TypeScript monorepo|TypeScript monorepo]]: workspace npm completi, dipendenze, exports e references coerenti. Installazione/build/start reali, npm ci da output puliti e distinzione tra grafo npm, checker e runtime.

### Fonti e prove

- Fonti ufficiali React, Node, TypeScript, Vite, Express, Fastify, Next, npm, Zod e MDN; riferimenti nelle note.
- Baseline: **TypeScript 5.9.3**, **Node 24.14.0**, **npm 11.19.0**, **React 19.3.0**, **Vite 8.3.4**, plugin React **6.1.2**, **Next 16.4.1**, **Express 5.3.0**, **Fastify 5.12.7**, **Zod 4.6.7**. Tipi Node 24.19.2, React/DOM 19.3.0, Express 5.0.6.
- Toolchain installata in una directory temporanea esterna con script disabilitati; audit senza advisory. Nessuna modifica alle dipendenze o al lockfile Quartz. Procedura e limiti in `_Meta/tests/README.md`.
- Nuova suite `_Meta/tests/typescript-framework.test.mjs`: **29 gruppi**, con 21 blocchi TS/TSX, 15 JSON, un modulo JS e un HTML estratti dalle note.
- Primo giro **26/29 superati**, circa 44 secondi. Corretti problemi del runner: percorso CLI Vite non esportato, NODE_ENV lasciato da preview e cache non scrivibile attraverso junction Windows. Riprodotto separatamente l'errore filesystem; la cache React ora vive nella fixture reale, con link ai package. Riesecuzione React/workspace: **7/7 superati**. Nessuna modifica agli esempi richiesta dai fallimenti.
- Checker e runtime provano i progetti effettivi: build Vite e interazioni, CLI e stripping Node, errori del client e abort reale durante il body, HTTP Express/Fastify, typegen/build/HTTP/UI Next, npm install/ci e build workspace.
- Regressione seriale mirata: **107 test superati**, 29 Framework + 31 Moduli + 47 Validazione, nessun fallimento o test saltato, circa 183 secondi. Build Quartz avviata solo a test conclusi. Helper condivisi invariati; le altre suite TypeScript e le suite complete React/JavaScript non rieseguite.
- Limiti: una baseline Windows/Chrome, non ogni versione o piattaforma. Nessun database, autenticazione, integrazione remota, benchmark o deploy. Le factory dei server sono provate su porte libere; gli entry point con porte fisse sono compilati, non avviati. Next e dinamico, non export Pages. I controlli del campo interno riguardano il demo, non ogni possibile fuga di dati. Fixture e collegamenti ripuliti dopo verifica dei percorsi; browser e server di test chiusi.

### Verifica del vault

- content:check con report: **911 documenti raggiungibili, zero errori e 480 avvisi editoriali**, sei in meno; nessuno nelle sei note.
- content:test: **9 test della trasformazione superati**, distinti dalle prove tecniche.
- Build Quartz riuscita: **3.719 file, 2.003 HTML, 168 redirect e 137.422 riferimenti verificati, zero errori**. Restano soltanto gli avvisi preesistenti su eval del plugin note-properties e metadati Git nella copia temporanea.
- QA delle sei pagine a **1440 x 1000** e **390 x 844**, Chrome **155.0.8059.85**: HTTP 200, nuovi contenuti presenti, nessun errore pagina/console/HTTP o overflow del documento. Verificato lo scorrimento effettivo di **36 blocchi su mobile e uno su desktop**.
- Ispezionati sei screenshot di React, API tipizzate e Next, desktop/mobile: testo e gerarchia leggibili, codice lungo confinato nei propri scroller. Nessuna modifica manuale agli HTML/CSS.
- Anteprima esistente su http://localhost:8082/appunti/ riutilizzata e lasciata attiva; browser QA chiuso, browser personale non modificato. Prettier e diff --check superati. Conteggio verificato dall'indice e dalle note modificate: 83 note uniche, 72 revisionate tecnicamente e 11 rimanenti; storico mantenuto a dieci voci.

### Prossimo blocco

La revisione e proseguita con Qualita del Codice, documentata di seguito. Nessun commit o push.

## 2026-10-22 - TypeScript: qualita del codice

### Perimetro e correzioni

Revisionate tutte le sei note del capitolo: **78 note TypeScript uniche su 83**. Conservati date, percorsi, type, publish e status non revisionato. Nessuna pagina aggiunta o spostata; indici e redirect invariati. Riparati tre riferimenti YAML any/unknown/never spezzati.

- [[Programmazione/TypeScript/Pagine/Testing in TypeScript|Testing in TypeScript]]: progetto Vitest completo con checker separato, parser e dipendenza async, 13 casi runtime, limiti dei mock e differenza tra unit/integration/E2E/contract/type tests.
- [[Programmazione/TypeScript/Pagine/Linting e formattazione|Linting e formattazione]]: flat config ESLint con project service, perimetro esplicito e formatter separato. Corretto il ruolo di void: non gestisce rifiuti; policy ignoreVoid false verificata.
- [[Programmazione/TypeScript/Pagine/Best Practices|Best Practices]]: parser con politica prima della conversione, tipi ammessi e precisione espliciti. Chiariti Result ignorabile, readonly, assertion e confini runtime.
- [[Programmazione/TypeScript/Pagine/Error Handling|Error Handling]]: distinti assenza, input errato e I/O; catch ristretto, cause preservate, risultati e rifiuti possibili, messaggi pubblici separati. Demo senza file o backend fittizi.
- [[Programmazione/TypeScript/Pagine/Type-level testing|Type-level testing]]: progetto autonomo, test positivi/negativi, direttive inutilizzate, inferenza/any, limiti di Equal e verifica del reale perimetro. Rafforzato il caso readonly dopo una mutazione non rilevata.
- [[Programmazione/TypeScript/Pagine/ts-reset|ts-reset]]: setup .d.ts incluso, regola selettiva e preset distinto, effetti globali senza import runtime. Chiariti filter(Boolean), includes non guardia, JSON ancora lanciabile e limiti per librerie pubbliche.

### Fonti e prove

- Consultate fonti ufficiali TypeScript, Vitest, ESLint, typescript-eslint, Prettier, ts-reset e MDN; riferimenti nelle note. Verificati anche gli exports e le dichiarazioni del pacchetto ts-reset installato.
- Baseline: **TypeScript 5.9.3**, **Node 24.14.0**, **Vitest 4.1.12**, **Vite 8.3.4**, **ESLint 10.13.0**, **@eslint/js 10.0.1**, **typescript-eslint 8.72.0**, **Prettier 3.9.10**, **ts-reset 0.6.1**, tipi Node **24.19.2**.
- Toolchain temporanea esterna con script di installazione disabilitati. Il ramo ESLint 9 inizialmente controllato era deprecato: usato il ramo 10 compatibile con i peer della baseline. Audit finale senza advisory; nessuna modifica a package o lockfile Quartz.
- Nuova suite `_Meta/tests/typescript-qualita.test.mjs`: **39 gruppi**, 16 blocchi TS, otto JSON e una configurazione JS estratti dalle note. Progetti effettivi compilati ed eseguiti con Vitest, ESLint e Prettier.
- Primo giro **36/37 superati**, circa 78 secondi. La controprova readonly ha mostrato che un literal as const passato direttamente non rilevava il parametro mutabile. Corretto l'esempio, con tupla dichiarata separatamente; aggiunte controprove expectTypeOf e Promise.catch del preset ts-reset. Rerun mirato **3/3 superati**.
- Regressione seriale mirata: **117 test superati**, 39 Qualita + 31 Moduli + 47 Validazione, nessun fallimento o test saltato, circa 203 secondi. Build Quartz avviata soltanto a test conclusi. Helper condivisi invariati; non rieseguite le altre suite TypeScript e quelle complete React/JavaScript.
- Limiti: una baseline Windows, non tutte le versioni o i contesti cross-realm. Nessuna UI, integrazione remota, database, coverage o adapter I/O reale. I test distinguono comportamento, tipi e configurazione; non certificano l'assenza generale di bug. Fixture rimosse dopo controllo dei percorsi e scollegamento delle dipendenze.

### Verifica del vault

- content:check con report: **911 documenti raggiungibili, zero errori e 474 avvisi editoriali**, sei in meno; nessuno nelle sei note del blocco.
- content:test: **9 test della trasformazione superati**, distinti dalle prove tecniche.
- Build Quartz riuscita: **3.719 file, 2.003 HTML, 168 redirect e 137.486 riferimenti verificati, zero errori**. Restano soltanto gli avvisi preesistenti su eval del plugin note-properties e metadati Git nella copia temporanea.
- QA delle sei pagine a **1440 x 1000** e **390 x 844**, Chrome **155.0.8059.85**: HTTP 200, nuovi contenuti presenti, nessun errore pagina/console/HTTP o overflow del documento. Verificato lo scorrimento effettivo di **17 blocchi su mobile**, nessuno necessario su desktop.
- Ispezionati sei screenshot di Linting, Type-level testing e ts-reset, desktop/mobile: testo e gerarchia leggibili, codice lungo confinato nei propri scroller. Nessuna modifica manuale a HTML/CSS.
- Anteprima esistente su http://localhost:8082/appunti/ riutilizzata e lasciata attiva; browser QA chiuso, browser personale non modificato. Prettier e diff --check superati. Conteggio verificato dall'indice e dalle note modificate: 83 note uniche, 78 revisionate tecnicamente e cinque rimanenti; storico mantenuto a dieci voci.

### Prossimo blocco

La revisione e proseguita con Pattern e Architettura, documentato di seguito. Nessun commit o push.

## 2026-10-22 - TypeScript: pattern e architettura

### Perimetro e correzioni

Revisionate le ultime cinque note del percorso: **83 note TypeScript uniche su 83**. Conclusa la revisione tecnica delle pagine esistenti, non una certificazione di copertura di ogni argomento o versione TypeScript. Conservati date, percorsi, type, publish e status non revisionato; approvazione dell'utente ancora separata. Nessuna pagina aggiunta o spostata, indici e redirect invariati. Riparato il prerequisito YAML Interfaces nella nota Repository.

- [[Programmazione/TypeScript/Pagine/Pattern Repository e Service|Pattern Repository e Service]]: corretto il controllo find-then-insert che non garantiva unicita. Contratto con conflitti distinti, repository in memoria con scrittura senza await intermedi, copie e service con ID iniettato. Espliciti limiti di concorrenza locale, transazioni, ORM e outbox.
- [[Programmazione/TypeScript/Pagine/DTO e modelli di dominio|DTO e modelli di dominio]]: parser unknown con politica per extra e lunghezza, output proiettato e JSON verificabile. Pick non elimina campi runtime; Date, readonly, autorizzazione e mass assignment distinti.
- [[Programmazione/TypeScript/Pagine/Domain modeling|Domain modeling]]: sostituita la debole validazione email con una quantita dal contratto preciso. Entita, value object, aggregati e invarianti; transizioni draft/paid/cancelled, tempo iniettato, freeze e controllo esaustivo. Stato paid distinto da un addebito reale.
- [[Programmazione/TypeScript/Pagine/Clean architecture|Clean architecture]]: progetto ESM completo a cinque file, dominio, caso d'uso, porte, adapter e composition root. Dipendenze del sorgente distinte dal flusso runtime, inclusi import type; risposte dimostrative distinte da un server HTTP.
- [[Programmazione/TypeScript/Pagine/Dependency injection|Dependency injection]]: DI distinta da DIP, container e service locator. Clock e mailer iniettati, test double con copie, errori propagati e composizione deterministica. Spiegati token runtime, durate e responsabilita di chiusura delle risorse.

### Fonti e prove

- Consultate fonti primarie TypeScript, Martin Fowler, Robert C. Martin, Alistair Cockburn, PostgreSQL e MDN; riferimenti nelle note.
- Baseline **TypeScript 5.9.3**, **Node 24.14.0**, strict e target ES2022. Nessuna nuova dipendenza o modifica al lockfile; compilatore locale gia disponibile.
- Nuova suite `_Meta/tests/typescript-architettura.test.mjs`: **38 gruppi**, 20 blocchi TS e due JSON estratti dalle note. Primo giro **38/38 superati**, circa 27 secondi.
- Verificati conflitti e copie, validazione e JSON pubblico, transizioni e stati vietati, errori I/O e mailer, brand ed esaustivita. Ricostruito e compilato il progetto ESM reale; esecuzione delle quattro risposte e controlli degli adapter.
- Controprova architetturale: un import type dal caso d'uso all'adapter compila, ma viene rifiutato dal controllo degli import della fixture. Distinti checker e regola di dipendenza.
- Regressione seriale mirata: **108 test superati**, 38 Architettura + 31 Moduli + 39 Qualita, nessun fallimento o test saltato, circa 149 secondi. Non rieseguite le altre suite TypeScript ne quelle complete React/JavaScript. Helper condivisi invariati.
- Limiti: baseline Windows, dati ordinari, repository/test double in memoria. Nessun database reale, transazione distribuita, SMTP, pagamento, autenticazione o server HTTP. Il controllo degli import copre le forme statiche del demo, non e un linter generale. CLI tsc/Node eseguite con i file estratti, senza reinstallazione npm. Fixture rimosse dopo verifica dei percorsi.

### Verifica del vault

- content:check con report: **911 documenti raggiungibili, zero errori e 469 avvisi editoriali**, cinque in meno; nessuno nelle cinque note del blocco.
- content:test: **9 test della trasformazione superati**, distinti dalle prove tecniche.
- Build Quartz riuscita: **3.719 file, 2.003 HTML, 168 redirect e 137.555 riferimenti verificati, zero errori**. Restano gli avvisi preesistenti su eval del plugin note-properties e metadati Git della copia temporanea.
- Prima prova visiva interrotta dal selettore del titolo Clean architecture: Quartz rende l'apostrofo tipografico. Ispezionato il DOM e adeguato il selettore; corretta anche una URL ESM Windows nel comando diagnostico. Nessuna modifica agli esempi o al sito necessaria.
- QA completa ripetuta sulle cinque pagine a **1440 x 1000** e **390 x 844**, Chrome **155.0.8059.85**: HTTP 200, contenuti aggiornati, nessun errore pagina/console/HTTP o overflow del documento. Verificato lo scorrimento di **20 blocchi su mobile**, nessuno necessario su desktop.
- Ispezionati sei screenshot di Repository, DTO e Clean architecture, desktop/mobile: testo e gerarchia leggibili, blocchi lunghi confinati nei propri scroller. Nessuna modifica manuale a HTML/CSS.
- Anteprima su http://localhost:8082/appunti/ lasciata attiva; browser QA chiusi e browser personale non modificato. Conteggio confermato dall'indice: 83 note uniche esistenti, tutte incluse nella revisione. Storico mantenuto a dieci voci.

### Prossimo blocco

Proseguire con **Python: Fondamenti del Linguaggio**, partendo da Comandi base e toolchain. Nessuna nota Python modificata in questa sessione. Nessun commit o push; pubblicazione remota non aggiornata da queste operazioni.
