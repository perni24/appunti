# Revisione dei contenuti

Registro della revisione tecnica avviata dopo la ristrutturazione del vault. I controlli di YAML, collegamenti e build non certificano la correttezza degli argomenti.

## 2026-09-14 - Fondamenti JavaScript

### Perimetro

Lette integralmente e corrette le otto note del blocco `Percorso Base > Fondamenti del Linguaggio`. Confrontati i punti dubbi con la documentazione ufficiale MDN; le fonti sono riportate nelle singole note.

Questo controllo e svolto dal modello. Lo stato YAML resta `non revisionato` fino all'approvazione dell'utente; le date originarie delle note non sono state usate come date di revisione.

### Correzioni

| Nota | Intervento principale |
| --- | --- |
| [[Programmazione/JavaScript/Pagine/Variabili\|Variabili]] | Distinti binding e mutazione, TDZ e contesto globale/modulo; esempio pratico con dati locali. |
| [[Programmazione/JavaScript/Pagine/Tipi di Dati\|Tipi di Dati]] | Precisione Number, BigInt, Symbol e identita degli oggetti; `parseAge` ora rifiuta input vuoti, booleani e numeri non sicuri. |
| [[Programmazione/JavaScript/Pagine/Operatori\|Operatori]] | Chiariti short-circuit, optional chaining e precedenza; paginazione con default separati dalla validazione. |
| [[Programmazione/JavaScript/Pagine/Strutture Condizionali\|Strutture Condizionali]] | Distinti truthiness e validazione; scope condiviso dei case e guard clause con contratto esplicito. |
| [[Programmazione/JavaScript/Pagine/Cicli\|Cicli]] | Proprieta ereditate, limiti di `forEach` asincrono e `Promise.all`; salvataggio sequenziale con dipendenza esplicita. |
| [[Programmazione/JavaScript/Pagine/Funzioni\|Funzioni]] | Passaggio per valore, default e `return`; sconto espresso come frazione e validazione di valori finiti/intervallo. |
| [[Programmazione/JavaScript/Pagine/Strict Mode\|Strict Mode]] | Distinti script, moduli e classi; corretto il significato di `this` e documentato il conflitto tra direttiva interna e parametri non semplici. |
| [[Programmazione/JavaScript/Pagine/Error Handling\|Error Handling]] | Causa degli errori, limiti di `finally` e cattura asincrona; esempio HTTP con id codificato, annullamento e distinzione tra stato HTTP e rifiuto. |

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

| Nota | Intervento principale |
| --- | --- |
| [[Programmazione/JavaScript/Pagine/Manipolazione del DOM\|Manipolazione del DOM]] | Selezioni statiche, elementi assenti, attributi/proprieta, limiti di innerHTML e DocumentFragment; rendering di nomi non fidati come testo e inizializzazione anche dopo DOMContentLoaded. |
| [[Programmazione/JavaScript/Pagine/Gestione Eventi\|Gestione Eventi]] | Propagazione distinta da azione predefinita, durata di currentTarget, callback asincrone e cleanup; delegazione con righe dinamiche, liste annidate e rimozione solo locale esplicita. |
| [[Programmazione/JavaScript/Pagine/BOM\|BOM]] | Vincoli di History API, popstate, refresh di route statiche, limiti di navigator.onLine e timer; URL e testo riallineati anche con Indietro/Avanti. |
| [[Programmazione/JavaScript/Pagine/Browser Storage\|Browser Storage]] | Origine diversa da percorso, persistenza non garantita, quote/blocchi, sessionStorage e opener, cookie e cache; preferenze validate con fallback e risultato di salvataggio esplicito. |
| [[Programmazione/JavaScript/Pagine/Form Handling e Validazione\|Form Handling e Validazione]] | Aggiunto POST al form con password; corretti campi inviabili e checkbox, validazione e requestSubmit; esempio completo con feedback, doppi submit, errori gestiti e campi conservati. |

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

| Nota | Intervento principale |
| --- | --- |
| [[Programmazione/JavaScript/Pagine/Arrow Functions\|Arrow Functions]] | Corretto this al top-level ESM, chiariti arguments lessicale e call; timer con stop e avvio idempotente, callback con dati completi. |
| [[Programmazione/JavaScript/Pagine/Template Literals\|Template Literals]] | Distinti stringhe e tagged template, interpolazione istantanea, escape/raw e sicurezza; esempio DOM testuale completo. |
| [[Programmazione/JavaScript/Pagine/Default Parameters\|Default Parameters]] | Default lazy, nuovi oggetti per chiamata, scope/TDZ e null; distinti URL/configurazione da connessione HTTP e timeout effettivamente applicato. |
| [[Programmazione/JavaScript/Pagine/Destructuring\|Destructuring]] | Iterabili, rinomina e assegnazione, null e livelli annidati; separate dichiarazioni incompatibili nello stesso scope e validata la forma dell'utente nell'esempio. |
| [[Programmazione/JavaScript/Pagine/Spread & Rest Operators\|Spread & Rest Operators]] | Proprieta proprie enumerabili, limite argomenti, copie superficiali e merge con undefined; sostituita la falsa garanzia di oggetto pubblico con campi ammessi espliciti. |
| [[Programmazione/JavaScript/Pagine/Moduli\|Moduli]] | Distinti browser e Node, formato ESM e risoluzione, cache e live binding; re-export e esempio multi-file con controllo email dichiaratamente parziale. |
| [[Programmazione/JavaScript/Pagine/Dynamic Import\|Dynamic Import]] | Corretti async catch, mappa dei moduli consentiti, cache e assunzioni sul download; aggiunto report completo con loading, guardia ai doppi click ed errori. |

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

| Nota | Intervento principale |
| --- | --- |
| [[Programmazione/JavaScript/Pagine/Array Methods\|Array Methods]] | Distinti contenitori nuovi e riferimenti condivisi, callback e mutazioni, buchi e array vuoti; corretto accumulatore per chiavi arbitrarie, chiariti sort, slice/splice/fill e limiti delle callback async. |
| [[Programmazione/JavaScript/Pagine/Oggetti Avanzati\|Oggetti Avanzati]] | Precisati enumerabilita, simboli, ereditarieta, ordine delle chiavi, target/setter di assign e freeze superficiale; contratto esplicito per removeEmptyFields. |
| [[Programmazione/JavaScript/Pagine/Map e Set\|Map e Set]] | Identita, SameValueZero, ordine e proprieta size; deduplicazione per id, operazioni tra insiemi, perdite nelle conversioni e riferimenti forti; esempio di raggruppamento con input controllati. |
| [[Programmazione/JavaScript/Pagine/JSON\|JSON]] | Separati formato, conversione e schema; omissioni/null/errori di stringify, reviver di date, controlli HTTP e selezione dei campi ammessi nell'esempio di preferenze. |
| [[Programmazione/JavaScript/Pagine/Date & Time\|Date & Time]] | Distinti istante, data civile e durata, secondi/millisecondi e UTC/locale; parsing canonico, date invalide, normalizzazione, ora legale e misurazione monotona. |
| [[Programmazione/JavaScript/Pagine/Regular Expressions\|Regular Expressions]] | Corretto risultato falso di /js/i su JavaScript; aggiunti escape, sintassi, g/y e lastIndex, matchAll, Unicode, RegExp.escape e limiti di validazione/ReDoS. |

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

| Nota | Intervento principale |
| --- | --- |
| [[Programmazione/JavaScript/Pagine/Scope\|Scope]] | Distinti identificatori e proprieta, scope globale e top-level di modulo, binding e inizializzazione. Corretto il caso window.name; aggiunti chiamante/definizione lessicale, shadowing in TDZ e contatori indipendenti. |
| [[Programmazione/JavaScript/Pagine/Hoisting\|Hoisting]] | Separati modello concettuale ed esecuzione, dichiarazione e inizializzazione. Precisati typeof in TDZ, chiamata differita, funzioni nei blocchi strict, import statici e limite delle dipendenze circolari. |
| [[Programmazione/JavaScript/Pagine/Closures\|Closures]] | Distinti binding condivisi, stato per invocazione e valori derivati. Corretti sessione senza token e output Intl; aggiunti logout, controlli di formato, handle del timer e listener con smontaggio. Chiariti i limiti di riservatezza e memoria. |
| [[Programmazione/JavaScript/Pagine/Context\|Context]] | Distinti execution context e this; specificati script classico, ESM e CommonJS, strictness della funzione, receiver/arrow/bind/new. Corretti metodo estratto, arrow su object literal e listener DOM, con riferimenti riutilizzabili per cleanup. |
| [[Programmazione/JavaScript/Pagine/Prototypes\|Prototypes]] | Corretta confusione fra prototipo del costruttore e delle istanze; spiegati null, shadowing, array condivisi, campi/metodi/static, limiti di instanceof e sostituzione del prototype. Esempio Counter con contratto e limiti numerici. |

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

| Nota | Intervento principale |
| --- | --- |
| [[Programmazione/JavaScript/Pagine/Classi\|Classi]] | Precisati new, TDZ, strictness, campi e metodi sul prototipo. Rettangolo con dimensioni validate e aggiornamenti coerenti; metodo estratto con receiver corretto. Sessione con hasToken, formato controllato e assenza del token distinta dall'autenticazione. |
| [[Programmazione/JavaScript/Pagine/Ereditarietà\|Ereditarieta]] | Chiariti super, receiver e campi propri, catene di costruttori e istanze, ordine di inizializzazione e metodi sovrascritti. Esempi di composizione e gerarchia Error con cause e status HTTP controllati. |
| [[Programmazione/JavaScript/Pagine/Incapsulamento\|Incapsulamento]] | Distinte privacy, invarianti e immutabilita. Conto in centesimi interi con limiti numerici; carrello con campi ammessi, copie in ingresso/uscita e totale protetto da overflow. Conservato e segnalato il controesempio incompleto con riferimenti condivisi. |
| [[Programmazione/JavaScript/Pagine/Private Fields e Static Blocks\|Private Fields e Static Blocks]] | Corretta equivalenza fra campi pubblici e assegnazioni tramite setter. Approfonditi private brand, static privati ereditati, ordine dei campi e blocchi statici. Registry con dati copiati/congelati e limiti espliciti di freeze, Proxy e serializzazione. |
| [[Programmazione/JavaScript/Pagine/Property Descriptors\|Property Descriptors]] | Corretti default su proprieta nuove/esistenti, attributi non configurabili e accessor. Esplicitati errori strict, simboli, copie superficiali, JSON con replacer e definizioni non atomiche. Aggiunto il target mancante all'esempio che deve produrre TypeError. |

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

| Nota | Intervento principale |
| --- | --- |
| [[Programmazione/JavaScript/Pagine/Event Loop\|Event Loop]] | Distinti task, microtask, servizi del browser e opportunita di rendering; eliminata l'idea di un paint a ogni giro e di una coda FIFO universale. Corretto il busy wait, chiariti limiti dei timer e differenze Node/browser. Aggiunto esempio di elaborazione a blocchi con errori propagati. |
| [[Programmazione/JavaScript/Pagine/Callback\|Callback]] | Separati ruolo della callback e momento di invocazione, return sincrono e risultato futuro, dispatchEvent e input utente. Completati filtro, listener con cleanup e lettura JSON error-first in Node; documentati errori sincroni/asincroni e rischio di callback richiamate due volte. |
| [[Programmazione/JavaScript/Pagine/Promises\|Promises]] | Precisati resolved/settled, esecutore sincrono, adozione dell'esito e nuova Promise di then. Chiariti return, catch di recupero, errori del ramo e finally. Completati timer con input validati, adattatore error-first e Fetch con errori HTTP, parsing e schema distinti. |

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

| Nota | Intervento principale |
| --- | --- |
| [[Programmazione/JavaScript/Pagine/Promise avanzate\|Promise avanzate]] | Chiariti combinatori, ordine dei risultati, input vuoti e fallimenti parziali. Separati timeout dell'attesa e abort della richiesta, con cleanup dei timer e controllo HTTP. Corretto il pool che creava rifiuti non gestiti tramite finally: ora limita i lavori attivi, non avvia altri elementi dopo il primo errore e attende quelli gia partiti prima di propagare il rifiuto. Esplicitati input, limiti e assenza di rollback. |
| [[Programmazione/JavaScript/Pagine/Async Await\|Async Await]] | Precisati esecuzione sincrona iniziale, sospensione e propagazione degli errori. Distinti return e return await dentro try/catch/finally, avvio concorrente e attesa sequenziale, top-level await e moduli dipendenti. Completato loadUser con validazione di input e risposta, abort, timer mantenuto durante la lettura del corpo e cleanup; aggiunto il contesto degli errori senza nascondere la causa. |

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

| Nota | Intervento principale |
| --- | --- |
| [[Programmazione/JavaScript/Pagine/Fetch API\|Fetch API]] | Distinti disponibilita della Response, lettura del corpo, HTTP, parsing e schema. Corretti wrapper duplicato e fusione degli header; supportati oggetti Headers e coppie, preservando i default. Aggiunti risposte HEAD/204/205, corpo monouso e clone, FormData con boundary automatico e validazione utente. Precisati credenziali, CORS, no-cors, limiti del retry e dell'abort. |
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

| Nota | Intervento principale |
| --- | --- |
| [[Programmazione/JavaScript/Pagine/AJAX\|AJAX]] | Distinti tecnica AJAX e API XHR/Fetch. Completati GET XHR con HTTP/parsing/timeout/abort separati e cleanup, schema utenti, montaggio e rimozione della lista senza HTML remoto. Precisati readyState, responseType, progress upload, CORS e polling senza sovrapposizioni. |
| [[Programmazione/JavaScript/Pagine/WebSockets\|WebSockets]] | Precisati handshake, stati, send senza ACK, limiti di close, messaggi binari e Ping/Pong. Aggiunti parsing con schema e limiti, controllo del buffer e backoff con jitter. Chiariti Origin/autenticazione, SSE e incompatibilita fra protocollo nativo e Socket.IO. |
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

| Nota | Intervento principale |
| --- | --- |
| [[Programmazione/JavaScript/Pagine/Functional Programming\|Functional Programming]] | Distinti purezza, determinismo, lettura dell'ambiente e side effect. Precisati copie superficiali, mutazione locale, callback map/filter e Promise. Aggiunti pipeline sincrona con contratto, currying rispetto a partial application, tempo come input e separazione fra trasformazione utenti e shell DOM. Schema, array sparsi, duplicati e ordinamento UTF-16 espliciti. |
| [[Programmazione/JavaScript/Pagine/Design Patterns\|Design Patterns]] | Distinti simple factory, stato di modulo e singleton universale. Observer con snapshot, cleanup, iscrizioni indipendenti e politica fail-fast. Strategie in Map con nomi e input controllati. Wrapper con this/argomenti/return preservati, logger iniettato e limiti asincroni. Validazioni testuali con configurazione verificata prima dello short-circuit e limiti del controllo email espliciti. |

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

| Nota | Intervento principale |
| --- | --- |
| [[Programmazione/JavaScript/Pagine/Immutabilita e Copia degli Oggetti\|Immutabilita e Copia degli Oggetti]] | Corretti valore riferimento, copie superficiali, getter e differenze spread/assign. Precisati structuredClone, alias, tipi esclusi, perdita di descrittori, transfer e memoria condivisa. Corrette tabelle freeze/seal/preventExtensions, accessor e stato interno. DeepFreeze iterativo con cicli e dominio esplicito; patch utente con campi ammessi, schema e riferimenti conservati. |
| [[Programmazione/JavaScript/Pagine/Generators e Iterators\|Generators e Iterators]] | Distinti iterator/iterable e cursori monouso/riavviabili. Aggiunti next con input, return finale, throw, finally e chiusura anticipata. Range con interi sicuri, helper lazy e wait definita. Paginazione con query preservata, HTTP/JSON/schema separati, limite pagine, signal e stop senza prefetch; dichiarati i limiti di memoria e di cancellazione. |

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

| Nota | Intervento principale |
| --- | --- |
| [[Programmazione/JavaScript/Pagine/Web Workers\|Web Workers]] | Distinti thread, asincronia, costi di comunicazione e limiti del contesto. Corretti percorsi classic/module, clone/transfer e cancellazione. Aggiunto job con protocollo, limiti numerici, timeout, abort, errori e terminazione su ogni esito. Chiariti SharedWorker, pool e limiti di sicurezza. |
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

| Nota | Intervento principale |
| --- | --- |
| [[Programmazione/JavaScript/Pagine/Web Components\|Web Components]] | Corretti uso di innerHTML con dati degli attributi, role applicativo e registrazioni duplicate. Chiariti constructor, upgrade, attributi/proprieta, booleani e riconnessioni. Esempi completi con template, slot, toggle accessibile, eventi e cleanup dei listener esterni. Precisati isolamento CSS, closed non sicuro, limiti di form-associated elements e integrazione framework. |
| [[Programmazione/JavaScript/Pagine/Scheduling Browser\|Scheduling Browser]] | Corretti timeout idle scambiato per deadline, polling sovrapposto, animazioni basate su timestamp assoluto e NodeList trattata come array. Aggiunti polling annullabile, animazione con reduced motion, coda idle limitata con fallback, feature detection di Scheduler e somma con budget/abort. Distinti task, microtask, paint, cancellazione cooperativa e parallelismo. |

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

| Nota | Intervento principale |
| --- | --- |
| [[Programmazione/JavaScript/Pagine/Memory Lifecycle\|Memory Lifecycle]] | Corretta la corrispondenza rigida primitivi/stack e oggetti/heap; precisati binding, alias, passaggio per valore, closure e durata delle Promise. Distinti riferimenti applicativi e risorse host. Aggiunti widget e ticker con contratti, cleanup idempotente e reset dei riferimenti interni, senza mutare i dati del chiamante. |
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

| Nota | Intervento principale |
| --- | --- |
| [[Programmazione/JavaScript/Pagine/Memory Leaks\|Memory Leaks]] | Distinti leak, bloat, allocazioni temporanee e risultati async obsoleti. Corretti listener anonimi considerati irremovibili, uso di once e abort dopo await. Sostituiti helper indefiniti con vista cancellabile, cache LRU limitata e richiesta con HTTP/JSON/schema, abort e guardia dopo lo smontaggio. Precisati DOM distaccato, alias e limiti della diagnosi. |
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

| Nota | Intervento principale |
| --- | --- |
| [[Programmazione/JavaScript/Pagine/Optimization\|Optimization]] | Separati misurazione e ipotesi, CPU/attese e dettagli V8/garanzie del linguaggio. Completati debounce cancellabile, throttle leading-only e filtro con cleanup. Corretti letture DOM, NodeList, border-box e limiti del layout; esplicitati eventi scartati, callback sincrone e assenza di benchmark. |
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

| Nota | Intervento principale |
| --- | --- |
| [[Programmazione/JavaScript/Pagine/Proxy e Reflect\|Proxy e Reflect]] | Corretti receiver, inoltro Reflect e risultato di set; distinto defineProperty dall'assegnazione. Aggiunti identita/alias, Symbol, invarianti, apply/newTarget, limiti con campi privati/internal slots e revoca. Riscritta la validazione di age con schema esplicito e controllo anche dei descrittori, senza presentarla come barriera di sicurezza. |
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

| Nota | Intervento principale |
| --- | --- |
| [[Programmazione/JavaScript/Pagine/Sicurezza\|Sicurezza]] | Distinti XSS, CSRF, autenticazione, autorizzazione e validazione. Esplicitati limiti di HttpOnly/SameSite e storage, contesti DOM/URL, dipendenze, CSP e log. Aggiunti rendering testuale con schema, link con protocollo/origine verificati e invio same-origin con contratto CSRF/204, abort e redirect rifiutati. |
| [[Programmazione/JavaScript/Pagine/CORS\|CORS]] | Corretti origin/site, invio rispetto a lettura, preflight, credentials e cookie, Authorization, wildcard, header esposti e Vary. Sostituiti frammenti incompleti con API Node, moduli client e markup eseguibili in una demo locale. Distinti proxy locale/deploy, errori HTTP/rete e divergenza Chrome/Fetch sulla wildcard Authorization. |

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

| Nota | Intervento principale |
| --- | --- |
| [[Programmazione/JavaScript/Pagine/Content Security Policy\|Content Security Policy]] | Corretti fallback, origini, policy multiple, header e meta. Completati nonce per risposta, hash del testo esatto, strict-dynamic, report-only con endpoint dichiarato, limiti di Trusted Types, cache e build. Aggiunta demo Node con script autorizzato e controesempio bloccato. |
| [[Programmazione/JavaScript/Pagine/Sanitizzazione input\|Sanitizzazione input]] | Distinti validazione, normalizzazione, encoding e sanitizzazione. Corretta la spiegazione delle template literal e dei sink HTML; aggiunti rendering testuale e query con limiti. Demo HTML completa con DOMPurify 3.4.16, istanza dedicata, otto tag consentiti, nessun attributo e DocumentFragment. Esplicitati limiti dei contesti URL, SQL, shell, Markdown e Trusted Types. |

### Verifica degli esempi

- **8 nuovi test Node e 25 Chrome**, tutti superati. Suite completa seriale: **858 test**, 627 Node.js 24.14.0 e 231 Chrome 154.0.8037.98, senza build concorrente.
- Codice estratto dai Markdown; controllo sintattico dei quattro blocchi JS. Verificati nonce da 16 byte, unicita nel campione, corrispondenza header/markup, hash deterministico, input invalidi e query con caratteri riservati. L'unicita del campione non e una prova crittografica della casualita.
- Chrome usa server HTTP temporanei su loopback e contesti puliti, senza intercettare le decisioni CSP. Provati nonce e hash validi/invalidi, report-only non bloccante, attributi evento/eval, connect-src e fallback, intersezione delle policy, loader dinamici e self ignorato con strict-dynamic.
- DOMPurify 3.4.16 installato con ignore-scripts soltanto in una directory temporanea esterna. La fixture verifica la versione e serve il modulo ESM reale. Provati demo HTML intera, rendering testuale, markup consentito/escluso/malformato, attributi, entita, limiti di input e destinazione, contenuto conservato su errore e sostituzione/vuoto.
- Limiti: nessun audit completo dei bypass XSS, collector di report, enforcement Trusted Types, matrice browser, DOM server-side, TLS o CDN/cache. Il launcher server.mjs e controllato sintatticamente; la fixture serve la funzione reale che produce header e HTML. Il comando Python non viene eseguito. Nessun cambiamento alle dipendenze o alla CSP di Quartz.

### Verifica del vault

- content:check con report: 911 documenti raggiungibili, zero errori strutturali, **625 avvisi editoriali**.
- content:test: 9 test della trasformazione superati. Copertura e prerequisiti documentati in _Meta/tests/README.md; rapporto in [[_Meta/Controllo del vault|Controllo del vault]].

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
- content:test: 9 test della trasformazione superati. Prerequisiti e limiti in _Meta/tests/README.md; rapporto in [[_Meta/Controllo del vault|Controllo del vault]].

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
