# Test degli esempi delle note

Questi test sono infrastruttura editoriale, esclusa dal sito. Estraggono frammenti dai Markdown originali tramite il parser in `site/scripts/vault.mjs`. Non eseguono indiscriminatamente tutte le note.

## Prerequisiti

- Dipendenze del progetto `site` gia installate, per il parser Markdown/YAML.
- Node.js compatibile con il progetto; esecuzione verificata con `24.14.0`.
- Solo per i test browser: pacchetto Playwright e Google Chrome installato. Nella sessione di revisione e stato usato il runtime Playwright gia fornito dall'ambiente Codex, senza aggiungere dipendenze al sito.

## Fondamenti

Dalla radice del vault:

```powershell
node --test _Meta/tests/javascript-fondamenti.test.mjs
```

32 test in contesti JavaScript isolati, con risposte Fetch simulate. Comprendono percorsi validi e casi che devono generare errori.

## JavaScript Moderno

```powershell
node --test _Meta/tests/javascript-moderno.test.mjs
```

26 test su arrow functions, template literals, default, destructuring, spread/rest e moduli. I test ESM creano package temporanei con i frammenti originali, li importano con Node e rimuovono soltanto la propria directory dopo averne verificato il percorso. Le dipendenze usate per simulare un guasto sono fixture esplicite, non copie delle funzioni sotto test.

## Strutture Dati

```powershell
node --test _Meta/tests/javascript-strutture-dati.test.mjs
```

34 test su metodi array, oggetti, Map/Set, JSON, date e regex. Verificano riferimenti condivisi, array vuoti/sparsi, chiavi speciali, schema dei dati, errori HTTP, date invalide, misurazione delle durate e ricerca testuale. Tre processi Node isolati impostano `TZ` a UTC, Europe/Rome e America/New_York prima di eseguire gli esempi: non cambiano il fuso orario del sistema.

## Logica Interna

```powershell
node --test _Meta/tests/javascript-logica-interna.test.mjs
```

36 test su scope, TDZ, hoisting, closure, receiver e prototipi. I casi ESM e CommonJS vengono eseguiti in file temporanei reali, con timeout e cancellazione limitata alla directory verificata del test. Timer simulati rendono deterministiche le prove su callback e loop. Sono inclusi input malformati della sessione dimostrativa e limiti numerici del contatore, non un collaudo di autenticazione.

## Programmazione ad Oggetti

```powershell
node --test _Meta/tests/javascript-oggetti.test.mjs
```

43 test su classi, ereditarieta, incapsulamento, campi privati/statici e descrittori. Verificano receiver e prototipi, ordine di inizializzazione, setter e campi pubblici, private brand, validazione e conservazione dello stato in caso di errore, copie dei dati e limiti numerici. Sono inclusi errori intenzionali di sintassi e runtime, definizioni parziali di proprieta e limiti di freeze e serializzazione. Gli esempi monetari usano centesimi interi: non sono un modello contabile completo.

## Asincronia: Fondamenti

```powershell
node --test _Meta/tests/javascript-asincronia.test.mjs
```

33 test su Event Loop, Callback e Promises. Verificano ordine delle microtask, suddivisione del lavoro in task, return e propagazione degli errori, stati adottati dalle Promise, catch/finally, timer e parsing/validazione delle risposte. Le API Node sono provate con veri file ESM e JSON in directory temporanee isolate, rimosse solo dopo controllo del percorso. I timer simulati controllano registrazione ed esecuzione, non il tempo trascorso; un processo separato verifica che un errore del consumatore non richiami due volte la callback.

## Asincronia: Composizione e Concorrenza

```powershell
node --test _Meta/tests/javascript-async-avanzato.test.mjs
```

28 test su Promise avanzate e Async Await. Verificano ordine ed errori dei combinatori, cleanup dei timer, timeout durante la lettura del corpo, validazione degli input, schema delle risposte e differenza fra return e return await. Il pool viene provato con limiti diversi, errori sincroni e asincroni, motivi di rifiuto falsy, array sparsi e attesa dei lavori gia avviati dopo un errore. Timer e risposte HTTP simulate controllano i contratti, non le prestazioni o le tempistiche della rete reale.

## Fetch e AbortController

```powershell
node --test _Meta/tests/javascript-fetch-abort.test.mjs
```

28 test su wrapper JSON, header in tre formati, HTTP e risposte vuote, consumo del corpo, validazione dello schema e timeout. Controllano che `wait()` rimuova il listener anche su successo e conservi i motivi di abort, inclusi null e zero. Le fixture di ricerca ignorano intenzionalmente il signal, cosi da provare che identita e cleanup impediscano aggiornamenti obsoleti anche quando l'operazione sottostante non collabora.

## AJAX e WebSocket

```powershell
node --test _Meta/tests/javascript-ajax-websocket.test.mjs
```

25 test su AJAX, WebSockets e Real-time con WebSocket. Le fixture XHR verificano stati terminali, HTTP, parsing, annullamento, timeout e rimozione dei listener. Gli helper WebSocket sono provati per schema, byte UTF-8, buffer di uscita, serializzazione e backoff. Un EventTarget simula i socket per verificare start/stop, riconnessione, budget totale, eventi obsoleti e cleanup, senza aspettare ritardi reali. Il codice sotto test e estratto dalle note, non riscritto nelle fixture.

## Stile e Paradigmi: Funzioni e Pattern

```powershell
node --test _Meta/tests/javascript-paradigmi.test.mjs
```

31 test su Functional Programming e Design Patterns: aggiornamenti senza mutare gli input, riferimenti condivisi, currying/applicazione parziale, pipeline sincrona, timestamp espliciti e schema degli utenti. Le prove sui pattern coprono factory, closure, Observer con snapshot, iscrizioni duplicate/rimosse, cleanup ed errori, strategie sconosciute e limiti degli input. Il wrapper viene provato con this, argomenti, risultato, errori del logger e identita delle Promise. I moduli ES sono importati da URL data temporanei nel processo di test: stessa URL condivide il modulo, fragment diversi creano identita distinte. Nessun file applicativo viene creato o modificato.

## Stile e Paradigmi: Copie e Iteratori

```powershell
node --test _Meta/tests/javascript-copie-iteratori.test.mjs
```

38 test su Immutabilita e Copia degli Oggetti e Generators e Iterators. Gli helper sono estratti dalle note; prove aggiuntive delle API verificano descrittori, getter, alias, transfer, SharedArrayBuffer e differenze tra clone e JSON. Il deepFreeze viene provato su cicli, array, Symbol, proprieta non enumerabili, dati gia frozen e input esclusi senza invocare getter. Sono verificati schema delle patch e conservazione dei riferimenti. Per iteratori e generatori si provano cursori monouso/indipendenti, next/return/throw, cleanup, estremi numerici e helper lazy. Fetch e timer simulati rendono deterministiche le prove di paginazione: query, HTTP/parsing/schema, limite pagine, break, abort e return accodato a una richiesta pendente.

## Web Workers e Service Workers

```powershell
node --test _Meta/tests/javascript-workers.test.mjs
```

10 test Node su strategie cache e handler opzionali. Verificano allowlist di URL, metodo e credenziali, cache hit/miss, guasti di rete, errori HTTP, clone delle risposte e scritture fallite. Le fixture Cache Storage simulano indisponibilita e quota; controllano anche la registrazione sincrona di waitUntil e l'assenza di rifiuti non gestiti durante revalidate. Push e messaggi di aggiornamento sono provati con eventi/registrazione simulati, non con un servizio push reale.

Con gli stessi prerequisiti Playwright della sezione Browser:

```powershell
node --test _Meta/tests/javascript-workers-browser.test.mjs
```

18 test Chrome con Web Worker e Service Worker reali, serviti da server HTTP temporanei su loopback. I file JavaScript vengono estratti dalle note e importati come moduli o caricati come worker classici, senza copie delle implementazioni nelle fixture. Ogni test usa un nuovo contesto browser e chiude contesto, worker e server alla fine.

Le prove comprendono input invalidi, errori runtime/caricamento, transfer, timeout, abort e terminazione dei job. Per i Service Worker: prima visita non controllata, ready, scope, precache fallito, cache appartenenti ad altre app, offline, cache eliminata, filtri delle richieste, update in attesa con due schede aperte e mantenimento della vecchia versione dopo un update fallito. Unregister viene verificato separatamente dalla cancellazione delle cache.

## Web Components e Scheduling

```powershell
node --test _Meta/tests/javascript-scheduling.test.mjs
```

31 test Node con timer, clock, rAF e deadline idle controllati. Verificano polling senza sovrapposizione, retry dopo errore, abort e stop ripetuto; somma con budget, limiti numerici, input sparsi, fallback di yield e rifiuti. Le prove rAF controllano timestamp iniziale zero, origine temporale arbitraria, completamento, cancellazione e reduced motion. Quelle idle verificano budget esaurito, singolo lavoro dopo timeout, limite per callback, fallback e cleanup.

Con i prerequisiti Playwright della sezione Browser:

```powershell
node --test _Meta/tests/javascript-components-browser.test.mjs
```

20 test Chrome su componenti e API native. Gli esempi estratti dai Markdown coprono testo non interpretato come HTML, attributi iniziali e rimossi, stato alla riconnessione, registrazioni duplicate, template indipendenti, proprieta pre-upgrade, booleani, click e tastiera, disabilitazione e focus. Sono verificati propagazione/retargeting degli eventi, slot, custom properties/part e cleanup dei listener esterni. Scheduling viene provato anche con rAF, reduced motion emulato, misure border-box, requestIdleCallback, scheduler.yield e postTask reali. Ogni test usa un contesto isolato, intercetta la rete e lo chiude alla fine.

## WebAssembly interop

Per questi test serve anche il pacchetto `wabt` (verificato con `1.0.39`). Il helper `wasm-example.mjs` compila il WAT estratto dalla nota a ogni esecuzione, senza conservare un secondo sorgente o un binario precompilato. Il pacchetto non viene aggiunto alle dipendenze di Quartz. Esempio di installazione isolata, da rifare se la cartella temporanea viene rimossa:

```powershell
npm install --prefix "$env:TEMP/appunti-wasm-tools" --ignore-scripts --no-audit --no-fund --package-lock=false wabt@1.0.39
```

Imposta il percorso del pacchetto nella shell che esegue i test:

```powershell
$env:WABT_MODULE_PATH = Join-Path $env:TEMP 'appunti-wasm-tools/node_modules/wabt'
```

```powershell
node --test _Meta/tests/javascript-wasm.test.mjs
```

32 test Node: compilazione WAT, contratti import/export, overload di instantiate, istanze indipendenti, conversioni i32/i64, trap ed errori delle callback host. Il loader viene provato con MIME corretto/errato/assente, fallback senza streaming o doppio download, HTTP, binario invalido, import errati e abort prima/durante lettura e dopo istanziazione. Gli helper memoria sono verificati su UTF-8, NUL, surrogate isolate, input/range invalidi, capacita insufficiente senza scritture parziali, grow e buffer distaccati, alias/copie ed esclusione della memoria condivisa.

Con anche Playwright configurato come sotto:

```powershell
node --test _Meta/tests/javascript-wasm-browser.test.mjs
```

12 test Chrome: pagina HTML e moduli JS estratti dalla nota, binario prodotto dal WAT e URL risolti sotto `/demo/`. Verificati streaming/fallback, HTTP, ABI, UTF-8, grow, abort, errori gestiti e compilazione bloccata/consentita da CSP. Le risposte HTTP e gli header sono intercettati; esecuzione Wasm e policy del browser sono native. Nessuna modifica alla CSP del sito o generazione di asset demo dentro Quartz.

## Memory Lifecycle e Garbage Collection

```powershell
node --test _Meta/tests/javascript-memory.test.mjs
```

24 test Node sugli snippet estratti dalle note: primitivi, alias, parametri, closure, cicli e rimozione delle voci da una Map. Il ticker usa timer simulati per controllare input, lunghezza corrente, stop idempotente, callback obsolete, stop interno ed errori. WeakRef e FinalizationRegistry sono native per i casi deterministici; il target assente e simulato per provare il fallback senza attendere il GC. Il modulo con process.memoryUsage viene eseguito in un processo Node separato e controllato per forma e valori numerici, non per consumo atteso.

Con i prerequisiti Playwright della sezione Browser:

```powershell
node --test _Meta/tests/javascript-memory-browser.test.mjs
```

8 test Chrome: markup, avvio e cleanup del widget estratti dai Markdown. Verificati click, input invalidi, testo non interpretato come HTML, dati del chiamante preservati, listener altrui non rimossi, cicli mount/unmount, cleanup ripetuto e nodi distaccati. Listener e cleanup conservati intenzionalmente dal test sono richiamati dopo lo stop per verificare l'assenza di effetti. Controllate anche WeakRef e FinalizationRegistry native. Nessuna attesa del collector, nessun heap snapshot del profilo personale.

## Memory Leaks e WeakMap/WeakSet

```powershell
node --test _Meta/tests/javascript-leaks-weak.test.mjs
```

34 test Node sugli snippet e sui contratti descritti nelle note. Provati globali accidentali in realm isolati non strict/strict, snapshot dell'ID nella closure, cache LRU con input invalidi, recenza, alias, undefined, eviction e pulizia. Per le collezioni deboli: identita, chiavi oggetto/funzione/simbolo, scritture rifiutate e letture assenti, assenza di enumerazione, valori condivisi, fallback has/set e stato privato. La visita del grafo gestisce cicli, nodi condivisi, dati invalidi e 12.000 livelli senza ricorsione. Non viene misurata la raccolta degli oggetti.

Con i prerequisiti Playwright della sezione Browser:

```powershell
node --test _Meta/tests/javascript-leaks-weak-browser.test.mjs
```

15 test Chrome in contesti isolati: vista dimensioni con listener cancellabile, cleanup ripetuto, listener altrui preservati, callback obsolete e nodi distaccati. Fetch nativo con risposte intercettate prova successo, HTTP, JSON/schema e abort durante l'attesa. Operazioni simulate che ignorano abort provano risposte, corpo ed errori tardivi senza aggiornare l'output smontato. Verificati anche metadati DOM e getOrInsert/getOrInsertComputed nativi, incluso il valore undefined gia presente. Node.js 24.14.0 non espone questi due metodi e usa il fallback; Chrome 154.0.8037.98 esegue il ramo nativo.

## Optimization e Buffer/Typed Arrays

```powershell
node --test _Meta/tests/javascript-optimization-buffers.test.mjs
```

42 test Node sugli esempi estratti dai Markdown. Verificati risultato della misura senza soglie di performance, Set, formatter, factory, debounce trailing e throttle leading-only. Timer/orologio simulati controllano this, argomenti, rientranza, cancel, errori, prima chiamata a zero e limiti del delay. Il test DOM simulato verifica che tutte le letture precedano le scritture, non il costo del layout.

Provati conversioni, copie/alias, DataView con offset, resize, transfer, feature detection e codifica UTF-8. Il parser binario copre BOM, NUL, code point supplementari, limite di 65.535 byte, sottoviste e Buffer Node, input e header invalidi, lunghezza, UTF-8 malformato e rifiuto di memoria condivisa/ridimensionabile/distaccata. Fetch usa risposte simulate e propaga errori; il modulo Node Buffer viene eseguito con il proprio import originale.

Con i prerequisiti Playwright della sezione Browser:

```powershell
node --test _Meta/tests/javascript-optimization-buffers-browser.test.mjs
```

11 test Chrome: filtro con timer reali, markup e cleanup estratti dalla nota, 20 cicli mount/unmount, callback tardive, listener esterni preservati, input invalidi e dimensioni border-box su NodeList. Eseguiti snippet binari nativi, parser, Fetch con risposte intercettate, errori e abort. SharedArrayBuffer/Atomics vengono provati in un contesto HTTPS temporaneo con COOP/COEP e crossOriginIsolated, in un solo thread; nessuna modifica alle intestazioni del sito Quartz.

## Proxy/Reflect e Circular Dependencies

```powershell
node --test _Meta/tests/javascript-proxy-cycles.test.mjs
```

42 test Node: snippet Proxy estratti dai Markdown, identita e alias, Symbol, receiver, strict/non strict, esiti Reflect, doppio percorso set/defineProperty, apply/newTarget, invarianti e revoca. Il record con age e provato su inizializzazione, assegnazione e descrittori, input invalidi, accessor rifiutati, schema non estensibile e freeze.

Il helper `cycle-examples.mjs` associa i file ai casi della nota. Le fixture ESM/CommonJS sono scritte in directory temporanee dedicate, verificate prima della rimozione, ed eseguite in processi Node puliti con timeout. Provati TDZ da entrambi gli ingressi, funzioni/live binding, classi con due entry point, injection e propagazione degli errori, export CommonJS parziali/sostituiti, import lazy riuscito/fallito e uscita 13 per il ciclo con top-level await. Varianti mirate cambiano const in var o aggiungono una chiamata anticipata per verificare le differenze descritte nel testo.

Con i prerequisiti Playwright della sezione Browser:

```powershell
node --test _Meta/tests/javascript-proxy-cycles-browser.test.mjs
```

14 test Chrome in contesti puliti: snippet Proxy, validazione con descrittori, moduli ESM reali restituiti da richieste intercettate, markup module della nota, errori TDZ, classi, composizione e lazy loading. Verificato che la feature non venga richiesta prima della chiamata. Il caso di attesa reciproca resta pendente nella finestra osservata dopo il caricamento dei moduli; il contesto viene poi chiuso, senza attendere indefinitamente. CommonJS e provato solo in Node.

## Decorators

```powershell
node --test _Meta/tests/javascript-decorators.test.mjs
```

26 test Node: 24 casi condivisi con il browser, controllo dei sette blocchi JS e prova del comando CLI della nota in una directory temporanea dedicata. Il helper `decorators-examples.mjs` estrae gli esempi e li trasforma con esbuild, gia presente in `site`; versione verificata 0.27.3, target ES2022, experimentalDecorators false e useDefineForClassFields true. La demo CLI viene eseguita come modulo ESM e la sua cartella viene rimossa dopo averne verificato il percorso assoluto.

Con i prerequisiti Playwright della sezione Browser:

```powershell
node --test _Meta/tests/javascript-decorators-browser.test.mjs
```

24 test Chrome in contesti isolati eseguono lo stesso output trasformato. Coprono receiver, Symbol, static/private, argomenti, errori, identita Promise, logger fallito, ordine factory/applicazione/wrapper, durata sincrona e attesa asincrona con orologio simulato. Verificati validazione iniziale dei campi, successive scritture degli auto-accessor, enumerabilita, receiver invalido, binding, composizione, fasi degli inizializzatori e registrazione tardiva. Metadata verificati su classe e sottoclasse, con bootstrap isolato del simbolo.

Questi test non dimostrano supporto nativo della sintassi decorator. Non sono provati Babel, tsc, la modalita legacy, reflect-metadata, framework DI o ogni revisione della proposta TC39. I tempi sono controllati tramite un orologio simulato, non misure di prestazioni; le Promise e gli slot privati dell'output compilato sono eseguiti dal runtime reale.

## Sicurezza e CORS

```powershell
node --test _Meta/tests/javascript-security-cors.test.mjs
```

24 test Node: URL delle origini, input e token del client CSRF, header, corpo, status 204 e rifiuti HTTP/rete/abort senza retry. Il server CORS viene importato dal blocco Markdown come modulo ESM, senza duplicarne l'implementazione. Verificati allowlist esatta e copiata, origini null/non consentite, assenza di Origin, Vary/no-store, preflight accettati e rifiutati, PUT dimostrativo, 404/405 e schema del client. Controllata la sintassi dei sette blocchi JS, incluso il file di avvio.

Con i prerequisiti Playwright della sezione Browser:

```powershell
node --test _Meta/tests/javascript-security-cors-browser.test.mjs
```

21 test Chrome con server HTTP temporanei su loopback, porte assegnate dal sistema e contesti puliti. Per i moduli della demo si sostituisce soltanto l'origine locale fissa con la porta della fixture; il markup HTML della nota e eseguito interamente. Rendering testuale e URL sono provati nel DOM reale, compreso il rifiuto di blob con origine HTTPS incorporata. Fetch, preflight, cookie HttpOnly, filtraggio degli header e risposte opache sono comportamenti nativi, non risposte simulate da Playwright.

Provati invio di POST semplice senza lettura della risposta, blocco della richiesta dopo preflight fallito, header mancanti nella risposta finale, cookie con omit/default/include e assenti in OPTIONS, wildcard con include senza cookie, Authorization esplicito con omit, header esposti e Set-Cookie non leggibile, 404 leggibile, no-cors e same-origin. Il client CSRF usa un token fittizio e un endpoint locale di test; verificato il rifiuto dei redirect prima di inviare il token all'altra route.

Una sonda distinta registra la compatibilita di Authorization con Allow-Headers wildcard: Chrome 154.0.8037.98 la accetta con omit, diversamente dal requisito Fetch di dichiararlo esplicitamente. Il test distingue entrambi gli esiti possibili e li registra, senza certificare conformita allo standard; il percorso con allowlist esplicita e testato separatamente.

Limiti: nessun audit completo, sanitizer HTML, backend autenticato, emissione/verifica crittografica di token o sessione, TLS, cookie cross-site/di terze parti, cache CDN o matrice browser. I cookie sono fittizi, same-site su porte diverse e HTTP locale; non collaudano il cookie HTTPS di produzione descritto nella nota. Il server Python della procedura non e eseguito dai test: la fixture HTTP serve gli stessi file. I server temporanei vengono chiusi, senza modificare quello dell'anteprima Quartz.

## CSP e sanitizzazione HTML

```powershell
node --test _Meta/tests/javascript-csp-sanitization.test.mjs
```

8 test Node: nonce da 16 byte, unicita nel campione e corrispondenza header/markup, hash deterministico e sensibile ai newline, modalita invalide, direttive e header. Provati query string, caratteri riservati, limiti e rifiuto di input invalidi. Controllata la sintassi dei quattro blocchi JS; le funzioni eseguite sono estratte dai Markdown, non duplicate nei test.

Il browser richiede Playwright come descritto sotto e DOMPurify **3.4.16**. Installazione isolata, senza cambiare le dipendenze di Quartz:

```powershell
npm install --prefix (Join-Path $env:TEMP 'appunti-sanitizer-tools') --save-exact --ignore-scripts --no-audit --no-fund dompurify@3.4.16
```

```powershell
$env:DOMPURIFY_MODULE_PATH = Join-Path $env:TEMP 'appunti-sanitizer-tools/node_modules/dompurify'
```

```powershell
node --test _Meta/tests/javascript-csp-sanitization-browser.test.mjs
```

25 test Chrome con moduli reali, contesti isolati e server HTTP loopback temporanei. DOMPURIFY_MODULE_PATH indica la cartella del pacchetto, non il file ESM; la fixture verifica la versione e serve il suo purify.es.mjs. Nessun sanitizer fittizio e nessuna risposta CSP intercettata da Playwright.

Verificati nonce/hash validi e invalidi, report-only, eventi inline, eval, connect-src e fallback, policy multiple, loader con/senza strict-dynamic e self ignorato per script parser-inserted. Le prove di blocco usano codice eseguito da script della pagina autorizzati, non eval lanciato da DevTools; le violazioni attese non sono errori del test.

Verificati rendering testuale, query con origine corrente e demo HTML completa. Provati tag consentiti, attributi rimossi, script/immagini/link/form/SVG/MathML/custom element esclusi, markup incompleto ed entita. Controllati DOM finale, tipo e documento della destinazione, input invalidi senza coercizione, contenuto preservato su errore, sostituzione, vuoto e limite massimo.

Limiti: non e un audit XSS esaustivo o una prova crittografica della casualita. Non verificati consegna dei report a un collector, enforcement Trusted Types, browser diversi, DOM server-side, integrazione CDN/cache o applicazione della policy a Quartz. Il launcher server.mjs della nota e controllato sintatticamente; la fixture serve direttamente le risposte prodotte dalla funzione reale. Il comando Python e descritto ma non eseguito. DOMPurify resta isolato fuori dal vault; nessuna modifica a package.json o lockfile del sito in questo blocco.

## Supply chain npm

La procedura e verificata con Node.js 24.14.0 e **npm 11.19.0**. Il runner usa per default npm accanto al binario Node. Se il comando npm risolve un'altra installazione, imposta NPM_CLI_PATH al percorso assoluto del suo npm-cli.js; il test controlla la versione prima di procedere. Per l'installazione globale utente verificata su Windows:

```powershell
$env:NPM_CLI_PATH = Join-Path (npm config get prefix) 'node_modules/npm/bin/npm-cli.js'
```

```powershell
node --test _Meta/tests/javascript-supply-chain.test.mjs
```

12 test Node eseguono la CLI reale su directory temporanee e tarball locali generate dal test. Il package.json dimostrativo e i comandi principali vengono estratti dal Markdown. Verificati lockfile-only, ci senza lockfile/incoerente, manifest e lock immutati, ricreazione di node_modules, lifecycle del progetto/dipendenza saltati o eseguiti, build esplicita con/senza pre/post hook, ls/explain, omit=dev e pack dry-run senza hook o tarball.

Le fixture hanno configurazione utente/globale e cache isolate, offline attivo e registry loopback non utilizzabile. Non ereditano token, configurazioni npm arbitrarie o NODE_OPTIONS. Gli script controllati stampano messaggi o scrivono un solo marker nella dipendenza temporanea; non eseguono pacchetti esterni. Prima del cleanup ricorsivo viene verificato che la directory risolta sia la fixture creata dentro la directory temporanea.

Non vengono eseguiti audit/advisory o verifica firme contro registry reali, npm view/outdated online, pubblicazione, OIDC, gestione token, npm 12, dipendenze native/Git o una CI remota. I relativi comportamenti sono documentati da fonti ufficiali, non certificati da questi test. Nessun npm ci/install del test opera nella directory site e nessun lockfile del vault viene modificato.

## Node.js Runtime: Basics

Con la CLI npm 11.19.0 risolvibile tramite `NPM_CLI_PATH`, come nella sezione Supply chain:

```powershell
node --test _Meta/tests/javascript-node-basics.test.mjs
```

38 test Node estraggono config, CLI, manifest, file dimostrativi e test dalla nota Node.js Basics. Verificati default e limiti della configurazione, input invalidi, caricamento esplicito di .env e precedenza dell'ambiente, file mancanti/vuoti, percorsi con spazi, working directory distinta dagli import, stdout/stderr e codici di uscita. Provati inoltre runtime senza DOM, timer dopo codice sincrono, formati mjs/cjs/type, errore require in ESM, avvio npm, inoltro argomenti e test runner del demo.

Processi reali in fixture temporanee con ambiente e configurazione npm isolati; cleanup limitato al percorso risolto della directory creata. Nessuna installazione, richiesta al registry, modifica alle dipendenze del sito o scrittura nei file personali. La CLI legge piccoli file fidati: i test non certificano limiti di memoria, sicurezza di input remoti o gestione Unicode dei caratteri percepiti. Non sono provati watch/restart, shutdown di server, permessi del filesystem, pnpm/Yarn o una matrice di piattaforme/versioni.

## Node.js Runtime: File System, Path e Process

```powershell
node --test _Meta/tests/javascript-fs-path-process.test.mjs
```

77 test Node estraggono moduli e demo dalle due note. Provati lettura testo/Buffer, file opzionale vuoto/assente, abort gia richiesto, wx e conservazione del target, append, directory ordinate, dimensione in byte, rimozione del solo file dimostrativo e lettura limitata con FileHandle. L'esportazione JSON e provata su schema valido/invalido, parsing fallito, timestamp, selezione dei campi, sorgente conservato e output preesistente. Le pipeline eseguono copie binarie e propagano errori di sorgente/destinazione.

Le prove path/process coprono semantica POSIX e win32 esplicita, directory del modulo distinta dalla cwd, conversione URL con spazi e caratteri speciali, argv/execArgv, validazione di PORT/VERBOSE e precedenza CLI/ambiente/default. Le CLI reali vengono avviate con ambiente ridotto: verificati stdout/stderr, exit code e mancata esposizione dei campi riservati o del JSON malformato nei log.

Tutti i file sono in directory temporanee create dal test; la rimozione ricorsiva avviene solo dopo controllo del percorso risolto. Un link simbolico a directory (junction su Windows) collega due sottocartelle della stessa fixture e dimostra che il target reale puo essere fuori dalla base lessicale. Nessun accesso a dati personali, servizi esterni o registry; nessuna modifica alle dipendenze del sito.

Limiti: non sono un audit anti-path-traversal, un benchmark di memoria o un collaudo di crash, aggiornamenti concorrenti ostili, filesystem di rete, watcher, permessi multipiattaforma o shutdown dei servizi. L'abort e provato prima della lettura, non come rollback di una scrittura. I test FileHandle esercitano lettura e apertura fallita; non simulano un guasto intermedio di read/close. La sicurezza di una cancellazione reale non deriva dal successo di questa fixture.

## Node.js Runtime: Events e Streams

```powershell
node --test _Meta/tests/javascript-events-streams.test.mjs
```

58 test Node estraggono helper e demo dalle due note tramite AST. Verificati dispatch sincrono, receiver, registrazioni duplicate, once ricorsivo, off e cleanup idempotente, errori dei listener e captureRejections, attese installate prima della sorgente, abort ed errori di events.once. Il job e provato su batch vuoti, esecuzione sequenziale, sovrapposizione rifiutata, snapshot dell'array, worker e osservatori falliti, stato riutilizzabile e CLI completa.

Le prove stream eseguono lettura UTF-8 con caratteri multibyte a cavallo dei chunk, consumer asincrono sequenziale, scritture esclusive da iterable sincroni/asincroni, compressione e decompressione binaria reale, file vuoti/mancanti e destinazioni esistenti. Verificati serializzazione JSON Lines ed errori, break del Readable, write false con drain, errore della destinazione e abort durante una pipeline controllata. I pre-abort degli helper sono provati prima dell'apertura dei file.

Fixture temporanee e processi reali con ambiente ridotto; cleanup ricorsivo limitato alla directory creata, dopo verifica del percorso risolto. Nessuna rete, installazione o modifica a file personali e dipendenze del sito. Per questa suite non servono Playwright o npm CLI.

Limiti: niente benchmark di memoria/backpressure, prova di durabilita o rollback, matrice di sistemi operativi, carico HTTP o produttori async non cooperativi. L'abort durante il trasferimento e verificato su stream in memoria controllati, non mediante timing su file reali. Il confronto gzip riguarda il contenuto decompresso, non byte di archivio identici fra versioni. I test di cleanup verificano listener e stati osservabili, non tempi di garbage collection.

## Node.js Runtime: Buffer e HTTP server

```powershell
node --test _Meta/tests/javascript-buffer-http.test.mjs
```

79 test Node estraggono moduli, CLI e demo dalle note. Verificati lunghezze UTF-8/UTF-16, allocazione azzerata, conversioni numeriche, copia/alias, viste con offset, endianness e BigInt, hex rigoroso e conversione nativa permissiva, UTF-8 fatal, concatenazione e Base64. Il lettore limitato viene provato con file binari, nomi con spazi, file vuoti/mancanti, directory, limite esatto e superato, configurazioni invalide e diagnostica CLI.

Server HTTP reali ascoltano solo su 127.0.0.1 e porte assegnate dal sistema. Provati GET/HEAD, query, 404/405 e Allow, target rifiutati, byte length, charset/MIME, JSON/schema, UTF-8 invalido, BOM e body chunked. Verificati limite esatto, rifiuto anticipato tramite Content-Length, 413 dopo conteggio reale, header oltre limite, errori sync/async del servizio senza dettagli interni, upload interrotto, client disconnesso e signal cooperativo. Lo shutdown e provato sia attendendo una risposta attiva sia forzando la chiusura dopo il periodo di grazia.

Il client della nota contatta la fixture reale sostituendo soltanto la porta tramite il wrapper Fetch del test. La CLI server viene eseguita su argomenti invalidi e porta gia occupata dalla fixture; avvio riuscito e shutdown sono provati attraverso il modulo del server. Non vengono inviati SIGINT/SIGTERM a processi reali, ne certificata la gestione dei segnali su ogni sistema operativo.

File e processi temporanei con ambiente ridotto, cleanup dopo verifica dei percorsi risolti; server e socket chiusi alla fine delle prove. Nessuna richiesta esterna, registry, installazione o modifica al sito. Il sandbox puo impedire queste prove locali su socket e filesystem: non interpretare tale blocco come un errore delle note.

Limiti: non sono benchmark di memoria o un audit di parser HTTP, request smuggling, TLS, proxy, autenticazione, CORS, rate limiting o carico ostile. I timeout di ricezione/inattivita sono controllati come configurazione, non attendendo le loro scadenze reali; la tolleranza di shutdown viene invece esercitata. Le scritture HTTP frammentate possono essere ricombinate dal trasporto: non si assume una corrispondenza fra write del client e chunk lato server. Non vengono simulati short read/errori intermedi/close fallito del FileHandle, modifiche concorrenti al file o comportamento del pool in tutte le versioni.

## Node.js Runtime: Child process e Worker threads

```powershell
node --test _Meta/tests/javascript-child-worker.test.mjs
```

90 test Node sugli snippet estratti dal Markdown: programmi figli completi, argomenti letterali, UTF-8, input invalidi, JSON/schema, exit code e limiti stdout/stderr. Sono verificati anche ambiente ridotto, pre-abort, abort dopo l'avvio, cwd mancante, output ereditato e timeout reale su un processo figlio controllato.

I worker reali verificano conteggio dei primi e limiti, errori di costruzione, file mancante, input non clonabile, messaggi malformati/duplicati, uscita senza risultato, errore dopo il risultato, timeout e interruzione di un loop CPU. Sono controllati cleanup dei timer/listener, clone/transfer con ownership e Buffer ricevuto come Uint8Array. CLI e demo MessageChannel vengono eseguiti integralmente.

Fixture temporanee con percorsi verificati prima della rimozione, ambiente dei processi ridotto, nessun comando shell costruito da input e nessuna rete esterna. I processi e i thread avviati appartengono ai test; non vengono terminati servizi dell'utente.

Limiti: verifiche eseguite su Windows e Node 24.14.0, non una matrice OS/versioni. Nessuna prova di processi discendenti, shell injection contro tool reali, fork/IPC, segnali POSIX ignorati, pool, limiti RAM, OOM o sandbox. Messageerror nativo e fallimento interno di terminate non sono forzati; SharedArrayBuffer non e usato per un protocollo concorrente. I timeout non sono benchmark o deadline garantite. La prova di execFile su abort attende l'uscita del processo di fixture esterno, senza attribuire alla sola Promise del wrapper una garanzia di chiusura.

## Tooling: Testing ed ESLint

La suite richiede la CLI npm indicata da `NPM_CLI_PATH` e un'installazione separata dei tool, senza aggiungerli a Quartz. Per ricreare quella usata nelle prove, dalla shell PowerShell:

```powershell
$tools = Join-Path $env:TEMP 'appunti-eslint-tools'
npm install --prefix $tools --save-exact --ignore-scripts --no-audit --no-fund eslint@10.12.0 @eslint/js@10.0.1 globals@17.13.0
```

Il comando contatta il registro e scrive soltanto nella directory degli strumenti e nella cache npm. I test successivi usano le dipendenze locali, senza download.

```powershell
$env:ESLINT_TOOLS_DIR = Join-Path $env:TEMP 'appunti-eslint-tools'
node --test _Meta/tests/javascript-testing-eslint.test.mjs
```

74 test editoriali Node. Eseguono la suite di 11 test presentata nella nota Testing, il filtro per nome e il comando coverage; due alterazioni intenzionali nelle sole fixture verificano che i test rilevino gli errori. Provati inoltre limiti dello sconto, input e record invalidi, assenza distinta da guasto, propagazione asincrona e copia dei campi pubblici.

La configurazione ESLint e estratta integralmente dal Markdown ed eseguita con ESLint 10.12.0, @eslint/js 10.0.1 e globals 17.13.0. Prove API/CLI e npm verificano regole, scope browser/Node/CommonJS, import non risolto dal core, warning/soglie, exit code 0/1/2, ignore, disable inutili, fix/dry-run, print-config, debug e ricerca della configurazione da ciascun file in v10. Il comando print-config e stato corretto dopo aver osservato che lo script con `.` introduceva un secondo percorso.

Le fixture temporanee usano un link/junction verso le dipendenze esterne, non una nuova installazione per ogni caso. La rimozione controlla prima il percorso risolto della fixture; non elimina il target delle dipendenze. I test eseguono codice di esempio fidato e non modificano la configurazione o i pacchetti del sito.

Limiti: Node 24.14.0 e Windows, non una matrice OS/runtime. Non provati Jest, Vitest, plugin framework/import/TypeScript, editor, CI remota o watch persistente. I frammenti browser/server di ESLint sono analizzati dal linter, non collaudati come applicazione UI/backend. La coverage non certifica requisiti, correttezza contabile o assenza di difetti; le due mutazioni non sono una campagna completa di mutation testing.

## Tooling: Prettier e Vite

La suite usa Prettier 3.9.10 e Vite 8.3.4 installati fuori dal vault, la CLI npm indicata da `NPM_CLI_PATH` e Playwright/Chrome. Installazione iniziale, separata dai test:

```powershell
$tools = Join-Path $env:TEMP 'appunti-prettier-vite-tools'
npm install --prefix $tools --save-exact --ignore-scripts --no-audit --no-fund prettier@3.9.10 vite@8.3.4
```

Esecuzione successiva senza download:

```powershell
$env:PRETTIER_VITE_TOOLS_DIR = Join-Path $env:TEMP 'appunti-prettier-vite-tools'
node --test _Meta/tests/javascript-prettier-vite.test.mjs
```

32 test editoriali: 28 Node (incluso il contenitore della verifica del lifecycle) e 4 browser. I file dei progetti dimostrativi sono estratti dal Markdown tramite AST. Prettier e verificato con output esatto, idempotenza, mancato controllo semantico, parsing fallito, printWidth, lookup/override/EditorConfig, ignore, CLI e script npm, exit code 0/1/2, scrittura e anteprima API senza modifiche.

Vite viene provato con build npm reale, base /appunti/, CSS/asset, copia di public, pulizia di un vecchio output nella sola fixture, import mancante, TypeScript non verificato semanticamente e variabili dei mode. Una stringa privata fittizia resta fuori dal bundle; i valori pubblici e PROD sono controllati nell'output staging. Dev server e preview usano la configurazione della nota con la sola porta sostituita da 0, assegnata dal sistema; verificati host loopback e rifiuto di una porta gia occupata.

Chrome verifica il contatore, il link pubblico, CSS HMR senza perdere lo stato e reload completo dopo modifica al modulo vanilla. La build viene poi aperta su desktop/mobile, verificando titolo production, codice funzionante, assenza di overflow ed errori; cambiare il file env dopo la build non cambia il bundle servito. Questa prova non e il controllo visuale separato delle pagine Quartz.

Le fixture creano link/junction ai soli pacchetti esterni e shim CLI locali per gli script npm; non installano dipendenze a ogni caso. Configurazione e cache Vite restano nelle directory di prova. Server, browser e watcher sono chiusi; la rimozione ricorsiva verifica il percorso risolto e riguarda soltanto la fixture, non il target dei link. Nessun accesso a backend esterni o modifica dei pacchetti Quartz.

Limiti: Windows, Node 24.14.0 e Chrome 155.0.8059.40, non una matrice OS/browser. Nessun collaudo di editor, hook, plugin di terzi, template create-vite, framework, library mode, SSR, reverse proxy, hosting remoto o compatibilita legacy. La prova di mancata esposizione riguarda un valore fittizio con il prefisso predefinito, non un audit completo dei segreti. Il caso TypeScript dimostra che la build non fa type checking; non esegue tsc. Installazione con script disabilitati riuscita per i pacchetti e la piattaforma provati, non garanzia per qualunque plugin.

## Tooling: Bundling e source map

La suite riusa Vite 8.3.4 dalla directory `PRETTIER_VITE_TOOLS_DIR` descritta sopra, la CLI npm indicata da `NPM_CLI_PATH` e Playwright/Chrome. Non installa altri pacchetti.

```powershell
node --test _Meta/tests/javascript-bundling-sourcemaps.test.mjs
```

24 test editoriali: 20 Node e quattro Chrome. I demo completi sono estratti dal Markdown tramite AST e costruiti con Vite reale. Sono provati import nominati e namespace statici/dinamici, manifest, funzione inutilizzata con effetti nel corpo, inizializzazione del modulo, metadati sideEffects corretti/errati e annotazioni PURE con argomenti che hanno effetti.

Tre casi diagnostici distinguono tree shaking e DCE nell'output: Vite 8.3.4 conserva dce-only con build.minify false. Disabilitare un solo passaggio non conserva la funzione inutilizzata; disabilitando entrambi il marcatore resta. Questi casi hanno corretto l'assunzione iniziale del test, non un difetto della toolchain. Le varianti sintetiche di metadati e annotazioni sono create soltanto nelle fixture.

Le mappe sono verificate come JSON: modalita esterna, inline, hidden e false; sourcesContent presente/omesso, sorgente eliminato dal JavaScript ma ancora nel testo della mappa. Un GET reale dimostra che hidden non impedisce l'accesso al file distribuito. Una piccola entry destinata a Node verifica distintamente gli stack con e senza --enable-source-maps.

Chrome verifica caricamento del chunk al primo click, riuso del modulo e errore di rete intercettato senza bloccare il pulsante. Il debugger CDP si ferma sull'eccezione reale del bundle minificato; SourceMap di Node traduce la posizione generata nella riga originale. La correzione del chiamante viene ricostruita e provata su desktop/mobile, con risultato ADA e senza errori.

Fixture temporanee con link/junction alle dipendenze esterne, shim CLI locali e server loopback su porte assegnate dal sistema. Cleanup di server/browser e verifica del percorso risolto prima della rimozione; nessuna rete esterna durante le prove o modifica dei pacchetti Quartz.

Limiti: Windows, Node 24.14.0, Vite 8.3.4 e Chrome 155.0.8059.40. La traduzione CDP/SourceMap non automatizza l'interfaccia DevTools, Watch, logpoint o tutti i breakpoint. Non provati upload a error tracker, policy di hosting/CDN, cache di vecchie release, catene TypeScript/plugin, librerie pubblicate, CSS side effects, CommonJS o tutte le ottimizzazioni dei bundler. Le prove su console in VM riguardano fixture isolate, non un DOM completo. Nessun benchmark, audit dei segreti o matrice multipiattaforma.

## Applicazioni: SPA e API REST

La suite riusa Vite 8.3.4 dalla directory `PRETTIER_VITE_TOOLS_DIR` e Playwright/Chrome, senza nuove dipendenze del sito. Le API Fetch/Response sono quelle native di Node 24.14.0 e del browser.

```powershell
node --test _Meta/tests/javascript-spa-rest.test.mjs
```

44 test: 32 Node e 12 Chrome. Il codice di router, client HTTP e demo e estratto direttamente dal Markdown tramite AST. Il progetto SPA viene costruito con Vite e servito in preview su loopback; i test di parsing e del contratto REST usano risposte controllate.

Il client REST e verificato per base URL, ID, nomi, limiti e assenza di chiamate su input invalido; proiezione dei campi, body/header, GET/POST/DELETE, 204 senza JSON, status 2xx inattesi, media type, parsing, schema e ID incoerente. Gli errori Problem Details non sostituiscono lo status reale o espongono campi aggiuntivi; HTML, JSON malformato, errori di trasporto e pre-abort hanno prove distinte.

Tre server HTTP temporanei provano richieste reali, rifiuto dei redirect e abort dopo l'inizio della lettura JSON del corpo incompleto. Un wrapper strumenta la chiamata nativa response.json per sincronizzare quel test senza affidarsi a una pausa temporale. Il demo offline viene eseguito integralmente da Node. Nel browser, Fetch con risposte intercettate prova il contratto e l'omissione di un cookie fittizio gia presente sul dominio.

Le prove SPA verificano ingresso diretto, refresh e query, aggiornamento di URL/titolo/focus/aria-current senza nuovo documento, click ripetuto, Indietro/Avanti con stato null, 404 client e nomi ereditati, query non fidata, elementi annidati e cleanup idempotente. Quindici casi di click sono eventi sintetici con default finale bloccato dal test; Ctrl/Cmd-click, Enter e navigazione a un'ancora sono invece azioni reali di Chrome. Verificato anche che pushState/replaceState non aggiornino da soli la vista.

Fixture e collegamenti alle dipendenze vivono in directory temporanee, rimosse dopo controllo del percorso risolto. Server e browser sono chiusi; non vengono modificati routing, cookie o sorgenti di Quartz. Nessuna rete esterna o installazione durante i test.

Limiti: Windows, Node 24.14.0, Vite 8.3.4 e Chrome 155.0.8059.40, non una matrice browser/hosting. Il demo REST non e un backend con database, autenticazione o piena conformita REST; non sono collaudati PUT/PATCH, ETag, cache, paginazione, retry, limiti di byte, CORS o rollback server. Lo schema timeout della nota non viene atteso per cinque secondi: propagazione del signal e abort reale sono verificati separatamente. Per il router non sono provati framework, loader asincroni, scroll restoration con contenuti variabili, screen reader, BFCache, CSP, hash router o policy remote di fallback. I controlli del sito Quartz restano separati.

## Applicazioni: Server-side rendering

La suite usa soltanto Node.js e Playwright/Chrome gia disponibili, senza nuove dipendenze del sito.

```powershell
node --test _Meta/tests/javascript-ssr.test.mjs
```

33 test: 25 Node e otto Chrome. I quattro file del demo sono estratti dal Markdown tramite AST e scritti nella sola fixture temporanea. Renderer e server vengono importati realmente; una prova avvia anche main in un processo figlio, cambiando soltanto porta e URL stampato per usare una porta assegnata dal sistema.

Le prove Node coprono escaping, Unicode e dati di tipo errato; HTML iniziale, ricerca, trim, query duplicate e limite UTF-16, Content-Length in byte, GET/HEAD, asset fisso, 404/405/500 e header. Richieste HTTP native verificano il rifiuto dei target con autorita esterna. Un loader asincrono controllato sincronizza due richieste contemporanee per verificare la separazione di query e risultati. Errori e dati invalidi del loader non espongono dettagli nella risposta.

Chrome prova contenuto e form con JavaScript disabilitato, ordinamento dei nodi esistenti senza richieste, script bloccato, ricerca vuota, 404 reale e tastiera mobile. Due prove rimuovono la CSP solo nella risposta intercettata della fixture: l'assenza di markup iniettato dipende cosi dall'escaping, non da un blocco dello script da parte della policy. Il demo ordinario mantiene la CSP della nota e carica il modulo esterno.

Server loopback, browser e processo figlio vengono chiusi. La rimozione della directory temporanea controlla percorso risolto, parent e prefisso; nessuna modifica al sito, nuova installazione o rete esterna. Corretto un falso positivo iniziale dell'assertion: la parola italiana Errore non e lo stack JavaScript Error:.

Limiti: Windows, Node 24.14.0 e Chrome 155.0.8059.40; non una matrice browser o un audit XSS completo. Non vengono eseguiti hydration React, RSC, streaming, SSG, rigenerazione, edge, database, autenticazione, cache/CDN, deadline del loader o deployment. La concorrenza prova lo stato locale del demo, non l'isolamento di un sistema multiutente. Nessun benchmark SEO/performance, prova sotto carico, certificazione accessibilita o interruzione controllata del lavoro remoto. Le verifiche della pagina Quartz sono separate.

## Promemoria JavaScript

`javascript-promemoria.test.mjs` controlla tutte le 11 schede operative JavaScript, estraendo i blocchi dal Markdown tramite AST.

```powershell
node --test _Meta/tests/javascript-promemoria.test.mjs
```

Richiede Playwright/Chrome come le altre suite browser; usa esbuild gia presente in site soltanto per il controllo sintattico. Nessuna nuova dipendenza del sito.

64 test superati: 49 Node, di cui 11 gruppi di sola verifica sintattica (uno per scheda), e 15 Chrome. Il parsing di tutti i blocchi JavaScript non equivale alla loro esecuzione integrale.

- Node: binding, nullish/default, copie, funzioni/closure/this, mutazioni degli array, raggruppamento con chiavi speciali, proiezione dei campi, Map/Set, regex e precisione numerica.
- Date: processi separati in UTC ed Europe/Rome, con confronto fra sette giorni di calendario e durata fissa attraverso il cambio d'ora. I moduli ESM vengono scritti in fixture temporanee ed eseguiti realmente da Node e Chrome.
- Promise e Fetch: catene e cleanup, combinatori, lavoro sequenziale/concorrente, cancellazione del corpo, status/media type/schema, query e timeout durante la lettura JSON. Le prove VM usano fake dichiarati; il server loopback verifica anche una risposta HTTP reale incompleta.
- Chrome: selezioni DOM, testo, spostamento dei nodi, listener e cleanup, campi FormData ripetuti, delegazione che esclude liste annidate, DOMContentLoaded prima/dopo il caricamento, storage valido/corrotto/bloccato, reload di sessionStorage, abort immediato e header Authorization con credentials omit.
- Lo storage viene cancellato soltanto nell'origine locale isolata della fixture. Le prove di quota e accesso negato sostituiscono le API; non simulano una quota reale del browser. Le richieste intercettate non contattano un backend autenticato.

Directory temporanee rimosse dopo verifica di percorso risolto, parent e prefisso; server e contesti browser chiusi. Nessuna rete esterna, credenziale o modifica a dati personali. Limiti: versioni indicate, non matrice browser, benchmark o audit di sicurezza; gli esempi intenzionalmente schematici ricevono il contesto dichiarato nei test. Le prove delle schede Quartz sono separate dall'esecuzione degli snippet.

## Fondamenta React

`react-fondamenti.test.mjs` estrae gli esempi dalle cinque note iniziali di React, senza mantenere una seconda implementazione dei componenti. Non richiede modifiche alle dipendenze di Quartz.

Installa una toolchain isolata, fuori dal vault, solo se non gia disponibile:

```powershell
npm install --prefix "$env:TEMP/appunti-react-tools" --save-exact --ignore-scripts --no-audit --no-fund react@19.3.0 react-dom@19.3.0 vite@8.3.4 @vitejs/plugin-react@6.1.2
```

Indica il percorso se diverso da quello temporaneo predefinito:

```powershell
$env:REACT_TOOLCHAIN_PATH = Join-Path $env:TEMP 'appunti-react-tools'
```

Con Playwright e Chrome risolvibili come descritto nella sezione Browser:

```powershell
node --test _Meta/tests/react-fondamenti.test.mjs
```

Risultato del 2026-10-14: **33 test superati**, 19 Node.js 24.14.0 e 14 Chrome 155.0.8059.79. Cinque test Node controllano soltanto la sintassi JSX/JS; gli altri verificano rendering statico di componenti selezionati e build del progetto completo. Rendering statico nei test non significa che il demo sia un'app SSR.

- Controllati default, booleani, Fragment, style, escaping testuale, children, condizioni, importi visualizzati e dati congelati.
- Build reale tramite API Vite; il progetto minimo viene provato nel dev server e nella preview di produzione, anche a 390 px. Non viene invocato il generatore create-vite ne una nuova installazione per ogni fixture.
- Browser: callback, contatori funzione/classe equivalenti, initialValue rispetto a key, input controllati, label con useId, filtro/selezione/reset, bozze locali e identita del nodo dopo un riordino.
- Una variante generata soltanto nella fixture sostituisce la key stabile con l'indice: la prova riproduce la bozza sulla riga sbagliata. Non e un cambiamento agli appunti o una mutation suite completa.
- Fixture con directory node_modules locale e junction per singola dipendenza, per evitare problemi della cache Vite su Windows. Collegamenti rimossi senza attraversare le destinazioni; percorso risolto, parent e prefisso verificati prima di cancellare la fixture. Server e contesti browser chiusi.

Limiti: non matrice browser, audit di accessibilita o benchmark; non eseguiti framework, RSC/hydration, error boundary, lifecycle/effect, Fast Refresh, lint o type checking. Nessuna rete esterna durante i test, nessuna credenziale o dato personale. I controlli del sito Quartz sono separati. La suite JavaScript precedente non e stata rieseguita in questo blocco React.

## React: Stato e Rendering

`react-stato-rendering.test.mjs` estrae i componenti completi da useState, useEffect, useRef e Gestione Moduli. Riusa React/React DOM della toolchain esterna del blocco precedente; aggiungi soltanto la dipendenza dell'esempio form:

```powershell
npm install --prefix "$env:TEMP/appunti-react-tools" --save-exact --ignore-scripts --no-audit --no-fund react-hook-form@7.90.0
```

Con `REACT_TOOLCHAIN_PATH` e `PLAYWRIGHT_MODULE_PATH` impostati come sopra, esegui serialmente anche la regressione dei fondamenti:

```powershell
node --test --test-concurrency=1 _Meta/tests/react-fondamenti.test.mjs _Meta/tests/react-stato-rendering.test.mjs
```

Risultato del 2026-10-15: **62 test superati**, 33 precedenti e 29 nuovi. I nuovi sono 8 Node (quattro gruppi di sola sintassi, un initializer puro e tre render statici senza effect) e 21 Chrome. Ambiente: React 19.3.0, React Hook Form 7.90.0, Node 24.14.0, Chrome 155.0.8059.79.

- Bundle dei moduli estratti con esbuild e JSX automatico, mantenuto in memoria; nessuna seconda implementazione degli esempi, file applicativo o nuova dipendenza nel vault. Questo blocco non richiede junction o directory di fixture.
- React Strict Mode nel browser: coda degli updater, reset e aggiornamenti annidati; cleanup del titolo e intervallo unico. Timer controllati con l'orologio Playwright, senza attese reali arbitrarie; verificata rimozione degli handle allo smontaggio.
- Fetch reale su server HTTP loopback per successo, selezione, encoding dell'id, HTTP 404, JSON malformato e schema non valido. Il 404 atteso viene distinto dagli errori inattesi del browser.
- Due prove usano esplicitamente un mock Fetch differito che ignora l'abort: risposte fuori ordine, rifiuto di rete/abort, caricamento al cambio id e risposta dopo unmount. Verificano il guard `active` e i signal, non il trasporto di rete o la cancellazione sul server.
- Focus, testo non controllato, riprogrammazione/cancellazione timeout e storico del valore precedente all'evento.
- Form: select/checkbox, validazione HTML, invio con Enter, stato pending, lock contro invii simultanei, successo, errore/retry, reset; credenziali fittizie e password non normalizzata. FormData con selezioni multiple e reset nativo; React Hook Form con errore accessibile e normalizzazione del nome.
- Server e browser di prova chiusi. Nessun servizio remoto, autenticazione, salvataggio reale o modifiche a package/lockfile di Quartz.

Limiti: i frammenti schematici ricevono solo controllo sintattico. Non verificati tutti i comportamenti citati in prosa, ESLint/React Compiler, Controller, resolver Zod/Yup, Actions, SSR/hydration, applicazioni backend, idempotenza o sicurezza dell'autenticazione. I render statici verificano l'assenza di esecuzione degli effect, non una soluzione SSR. Nessuna matrice browser o audit completo di accessibilita. La suite JavaScript precedente non e stata rieseguita; la verifica Quartz resta separata.

## React: Toolchain e Styling

`react-toolchain-styling.test.mjs` ricostruisce tre progetti dagli esempi di Profiler e Debugging, CSS Modules e Styling base. Riusa package/config/HTML/main della nota introduttiva e le dipendenze esterne gia indicate; nessun pacchetto aggiuntivo necessario.

Con `REACT_TOOLCHAIN_PATH` e `PLAYWRIGHT_MODULE_PATH` configurati:

```powershell
node --test --test-concurrency=1 _Meta/tests/react-fondamenti.test.mjs _Meta/tests/react-stato-rendering.test.mjs _Meta/tests/react-toolchain-styling.test.mjs
```

Risultato del 2026-10-15: **90 test React superati**, 62 precedenti e 28 nuovi. I nuovi comprendono tre gruppi di sola sintassi JSX/CSS, tre controlli delle build Vite reali e 22 prove Chrome. React 19.3.0, Vite 8.3.4, plugin React 6.1.2, Node 24.14.0 e Chrome 155.0.8059.79.

- Verificati callback Profiler con mount/update e campi numerici; filtro, stato vuoto e reset sia in sviluppo sia in produzione. Nella build di produzione normale il callback non emette record. Nessuna soglia temporale usata come requisito di performance.
- Corretto un difetto del banco di prova: chiamare Vite build e poi createServer nello stesso processo lasciava NODE_ENV=production anche al server chiamato dev. Ora le build precedono tutti i server dev, NODE_ENV e esplicito e viene verificato config.isProduction=false. Correzione applicata anche al test dei fondamenti e intera regressione ripetuta; i vecchi risultati restano validi per i comportamenti verificati, non certificavano da soli la modalita sviluppo.
- CSS Modules: nomi distinti fra file, classi multiple da composes, stili applicati, selezione e ARIA, ereditarieta delle variabili, influenza del CSS globale e limite del selettore global discendente.
- Styling: tema locale, spaziatura dinamica, submit/reset, disabled effettivo, focus da tastiera, hover e movimento ridotto. Testata la produzione a 320, 390 e 1440 px, poi con font base al 200% e titolo lungo. Quest'ultima prova ha rilevato un overflow nel titolo dell'esempio CSS Modules, corretto nella nota.
- Screenshot dei demo opzionali: impostare REACT_QA_DIR a una directory di output prima del comando. Ispezionati quattro screenshot dei demo, con desktop/mobile e tema scuro. Non e una suite automatica di confronto pixel.
- Fixture temporanee con node_modules locale e junction sulle singole dipendenze. Browser/server chiusi; junction scollegate e percorsi risolti verificati prima della rimozione delle directory di test. Dipendenze originali e sito Quartz non modificati.

Limiti: non automatizzati i pannelli dell'estensione React DevTools, le Performance tracks, un profiler di produzione dedicato, un benchmark o un audit completo di accessibilita/contrasto. Non verificati Sass, altri trasformatori CSS, utility framework o CSS-in-JS, lint e type checking. I frammenti schematici hanno solo controllo sintattico. La suite JavaScript non e stata rieseguita; le pagine Quartz vengono controllate separatamente dai demo.

## React: Hooks e Stato

`react-hooks-stato.test.mjs` estrae gli esempi di useMemo e useCallback, useReducer e Custom Hooks. Riusa la toolchain esterna gia configurata; nessuna nuova dipendenza necessaria.

Con `REACT_TOOLCHAIN_PATH` e `PLAYWRIGHT_MODULE_PATH` impostati, esegui anche la regressione precedente:

```powershell
node --test --test-concurrency=1 _Meta/tests/react-fondamenti.test.mjs _Meta/tests/react-stato-rendering.test.mjs _Meta/tests/react-toolchain-styling.test.mjs _Meta/tests/react-hooks-stato.test.mjs
```

Risultato del 2026-10-15: **128 test React superati**, 90 precedenti e 38 nuovi. I nuovi comprendono **14 test Node** (tre gruppi di sola sintassi, nove prove di funzioni pure e due render statici) e **24 test Chrome**, dodici per ambiente. React 19.3.0, Node 24.14.0 e Chrome 155.0.8059.79; la regressione conserva anche le build Vite 8.3.4 dei blocchi precedenti.

- Bundle esbuild in memoria, separati con NODE_ENV esplicito development/production, stessi snippet senza riscrittura degli algoritmi. Strict Mode nel browser; nessuna fixture su disco o junction per il nuovo file.
- Funzioni pure: filtro normalizzato, contatore, initializer indipendenti, copie annidate, errore/conferma/reset, no-op e azioni invalide. Stato e azioni congelati per rilevare mutazioni, determinismo controllato su chiamate ripetute.
- Catalogo: filtro, vuoto, contatore e callback che usa il nuovo sconto, preservando la fotografia dell'ultima scelta fino al clic successivo. Non viene misurata la velocita o promesso un numero fisso di render evitati.
- Reducer montati: due dispatch consecutivi, invio con Enter, errore associato all'input, normalizzazione, modifica dopo conferma, reset; nuove props iniziali non resettano, azione esplicita e nuova key si.
- Custom hook: pannelli indipendenti con ID distinti; titolo aggiornato e ripristinato con un solo proprietario. Debounce con orologio Playwright, query successive, cambio del ritardo, due istanze, handle annullati allo smontaggio e reset al remount. Verificate anche funzioni conservate come valori senza invocazione accidentale.
- Server HTTP loopback e browser chiusi a fine test. Nessun servizio remoto, persistenza, installazione o modifica al package/lockfile di Quartz.

Limiti: gli schemi ricevono solo controllo sintattico; la tabella delle transizioni asincrone non e un backend eseguito. Niente benchmark, React Compiler, ESLint/type checking, comparator personalizzati, invalidazione da Suspense/Fast Refresh, SSR/hydration, cache di rete, coordinamento di titoli concorrenti o matrice browser. I render statici non eseguono gli effect e non dimostrano un'app SSR. La suite JavaScript non e stata rieseguita; QA Quartz distinta dai test React.

## React: Context, Store e Stato Derivato

`react-context-store-derived.test.mjs` estrae gli esempi di Context API, State Management Esterno e Derived state. Alla toolchain temporanea esterna si aggiungono le tre librerie usate dagli esempi, senza modificare le dipendenze di Quartz:

```powershell
npm install --prefix "$env:TEMP/appunti-react-tools" --save-exact --ignore-scripts --no-audit --no-fund zustand@5.0.15 @reduxjs/toolkit@2.13.0 react-redux@9.3.0
```

Con `REACT_TOOLCHAIN_PATH` e `PLAYWRIGHT_MODULE_PATH` impostati come sopra, esegui la regressione completa React:

```powershell
node --test --test-concurrency=1 _Meta/tests/react-fondamenti.test.mjs _Meta/tests/react-stato-rendering.test.mjs _Meta/tests/react-toolchain-styling.test.mjs _Meta/tests/react-hooks-stato.test.mjs _Meta/tests/react-context-store-derived.test.mjs
```

Risultato del 2026-10-15: **166 test React superati**, 128 precedenti e 38 nuovi. I nuovi comprendono **16 test Node** (tre gruppi di sola sintassi, quattro render statici e nove prove di store/funzioni pure) e **22 test Chrome**, undici per ambiente. React 19.3.0, Zustand 5.0.15, Redux Toolkit 2.13.0, React Redux 9.3.0, Node 24.14.0 e Chrome 155.0.8059.79.

- Bundle esbuild in memoria, con NODE_ENV development/production esplicito e Strict Mode nel browser. Il nuovo file non crea progetti Vite, junction o fixture su disco; la regressione conserva le build Vite reali dei blocchi precedenti.
- Context: fallback solo senza provider, undefined esplicito, guard, provider annidati indipendenti, ID distinti, aggiornamenti dei consumatori memo e differenza fra nuova prop iniziale e nuova key.
- Zustand e Redux: factory isolate, snapshot precedenti invariati, azioni e reset, sottoscrizioni manuali e unsubscribe. Nel browser lo stato e condiviso, sopravvive allo smontaggio del componente ma si perde dopo reload; il reset Zustand conserva le azioni grazie al merge.
- Dati derivati: initializer indipendenti, filtro normalizzato, ordinamento su copia e totale comprensivo delle quantita. Selezione aggiornata per ID, filtro che non elimina la selezione, rimozione, lista vuota e reset.
- Bozze: il cambio di key scarta la modifica; una nuova prop con la stessa identita non sovrascrive il valore locale. I render statici controllano il markup, non hydration o un'applicazione SSR.
- Browser e server loopback chiusi alla fine. Nessun backend remoto, persistenza aggiunta o modifica al package/lockfile di Quartz.

Limiti: schemi e anti-pattern ricevono solo controllo sintattico. Niente benchmark, conteggi fissi di render evitati, React Compiler, lint/type checking, SSR/hydration, middleware di persistenza, cache di rete, sincronizzazione fra schede o implementazioni Jotai/Recoil. Nessuna matrice browser o audit completo di accessibilita. La suite JavaScript non e stata rieseguita; QA delle pagine Quartz distinta dall'esecuzione degli esempi.

## React: Routing, Cache e Validazione

`react-routing-query-validation.test.mjs` estrae gli esempi di React Router, Data Fetching e Cache e Validazione Dati. Installa le dipendenze nella toolchain temporanea esterna, non in Quartz:

```powershell
npm install --prefix "$env:TEMP/appunti-react-tools" --save-exact --ignore-scripts --no-audit --no-fund react-router@8.4.0 @tanstack/react-query@5.104.3 zod@4.6.7
```

Con `REACT_TOOLCHAIN_PATH` e `PLAYWRIGHT_MODULE_PATH` gia impostati:

```powershell
node --test --test-concurrency=1 _Meta/tests/react-fondamenti.test.mjs _Meta/tests/react-stato-rendering.test.mjs _Meta/tests/react-toolchain-styling.test.mjs _Meta/tests/react-hooks-stato.test.mjs _Meta/tests/react-context-store-derived.test.mjs _Meta/tests/react-routing-query-validation.test.mjs
```

Risultato del 2026-10-15: **227 test React superati**, 166 precedenti e **61 nuovi**: 11 Node (tre gruppi di sintassi e otto prove di parser/schema/cache) e 50 Chrome, 25 per ambiente. React 19.3.0, React Router 8.4.0, TanStack Query 5.104.3, Zod 4.6.7, Node 24.14.0, Chrome 155.0.8059.79.

- Bundle esbuild in memoria con NODE_ENV esplicito development/production e Strict Mode. Nessuna riscrittura degli algoritmi delle note. La regressione include le build Vite dei blocchi precedenti; il nuovo file non crea un progetto Vite o fixture su disco.
- Router su server HTTP loopback: filtri URL, parametri preservati, history, layout, apertura profonda/reload con fallback SPA della fixture. Percorso sconosciuto, parametro invalido, record assente, HTTP fallito, JSON/schema invalidi, lista vuota e navigazione annullata. Parser utenti verificato nel browser.
- Query su endpoint locali GET/PATCH: caricamento, vuoto, errori iniziali e retry, refresh fallito con dati conservati, previsione ottimistica e risposta autorevole. Promise del refetch mantenuta in pending, rollback anche se il refetch fallisce, errore dopo una scrittura avvenuta, ID codificato/risposta incoerente e Fetch cancellato allo smontaggio.
- I gate del server rendono osservabili gli stati intermedi senza ritardi fissi. Le checkbox sono azionate con click e poi attese: `check()` presumeva erroneamente un cambio sincrono, mentre onMutate attende cancelQueries. La correzione riguarda il banco di prova, non un algoritmo diverso dal Markdown.
- Zod: input/output e copie, limiti numerici, vuoto/coercion, email e nome, errori globali/per campo, refine, campi sconosciuti. Browser: focus, attributi ARIA, Enter, testo escapato da React, reset e due form indipendenti. Non e una certificazione completa di accessibilita.
- Server/browser chiusi; cache Node ripulita per non lasciare timer. Endpoint e dati del server sono fixture di test, non un backend distribuito o fornito dalla libreria. Dipendenze/lockfile Quartz invariati.

Limiti: non eseguiti action/fetcher, Framework Mode, SSR/hydration, HashRouter/basename, migrazione di un'app esistente, deploy reale, matrice browser, lint o type checking. Nessun test completo di offline, GC della cache, polling, persistenza, scritture concorrenti, autenticazione o sicurezza backend. Non implementati resolver RHF e validatori asincroni; nessuna verifica di proprieta delle email. Il fallback SPA del server di test non certifica l'hosting dell'utente. Suite JavaScript non rieseguita; QA Quartz separata.

## React: Component Patterns

`react-component-patterns.test.mjs` estrae gli esempi di Compound Components Pattern, Control Props e State Reducer Pattern, Portals ed Error Boundaries. Usa React e React DOM 19.3.0 della toolchain temporanea gia descritta; nessuna nuova dipendenza Quartz.

Con le variabili `REACT_TOOLCHAIN_PATH` e `PLAYWRIGHT_MODULE_PATH` impostate:

```powershell
node --test --test-concurrency=1 _Meta/tests/react-fondamenti.test.mjs _Meta/tests/react-stato-rendering.test.mjs _Meta/tests/react-toolchain-styling.test.mjs _Meta/tests/react-hooks-stato.test.mjs _Meta/tests/react-context-store-derived.test.mjs _Meta/tests/react-routing-query-validation.test.mjs _Meta/tests/react-component-patterns.test.mjs
```

Risultato del 2026-10-15: **281 test React superati** nella regressione seriale, 227 precedenti e **54 nuovi**: 10 Node (quattro gruppi di sintassi, due prove di reducer e quattro di render statico/server) e 44 Chrome, 22 in sviluppo e 22 in produzione. NODE_ENV esplicito, Strict Mode, Node 24.14.0 e Chrome 155.0.8059.79.

- Accordion: guard, ID e collegamenti ARIA, tastiera, singola apertura, stato conservato nei pannelli nascosti, default contro key, istanze indipendenti e provider annidati.
- Control Props: false controllato, default ignorato in controlled, richiesta rifiutata dal parent, aggiornamento accettato, callback non duplicata e assenza di submit. Reducer puro, limite, identita quando rifiuta, reset e quattro dispatch nello stesso batch; render prop eseguita dal demo.
- Portal: Context conservato, percorso degli eventi React distinto da un listener DOM nativo, target assente e cleanup. Render server senza document e hydration reale del suo placeholder, senza mismatch: prova limitata a questo wrapper, non a un framework SSR.
- Dialog nativo: ruolo/nome, stato modale, focus iniziale, Tab, impossibilita di focalizzare il controllo esterno, Escape, annullamento, conferma, ritorno del focus, riapertura e unmount. Nessuna certificazione screen reader o matrice browser.
- Boundary: isolamento, perdita dello stato del figlio dopo reset, conservazione del fratello, retry senza riparazione, errori di render/effect/Action async, fallback guasto catturato dal boundary superiore. Eventi e timer generano gli errori browser esattamente attesi, non un fallback; la classe non intercetta il render server.
- SaveButton: Promise controllata dal test per osservare pending, rifiuto gestito e retry riuscito. Non e una richiesta HTTP reale. Il reporting usa callback espliciti della root e del boundary, controllando messaggi e componentStack senza imporre conteggi identici in Strict Mode.
- Bundle in memoria e server loopback, chiusi insieme al browser al termine. Gli errori attesi sono confrontati esplicitamente; altri errori di console, pagina, root, hydration e HTTP fanno fallire le prove.

Limiti: niente full audit di accessibilita, animazioni, browser diversi, positioning di tooltip/menu, scroll locking, rimozione dinamica del target o combinazione controlled+state reducer. Non eseguiti streaming SSR, RSC, router/framework boundary, lazy/use con Promise, servizio remoto di logging, lint/type checking o audit di sicurezza. I test di API non certificano ogni caso descritto nella prosa. Suite JavaScript non rieseguita; QA Quartz distinta dagli esempi.

## React: UX e Accessibilita

`react-ux-accessibilita.test.mjs` estrae gli esempi di WAI-ARIA, Focus Management, Animazioni e Micro-interazioni e Internazionalizzazione. Le dipendenze aggiuntive sono isolate dalla toolchain Quartz:

```powershell
npm install --prefix "$env:TEMP/appunti-react-tools" --save-exact --ignore-scripts --no-audit --no-fund motion@14.2.0 @react-spring/web@10.1.2 i18next@26.4.5 react-i18next@17.0.16 axe-core@4.14.0
```

Con `REACT_TOOLCHAIN_PATH` e `PLAYWRIGHT_MODULE_PATH` impostati come nelle sezioni precedenti:

```powershell
node --test --test-concurrency=1 _Meta/tests/react-fondamenti.test.mjs _Meta/tests/react-stato-rendering.test.mjs _Meta/tests/react-toolchain-styling.test.mjs _Meta/tests/react-hooks-stato.test.mjs _Meta/tests/react-context-store-derived.test.mjs _Meta/tests/react-routing-query-validation.test.mjs _Meta/tests/react-component-patterns.test.mjs _Meta/tests/react-ux-accessibilita.test.mjs
```

Risultato del 2026-10-15: **328 test React superati** nella regressione seriale, 281 precedenti e **47 nuovi**: 11 Node (quattro gruppi di sola sintassi, sei prove di i18n/Intl e un render statico) e 36 Chrome, 18 per ambiente. React/React DOM 19.3.0, Node 24.14.0 e Chrome 155.0.8059.79. NODE_ENV esplicito, Strict Mode, bundle in memoria e server HTTP loopback.

- ARIA: disclosure con Enter/Space e Tab, pannello nascosto, stato del checkbox conservato, due istanze con ID indipendenti. Form: nome accessibile, descrizioni e riferimento all'errore, aria-invalid, invio con Enter, stato aggiornato e interpolazione trattata come testo.
- Focus: nessuno spostamento al mount iniziale, apertura dopo commit, Salva/Annulla/Escape e ritorno al controllo, bozza scartata, render che non ruba il focus. Il caso IME usa un KeyboardEvent sintetico con isComposing, non un sistema di input reale. Skip link attivato da tastiera, destinazione a tabindex -1 e successiva tabulazione.
- CSS: transition, hover, focus visibile e alternativa con prefers-reduced-motion. Motion: entrata, permanenza in uscita con inert/aria-hidden, rimozione, riapertura e variante senza movimento. React Spring: valori finali nei due regimi e cleanup. Non sono benchmark di frame rate o certificazioni di comfort visivo.
- i18n: istanze e cataloghi indipendenti, zero/plurali/grandi numeri, fallback e chiavi mancanti. Intl: locale distinto dalla valuta e fuso esplicito con cambio giorno. JSX non interpreta l'interpolazione come HTML.
- Browser i18n: cambio lingua, testo/nomi accessibili, lang/dir e ripristino, fuso Rome anche con browser impostato su America/Los_Angeles, bootstrap completo estratto dalla nota e reload senza persistenza. Pending, rifiuto e retry sono simulati con una Promise controllata, non con un backend di traduzioni.
- Due assunzioni iniziali dei test corrette: separatore italiano non obbligatorio sui numeri a quattro cifre e mock installato prima del mount, per rispettare il wrapper restituito da useTranslation. Nessuna dipendenza dell'esempio da dettagli interni di react-i18next.
- Dodici scansioni axe-core su stati selezionati, con tag WCAG 2 A/AA e 2.1 A/AA: nessuna violazione rilevata. Non equivalgono a conformita completa, verifica degli annunci vocali o copertura di tutta la UI. Errori di pagina/HTTP/console fanno fallire le prove; solo l'avviso specifico Motion sulla preferenza ridotta e ammesso nei relativi test.
- CSS della nota iniettato dal server fixture, non riscritto. Il nuovo file non avvia Vite; la regressione conserva le build reali dei blocchi precedenti. Browser/server chiusi e nessuna modifica alle dipendenze di Quartz.

Limiti: nessun screen reader reale, dispositivo touch, matrice browser, zoom/forced colors completo o revisione normativa. Non implementati widget con roving tabindex, focus di route, trap personalizzate, drag accessibile, animazioni di layout, Web Animations/View Transitions o cambi di preferenza durante un'uscita. Niente backend i18n, persistenza, SSR/hydration, UI RTL completa, Trans/ICU, copertura di tutti i plurali/locale/fusi o test di traduzione linguistica. Il caso IME e sintetico; Intl usa i dati linguistici del runtime. Suite JavaScript non rieseguita; QA Quartz separata.

## React: Performance e Internals, Primo Blocco

`react-performance-internals.test.mjs` estrae esempi e configurazione dalle note Virtual DOM, Fiber Architecture e Concurrent Mode, Batching e React Compiler. Usa la stessa toolchain temporanea esterna delle suite precedenti; non installare queste dipendenze nella cartella Quartz:

```powershell
npm install --prefix "$env:TEMP/appunti-react-tools" --save-exact --ignore-scripts --no-audit --no-fund babel-plugin-react-compiler@1.0.0 @rolldown/plugin-babel@0.2.4 @babel/core@7.29.0
```

Imposta `REACT_TOOLCHAIN_PATH` e `PLAYWRIGHT_MODULE_PATH` come nelle sezioni precedenti, poi esegui la regressione completa:

```powershell
node --test --test-concurrency=1 _Meta/tests/react-fondamenti.test.mjs _Meta/tests/react-stato-rendering.test.mjs _Meta/tests/react-toolchain-styling.test.mjs _Meta/tests/react-hooks-stato.test.mjs _Meta/tests/react-context-store-derived.test.mjs _Meta/tests/react-routing-query-validation.test.mjs _Meta/tests/react-component-patterns.test.mjs _Meta/tests/react-ux-accessibilita.test.mjs _Meta/tests/react-performance-internals.test.mjs
```

Risultato del 2026-10-15: **359 test React superati**, 328 precedenti e **31 nuovi**. Nove prove Node/toolchain (quattro gruppi di sola sintassi, due controlli AST/modalita del Compiler, due render statici e una trasformazione Vite) e 22 prove Chrome, 11 per ambiente. React/React DOM 19.3.0, Node 24.14.0, Vite 8.3.4, plugin-react 6.1.2 e Chrome 155.0.8059.79. NODE_ENV esplicito, Strict Mode e build di produzione con il config estratto dalla nota.

- Identita: nodo DOM del contatore preservato, bozze associate agli ID dopo riordino, reset per key, props nuove e perdita dello stato dopo rimozione/rimontaggio.
- Transition: input aggiornato e risultato finale coerente, filtro case-insensitive/trim, nessun risultato e reset. Non misura interruzioni effettive, frame rate o latenza sotto carico.
- Batching: sostituzioni, updater e loro ordine, snapshot dell'handler; probe dedicati Promise/timer senza commit intermedi incoerenti. Nessun conteggio fisso delle chiamate al render.
- flushSync: ref disponibile subito dopo il commit, focus e ripristino, bozza scartata alla chiusura.
- Compiler: AST con cache nelle funzioni annotate e opt-out rispettato; infer distinto da annotation. Il catalogo viene eseguito sia compilato sia con opt-out intenzionale come baseline. Verificati filtro, totale, toggle e bootstrap reale in sviluppo e produzione. Il render statico confronta anche input congelati e testo escapato.
- Corrette assunzioni della fixture, non il codice delle note: node_modules locale con junction per singolo pacchetto per la cache Vite su Windows; helper generati distinti dalle funzioni esportate nell'AST; attesa di un nodo vuoto con stato attached anziche visible. Le junction vengono scollegate prima di eliminare la sola directory temporanea verificata.

Nessun benchmark, prova di tutte le lanes interne, audit completo di accessibilita, hydration/RSC, gating runtime o compilazione di librerie pubblicate. Nessuna configurazione ESLint nuova eseguita; dipendenze React 17/18 descritte ma non provate. La verifica funzionale non dimostra un guadagno prestazionale. Server/browser chiusi e fixture rimossa; suite JavaScript non rieseguita.

## React: Virtualizzazione e Suspense

`react-virtual-suspense.test.mjs` estrae JSX e CSS dalle note Virtualizzazione delle liste e Suspense e Lazy Loading, usando il progetto base di Introduzione e Toolchain. Aggiungi alla toolchain temporanea esterna, non a Quartz:

```powershell
npm install --prefix "$env:TEMP/appunti-react-tools" --save-exact --ignore-scripts --no-audit --no-fund @tanstack/react-virtual@3.14.20
```

Con `REACT_TOOLCHAIN_PATH` e `PLAYWRIGHT_MODULE_PATH` impostati come sopra, esegui la regressione completa:

```powershell
node --test --test-concurrency=1 _Meta/tests/react-fondamenti.test.mjs _Meta/tests/react-stato-rendering.test.mjs _Meta/tests/react-toolchain-styling.test.mjs _Meta/tests/react-hooks-stato.test.mjs _Meta/tests/react-context-store-derived.test.mjs _Meta/tests/react-routing-query-validation.test.mjs _Meta/tests/react-component-patterns.test.mjs _Meta/tests/react-ux-accessibilita.test.mjs _Meta/tests/react-performance-internals.test.mjs _Meta/tests/react-virtual-suspense.test.mjs
```

Risultato del 2026-10-15: **388 test React superati**, 359 precedenti e **29 nuovi**. Cinque prove Node/toolchain (due gruppi di sola sintassi, markup statico, comportamento del boundary e manifest/chunk Vite) e 24 Chrome, 12 development e 12 production. React/React DOM 19.3.0, TanStack React Virtual 3.14.20, Vite 8.3.4, plugin-react 6.1.2, Node 24.14.0 e Chrome 155.0.8059.79. NODE_ENV esplicito, Strict Mode e build reale.

- Lista fissa: 5.000 record, meno di 50 righe montate, altezza/spazio totale coerenti, Inizio/Fine, rimozione delle righe lontane e PageDown senza perdere il focus della regione. ID e contenuto coerenti dopo riordino, riduzione da fondo lista, svuotamento e ripristino.
- Lista misurata: testi di altezze differenti, resize a 390 px, scorrimento fino all'ultimo record e assenza di sovrapposizioni fra le righe montate. Non e un benchmark o una prova di tutti i possibili cambiamenti del contenuto.
- Probe controllati: lazy risolto/rifiutato, loader invocato una volta, stato locale perso dopo unmount, reset effettivo del boundary senza nuovo loader. Boundary annidati e attesa gestita in effect distinta da Suspense.
- Progetto reale: chunk dinamica presente nel manifest, non precaricata dall'HTML; nessuna richiesta del pannello prima dell'apertura. Chiusura e riapertura conservano il titolo nel parent ma scartano la bozza del pannello.
- Import ritardato con intercettazione Playwright: fallback e controlli disponibili, chiusura senza annullare il caricamento e riapertura sulla stessa importazione. Errore di valutazione del modulo simulato con risposta JavaScript HTTP 200: il boundary isola l'errore, la riapertura non lo risolve e il reload esplicito recupera dopo aver rimosso il guasto, perdendo lo stato non persistito.
- Quattro scansioni axe su stati selezionati senza violazioni rilevate, oltre alle dodici ripetute dalla suite UX. Errori console/pagina/HTTP inattesi fanno fallire le prove; solo il messaggio del modulo intenzionalmente guasto e ammesso nei due casi dedicati.

Limiti: niente screen reader reale, certificazione di accessibilita, matrice browser, benchmark, righe interattive, griglie, immagini/font che cambiano altezza o caricamento infinito remoto. Non collaudati stale deploy reali, CDN, tutti gli errori di rete/cache, retry automatici, SSR streaming, hydration, RSC o fetch Suspense di framework. I render statici non certificano SSR. Server/browser chiusi e fixture temporanee rimosse dopo verifica dei percorsi e scollegamento delle junction. Nessuna modifica alle dipendenze Quartz; suite JavaScript non rieseguita. QA del sito separata.

## React: Server Components, SSR e SSG

`react-server-rendering.test.mjs` estrae il progetto Next dalla nota Server Components e le varianti da SSR e SSG. Usa la toolchain temporanea esterna, senza modificare Quartz:

```powershell
npm install --prefix "$env:TEMP/appunti-react-tools" --save-exact --ignore-scripts --no-audit --no-fund next@16.4.1 server-only@0.0.1
```

Con `REACT_TOOLCHAIN_PATH` e `PLAYWRIGHT_MODULE_PATH` impostati come sopra:

```powershell
node --test --test-concurrency=1 _Meta/tests/react-server-rendering.test.mjs
```

Per includere tutte le suite React presenti:

```powershell
$tests = (Get-ChildItem -LiteralPath '_Meta/tests' -Filter 'react-*.test.mjs').FullName
node --test --test-concurrency=1 $tests
```

Risultato del 2026-10-15: **410 test React superati** nella regressione completa, 388 precedenti e **22 nuovi**: sei Node/API (due gruppi di sola sintassi), sei build/HTTP e dieci Chrome. Next 16.4.1, dipendenze React/React DOM 19.3.0, Node 24.14.0 e Chrome 155.0.8059.79. Tre build Webpack: progetto server, export statico e variante volutamente errata. Il server di produzione usa realmente la CLI `next start`; l'export e servito da HTTP Node senza runtime Next.

- Catalogo: campi pubblici espliciti, copie indipendenti, prezzo e interpolazione testuale. Il guard server-only e neutralizzato soltanto nel test unitario della funzione, poi verificato realmente con la build negativa: import dal modulo client rifiutato e diagnostica Webpack acquisita tramite un plugin della sola fixture negativa.
- Confini: manifest con catalogo prerenderizzato e route live/stream non statiche. HTML e bundle client non contengono i due marcatori interni del demo; non e una ricerca esaustiva di segreti o un audit della serializzazione.
- SSR: richieste di documento con ID distinti e Cache-Control privata/no-store. Click del pannello senza navigazione, ID e timestamp invariati dopo hydration. Il test legge l'HTML con parse5, senza assumere come viene serializzato il valore dell'attributo data.
- Streaming: HTTP loopback non compresso, shell/fallback in chunk precedenti al dettaglio; browser con dettaglio finale e fallback rimosso. Verifica ordine, non un tempo massimo di risposta o paint.
- SSG: HTML generato e servito identico senza runtime Next; catalogo leggibile senza JavaScript. In entrambe le distribuzioni i pulsanti funzionano dopo hydration, ID ARIA indipendenti, tastiera, reload e viewport mobile senza overflow. Due scansioni axe su stati selezionati senza violazioni rilevate.
- API React in probe separati: renderToString/static markup non aspettano la Promise sospesa; prerenderToNodeStream attende. Hydration compatibile conserva il nodo DOM, quella con mismatch intenzionale segnala onRecoverableError e ricrea l'albero. Questi probe non sostituiscono il protocollo RSC di Next.
- Prima esecuzione: 19/22 prove superate; corretti tre controlli del banco di prova che assumevano stringhe di log/attributi. La seconda esecuzione ha superato tutti i test senza modifiche al codice applicativo. I log CLI vengono raccolti fino alla chiusura degli stream del processo.

Limiti: nessuna prova Next in sviluppo/Turbopack, Server Functions/mutazioni, database, sessioni, autorizzazioni, ISR, CDN, CSP, annullamento di query, basePath o route dinamiche esportate. Non eseguito il comando Python del promemoria: l'export e verificato tramite server statico Node. Niente benchmark, screen reader reale, matrice browser o certificazione di accessibilita. Gli errori browser inattesi falliscono la suite; il mismatch intenzionale usa la callback dedicata. Processi/server/browser chiusi, fixture eliminate dopo verifica dei percorsi e scollegamento delle junction. Gli avvisi Next su cache di build assente e lockfile in una directory superiore non vengono interpretati come errori del demo. QA Quartz e suite JavaScript separate.

## React: Actions e useActionState

Suite `_Meta/tests/react-actions-state.test.mjs`, aggiunta il 2026-10-16. Usa la toolchain esterna e Playwright gia descritti: nessuna nuova dipendenza nel sito.

```powershell
node --test --test-concurrency=1 _Meta/tests/react-actions-state.test.mjs
```

**34 nuovi test superati**, confermati nella regressione di **444 test React**: 13 Node/toolchain (inclusi due gruppi di sola sintassi), 11 Chrome development e 10 production. React/React DOM 19.3.0 e Chrome 155.0.8059.80; i bundle sono generati con esbuild, con NODE_ENV esplicito e Strict Mode. Componenti e funzioni estratti dai Markdown, non copie riscritte per il banco di prova.

- Validazione di alias mancanti, vuoti, non conformi e File; normalizzazione, stato precedente congelato, contatore dei tentativi, conferma e rifiuto previsto. Eseguiti anche i servizi didattici con il loro ritardo locale; eccezione inattesa propagata.
- Form action diretta: dati del pulsante submit, raccolta prima della disabilitazione, pending, reset, invio successivo ed errore intercettato dal boundary. `required` blocca il vuoto, mentre un errore applicativo restituito normalmente non impedisce il reset.
- useActionState: bozza controllata conservata, conferma normalizzata, errore successivo senza perdere l'ultima conferma, readOnly e bottoni disabilitati durante attesa. Svuota bozza non resetta il risultato dell'hook; invio da tastiera e viewport mobile.
- Probe React dichiarati: reset degli uncontrolled al default anche con `{ error }`, override formAction del pulsante, initialState diverso senza reset e remount tramite key. Coda sequenziale con tre dispatch; rigetto del primo cancella gli altri. Dispatch async fuori Action provato solo in sviluppo, con avviso atteso e pending non attivato.
- Sei scansioni axe su stati selezionati senza violazioni rilevate; non sono una certificazione di accessibilita. Errori console/pagina/HTTP inattesi fanno fallire i test. Le eccezioni intenzionali usano onCaughtError; il solo test negativo ammette l'avviso di contesto Action assente.

Limiti: non vengono eseguiti Server Functions, permalink, progressive enhancement, un servizio HTTP di mutazione o un database. I callback differiti sono fixture controllate; il demo di alias non registra utenti. Nessuna prova di concorrenza fra utenti, idempotenza, autorizzazioni o annullamento server. Nessuna matrice browser o screen reader reale. Server/browser chiusi e fixture rimossa dopo verifica del percorso temporaneo; QA Quartz e controlli strutturali restano separati.

## React: useOptimistic e useFormStatus

Suite `_Meta/tests/react-optimistic-form-status.test.mjs`, aggiunta il 2026-10-16; richiede soltanto la toolchain esterna e Playwright gia descritti.

```powershell
node --test --test-concurrency=1 _Meta/tests/react-optimistic-form-status.test.mjs
```

**39 nuovi test superati**, confermati nella regressione di **483 test React**: otto Node/toolchain (due gruppi di sola sintassi), 16 Chrome development e 15 production. React/React DOM 19.3.0, Chrome 155.0.8059.80; bundle esbuild con NODE_ENV esplicito, non minificati per poter verificare i nomi delle action nei probe. Strict Mode attivo. Nessuna nuova dipendenza.

- Funzioni estratte dalle note: reducer e merge su record/array congelati, deduplicazione per id/requestId, conferme esterne, FormData con null/File, risposta con correlazione errata e selezione dei campi. Servizi locali eseguiti con il ritardo originale; rifiuto tipizzato e normalizzazione degli spazi.
- Commenti: previsione visibile prima della risoluzione, stato pending, nodo DOM conservato per key, testo canonico, bozza mantenuta e reset esplicito. Rifiuto seguito da retry, base aggiornata durante l'attesa senza perdere dati; conferma esterna non duplicata e non annullata da un successivo rifiuto. Il probe senza onConfirm dimostra che il solo successo del servizio non aggiorna la base.
- Form: due istanze con ID, bozze ed esiti separati, pending locale, payload raccolto prima della normalizzazione, invio Enter, validazione senza chiamata al servizio e ultimo risultato conservato. Rigetti inattesi e risposte incoerenti raggiungono un boundary della fixture.
- Probe React separati dai demo: lettura nello stesso componente o all'esterno non osserva il form discendente; un pulsante esterno con attributo form invia, ma non trasferisce il contesto al fratello. onSubmit async da solo non attiva il pending. FormData resta lo snapshot dell'invio mentre cambia un input non controllato; dopo il completamento data/method/action sono null.
- Nel client provato, method e get per una function action senza prop method; action identifica anche la funzione scelta tramite formAction. Il test verifica metadati locali, non una richiesta HTTP GET/POST. Setter ottimistico fuori Action controllato con avviso intenzionale solo in sviluppo.
- Quattro scansioni axe su stati selezionati senza violazioni rilevate, non una certificazione di accessibilita. Viewport mobile senza overflow nei due demo. Errori pagina/HTTP/console inattesi falliscono la suite; rigetti intenzionali gestiti tramite onCaughtError.

Limiti: niente Server Functions, database, persistenza, mutazioni HTTP, autorizzazioni, idempotenza, retry di rete, offline o concorrenza fra utenti. I callback differiti e la conferma esterna sono fixture dichiarate; non vengono misurati tempi di rendering o riprodotti tutti gli ordinamenti possibili. Nessuna matrice browser o screen reader reale. Processi HTTP/browser chiusi e fixture rimossa dopo verifica del percorso temporaneo; QA Quartz separata.

## React: use e Framework Mode

Suite `_Meta/tests/react-use-framework.test.mjs`, aggiunta il 2026-10-16. Usa codice estratto da use hook e Framework Next.js e Remix, non copie manuali dei demo. Alla toolchain temporanea esterna sono stati aggiunti @react-router/dev e @react-router/serve 8.4.0; servono anche @react-router/node 8.4.0 e isbot 5.2.2, presenti nelle dipendenze risolte. Pacchetti e lockfile di Quartz non modificati.

Per predisporre questi pacchetti in una toolchain esterna gia configurata:

```powershell
npm --prefix "$env:REACT_TOOLCHAIN_PATH" install --save-exact @react-router/dev@8.4.0 @react-router/serve@8.4.0 @react-router/node@8.4.0 isbot@5.2.2
```

Poi esegui la suite:

```powershell
node --test --test-concurrency=1 _Meta/tests/react-use-framework.test.mjs
```

**27 test superati**, confermati nella regressione completa di **510 test React**: sette Node/toolchain (due di sola sintassi), sette Chrome development, sette production e sei di integrazione Framework Mode. Node 24.14.0, React/React DOM 19.3.0, React Router 8.4.0, Vite 8.3.4 e Chrome 155.0.8059.80. Bundle client Strict Mode con NODE_ENV esplicito; quello production e minificato. Il progetto router viene realmente compilato e servito in produzione su loopback.

- Promise: attesa/risultato/rigetto, identita conservata al re-render, nuovo caricamento dopo errore, risultato tardivo ignorato. Servizio locale originale eseguito anche senza mock. Callback differiti separati per controllare l'ordine.
- Context: default, undefined esplicito, provider annidato, lettura condizionale dopo early return, provider nello stesso componente. browser(): fallback SSR e lettura nel client, senza un falso aggiornamento automatico al resize.
- Router: loader con query normalizzata e duplicati/limiti rifiutati, copie pubbliche dei record, build server/client, campo interno assente da asset client e HTML. HTTP 400/404/405 reali e GET filtrato; ricerca, reload e Indietro con e senza JavaScript. Una risposta dati ritardata dalla fixture rende osservabile pending; la navigazione idratata conserva il documento.
- Cinque scansioni axe su stati selezionati e controllo overflow mobile di Context/catalogo, non un audit di accessibilita. Errori console/pagina/HTTP inattesi falliscono le prove browser; rigetti intenzionali catturati con onCaughtError.

Le prime prove hanno rilevato isbot non dichiarato e un selettore di test non corrispondente alla label implicita: dipendenza esplicitata nel demo e label resa esplicita con useId. Il primo collegamento dell'intera node_modules non funzionava con Vite su Windows: ora la fixture collega i singoli pacchetti e scollega le junction prima della rimozione verificata. Una fixture della prova fallita e stata pulita separatamente. La CLI non deve installare pacchetti durante i test.

Limiti: nessuna mutazione, autenticazione, migrazione Remix, RSC del router, cache condivisa, database o deploy remoto. Il confronto Next riusa gli esempi gia coperti dalla suite server-rendering. Il catalogo SSR e un server reale locale, non un backend persistente. Nessun benchmark, screen reader o matrice browser; QA Quartz separata. L'audit della toolchain esterna segnala un avviso low preesistente su @babel/core 7.29.0 (GHSA-4x5r-pxfx-6jf8); non applicato aggiornamento forzato o modifica ai pin dei demo precedenti.

## React: concorrenza e risorse

Suite `_Meta/tests/react-concurrency-resources.test.mjs`, aggiunta il 2026-10-18. Estrae i moduli JSX da useTransition e useDeferredValue e Gestione della memoria e AbortController. Usa la toolchain esterna gia configurata, senza nuove dipendenze o modifiche ai package/lockfile del sito.

```powershell
node --test --test-concurrency=1 _Meta/tests/react-concurrency-resources.test.mjs
```

**24 test superati**, confermati nella regressione completa di **534 test React**: otto Node/toolchain (due di sola sintassi), otto Chrome development e otto production. React/React DOM 19.3.0, Node 24.14.0, Chrome 155.0.8059.80 ed esbuild 0.27.3. Bundle in memoria con NODE_ENV esplicito e Strict Mode; production minificato. Server HTTP su loopback e porte assegnate dal sistema, chiuso con il browser al termine.

- Demo originali: ricerca indipendente, filtro puro con trim/case, reset, risultato vuoto e limite di righe; label SSR distinte. Profilo locale realmente eseguito, schema/ID/proiezione, errore, cancel e reload; SSR senza effect o lettura di window.
- Probe API separati: callback startTransition sincrona, pending con Suspense e aggiornamento urgente; input nuovo con risultato differito precedente e scarto di una risoluzione superata. Le Promise controllate rendono osservabile l'attesa, senza introdurre busy loop o affermazioni sulla latenza.
- Loader iniettati: risposta fuori ordine ignorata anche senza supporto abort, cleanup allo smontaggio, timeout cooperativo, retry con controller nuovo e risultato scartato dopo cancel. I test controllano gli effetti osservabili, non il rilascio fisico della memoria.
- fetchProfile originale contro endpoint HTTP locale di fixture: ID codificato, 404/500, JSON/schema errati e abort dopo header ma prima del completamento del corpo. Non e il backend di un'applicazione reale.
- Listener resize e timer tracciati separatamente: un solo listener attivo dopo il setup Strict Mode, nessuno dopo cleanup e timer cancellato. Quattro scansioni axe e controllo overflow mobile sui due demo, non un audit di accessibilita completo.
- Errori inattesi console/pagina/HTTP fanno fallire le prove; solo 404/500 intenzionali e l'abort del caso HTTP hanno eccezioni esplicite. Nessuna installazione, junction o fixture su disco aggiuntiva.

Limiti: nessun benchmark, heap snapshot, misura GC, browser multipli o screen reader reale. Non provati WebSocket, observer, cache condivise, autenticazione, mutazioni remote, idempotenza, rollback server o cancellazione universale delle Promise. La suite non dimostra un numero fisso di render, una deadline o un tempo massimo dell'input. QA Quartz separata.

## React: XSS e autenticazione

Suite `_Meta/tests/react-xss-auth.test.mjs`, aggiunta il 2026-10-18. Estrae i moduli completi dalle note Protezione XSS e Gestione Autenticazione. Alla toolchain esterna React e stato aggiunto solo DOMPurify 3.4.17; pacchetti e lockfile di Quartz non modificati. La toolchain JavaScript separata conserva il proprio pin precedente.

```powershell
npm --prefix "$env:REACT_TOOLCHAIN_PATH" install --save-exact --ignore-scripts dompurify@3.4.17
```

```powershell
node --test --test-concurrency=1 _Meta/tests/react-xss-auth.test.mjs
```

**36 test superati**, confermati nella regressione completa di **570 test React**: dieci Node/toolchain (due di sola sintassi), tredici Chrome development e tredici production. React/React DOM 19.3.0, Node 24.14.0, DOMPurify 3.4.17 e Chrome 155.0.8059.80. Bundle esbuild in memoria con Strict Mode e NODE_ENV esplicito; production minificato.

- XSS: testo escaped, limiti UTF-16, URL con origine/protocollo/credenziali controllati; sanitizzazione reale di otto payload con eventi, script, immagini, SVG, MathML, iframe, form, attributi esclusi e markup malformato. Verificato il DOM risultante senza CSP che mascheri errori. Rich text SSR rifiutato senza un DOM supportato, non restituito grezzo.
- Sessione: schema e proiezione, SSR iniziale senza effetto, guardia del Context, 401 distinto da 403/500 e JSON/schema invalidi. Nome utente contenente markup reso come testo. Endpoint HTTP locale con cookie HttpOnly non leggibile da document.cookie ma inviato da Fetch; POST logout con token CSRF, rifiuto del token errato e scadenza del cookie.
- Errori e concorrenza: logout fallito resta non confermato, dati privati nascosti, retry esplicito; letture obsolete, smontaggio, cambio utente e bozza precedente scartata. Doppio logout e lettura durante revoca non duplicano l'operazione. API controllate separate per ordinare le risposte; nessun falso backend di produzione.
- Sei scansioni axe su stati selezionati e controllo overflow mobile. Errori inattesi console/pagina/HTTP e richieste esterne fanno fallire le prove; solo gli status intenzionali dichiarati sono ammessi. Server, contesti e browser chiusi al termine; nessuna fixture su disco o junction aggiuntiva.

Limiti: la fixture usa HTTP loopback e un cookie di test, non collauda HTTPS, Secure, prefisso __Host-, isolamento SameSite cross-site o un login reale. Non implementa credenziali, crittografia, OIDC/PKCE, refresh, MFA, autorizzazione per risorsa, cache multiutente o difese CSRF complete. Nessun audit di sicurezza, prova di tutti i bypass XSS, matrice browser o screen reader. SSR del rich text e Trusted Types sono limiti dichiarati, non integrazioni implementate. QA Quartz separata.

Audit della toolchain esterna: rimane un low preesistente su @babel/core 7.29.0 (GHSA-4x5r-pxfx-6jf8), nessun avviso aggiuntivo su DOMPurify; nessun aggiornamento forzato dei pin precedenti.

## React: CSRF e CSP

Suite `_Meta/tests/react-csrf-csp.test.mjs`, aggiunta il 2026-10-18. Usa React/React DOM 19.3.0, esbuild 0.27.3, axe-core e Playwright della toolchain esterna gia descritta; non aggiunge dipendenze al sito.

```powershell
node --test --test-concurrency=1 _Meta/tests/react-csrf-csp.test.mjs
```

**31 test superati**, confermati nella regressione completa di **601 test React**: otto Node/HTTP e 23 browser, senza prove saltate o fallite. Chrome 155.0.8059.80; regressione seriale in circa 216 secondi, completata prima della build Quartz.

Il codice viene estratto da CSRF e Content Security Policy. I test coprono:

- Validazione client, render SSR senza mutazioni, nonce casuali distinti e coerenti con l'HTML, direttive senza concessioni unsafe. Un test controlla soltanto la sintassi dei quattro moduli.
- Form React in development/production con Strict Mode: cookie HttpOnly, header e JSON, successo 204, 401/403/500, conservazione della bozza, doppio submit e unmount. L'abort client non annulla la scrittura della fixture gia in corso. Due scansioni axe su stati selezionati e viewport mobile, non un audit completo.
- Backend didattico su loopback: rifiuto di token assente, errato o associato a un'altra sessione, origine assente/null/diversa, sessione assente, Content-Type e schema errati. Non e un middleware di produzione e non implementa gestione completa delle sessioni, TLS, limiti del body o autorizzazioni per record.
- Due origini su porte diverse dello stesso host: form same-site cross-origin con cookie inviato senza preflight, ma metodo rifiutato; PUT/JSON/header soggetto a preflight, rifiutato senza mutazione. Non e una matrice cross-site/SameSite/third-party-cookie.
- CSP reale via HTTP: contatore interattivo, CSS esterno, nonce corretto; script inline, nonce errato e script esterno senza nonce bloccati. Solo report-only permette il controesempio e genera un evento di violazione. Baseline self e listener React provati separatamente.
- Server estratto dalla nota eseguito su porta effimera: HTML, MIME, 404/405 e 500 per asset mancante. readFile e sostituito da un archivio in memoria dei bundle compilati: non e una prova del filesystem o del comando npm install. La build usa le opzioni esbuild del comando documentato, senza override NODE_ENV.

La verifica CORS deve usare un contesto senza routing Playwright, neppure per favicon: nelle prime due prove l'intercettazione impediva di osservare OPTIONS. Rimosso il routing nel solo contesto CORS, il preflight nativo e verificabile. Le violazioni CSP/CORS intenzionali sono ammesse solo nei test negativi dedicati; errori browser/HTTP inattesi e richieste esterne fanno fallire le prove.

Limiti: rete fallita simulata; redirect error verificato come opzione del client, non con una catena reale. Niente login, HMAC double-submit, rotazione token, proxy, refresh, CDN/cache, reporting remoto, Trusted Types, CSS-in-JS, worker, lazy chunk, CSP Next/SSR streaming o matrice browser. Non e un audit di sicurezza. Server/browser chiusi; nessuna fixture su disco o nuova junction. Controlli del vault e QA Quartz separati.

## React: Jest, Playwright Test e Cypress

Suite `_Meta/tests/react-testing-runners.test.mjs`, aggiunta il 2026-10-18. Estrae i file dalle note Testing Jest e Testing Cypress e Playwright e li esegue in un progetto temporaneo. Nessun pacchetto o lockfile del sito viene modificato.

**23 test superati**, confermati nella regressione seriale completa di **624 test React** in circa 243 secondi, senza fallimenti o test saltati. Node 24.14.0 e Chrome 155.0.8059.80; i risultati interni di Jest, Playwright e Cypress sono controllati dai rispettivi gruppi, non sommati nuovamente al totale.

Richiede una toolchain **separata** da quella React precedente; il percorso predefinito e appunti-react-testing-tools sotto la directory temporanea. Puoi impostarlo esplicitamente:

```powershell
$env:REACT_TESTING_TOOLCHAIN_PATH = Join-Path $env:TEMP 'appunti-react-testing-tools'
```

Installa i pacchetti del demo, senza aggiornare la toolchain degli altri blocchi:

```powershell
npm --prefix "$env:REACT_TESTING_TOOLCHAIN_PATH" install --save-exact react@19.3.0 react-dom@19.3.0 vite@8.3.4 @vitejs/plugin-react@6.1.2 jest@30.5.2 jest-environment-jsdom@30.5.2 babel-jest@30.5.2 @babel/core@7.29.7 @babel/preset-env@7.29.7 @babel/preset-react@7.29.7 @testing-library/react@16.3.3 @testing-library/dom@10.4.2 @testing-library/jest-dom@7.0.1 @testing-library/user-event@14.6.8 @playwright/test@1.62.1 cypress@16.2.0
```

Servono Chrome installato e il binario Cypress. Se manca quest'ultimo:

```powershell
node "$env:REACT_TESTING_TOOLCHAIN_PATH/node_modules/cypress/bin/cypress" install
```

Avvio della suite:

```powershell
node --test --test-concurrency=1 _Meta/tests/react-testing-runners.test.mjs
```

- Controlli Node di sintassi, pin, normalizzazione/UTF-16 e render SSR. Adapter con fetch iniettato: status HTTP, Content-Type, JSON/schema, normalizzazione del body, credenziali omesse e guasto rete. Una prova e di sola sintassi.
- Jest esegue **7 test originali** con jsdom, Babel, Testing Library, user-event e coverage; sono verificati payload, pending, singolo invio, errori, bozza e retry esplicito. Errore del servizio distinto da campo invalido. Nessun avviso act ignorato.
- Prova negativa controllata: nella sola fixture si rimuove il rifiuto del nome vuoto. Jest deve uscire con codice 1, due test falliti e nessun errore di caricamento; poi il sorgente originale viene ripristinato. E una verifica di efficacia mirata, non un mutation score complessivo.
- Build Vite reale prima dei test browser. Playwright Test CLI esegue **3 test** con il webServer originale della nota; Cypress Module API esegue gli stessi **3 casi** della propria spec in Chrome, con anteprima Vite esterna. Le porte sono effimere tramite TEST_PORT, le risposte API sono simulate e non esiste persistenza backend.
- I report dei runner sono analizzati come JSON, inclusi test saltati, falliti e flaky. I sette test Jest e i sei test browser sono verifiche interne ai gruppi della suite Node: non vanno sommati una seconda volta al conteggio dei gruppi della regressione.
- Fixture con collegamenti ai singoli pacchetti esterni; processi/server chiusi, junction scollegate e directory temporanea eliminata solo dopo verifica del percorso. Nessuna modifica al workflow remoto o all'anteprima Quartz.

Audit della nuova toolchain: 19 segnalazioni moderate nella catena Jest/Istanbul dovute all'advisory transitivo sprintf-js [GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c); nessuna high/critical. Non applicato il downgrade automatico suggerito a Jest/babel-jest 25. I test usano sorgenti/configurazioni controllati. Questo risultato non modifica l'audit della vecchia toolchain React, che non e stata aggiornata.

Limiti: niente Vitest, MSW, ESM nativo Jest, TypeScript, fake timer, component runner Cypress, login/storageState/cy.session, database, browser diversi da Chrome, screen reader o audit completo. Coverage non equivale a correttezza. La prova negativa modifica soltanto la copia temporanea e l'adapter usa risposte simulate. Test delle note, verifica strutturale e QA del sito sono attivita distinte.

## React: test di accessibilita, ESLint e Prettier

Suite `_Meta/tests/react-accessibility-lint.test.mjs`, aggiunta il 2026-10-18. Estrae note e configurazioni dal vault, crea due progetti temporanei distinti e li elimina al termine dopo aver scollegato le junction. Nessun pacchetto del sito viene modificato.

Richiede la toolchain runner del blocco precedente, Chrome installato e una nuova toolchain qualita separata:

```powershell
$env:REACT_QUALITY_TOOLCHAIN_PATH = Join-Path $env:TEMP 'appunti-react-quality-tools'
```

```powershell
npm --prefix "$env:REACT_QUALITY_TOOLCHAIN_PATH" install --save-exact eslint@10.13.0 @eslint/js@10.0.1 globals@17.13.0 eslint-plugin-react-hooks@7.1.1 eslint-config-prettier@10.1.8 prettier@3.9.10 @axe-core/playwright@4.14.0 playwright-core@1.62.1
```

```powershell
node --test --test-concurrency=1 _Meta/tests/react-accessibility-lint.test.mjs
```

**26 test superati** nell'esecuzione mirata, confermati nella regressione seriale di **650 test React** in circa 263 secondi, senza fallimenti o test saltati. Node 24.14.0 e Chrome 155.0.8059.80; il pacchetto @playwright/test viene dalla toolchain runner precedente e playwright-core esplicito allinea il peer di axe al runner 1.62.1.

- Una prova di sola sintassi; pin verificati e render SSR iniziale del TitleCounter, senza eseguirne gli effect.
- ESLint CLI reale sul progetto positivo, incluso JSX importato, configurazioni e dist esclusa. print-config verifica regole Hooks, disattivazione delle regole stilistiche e globali effettivi.
- Casi negativi per hook condizionale, dipendenza mancante, mutazione props, render impuro, JSX non definito, variabile inutilizzata, coercizione e globali fuori ambiente. Casi positivi browser/Node ESM/CommonJS/Jest e soppressione ormai inutile.
- La stessa warning exhaustive-deps produce exit code 0 senza soglia e 1 con max-warnings 0. Prettier check non scrive, write modifica soltanto la fixture, gli output ignorati restano intatti; formattare il controesempio non elimina la diagnostica Hooks.
- Build Vite reale del demo con i componenti WAI-ARIA/Portals e Playwright Test CLI: **quattro test originali**, navigazione tastiera, descrizione dell'errore, stato locale e dialog. Cinque allegati axe analizzati: nessuna violazione o risultato incomplete nei cinque stati selezionati. I quattro casi sono interni al gruppo Node, non aggiunti nuovamente al totale.
- Prova negativa nella copia temporanea: rimosso lang da index.html, ricompilato il demo e rieseguita la scansione iniziale. Richiesti exit code 1 e violazione html-has-lang; poi ripristinato il sorgente. Non cambia la nota o il sito.

Audit della sola nuova toolchain: **zero advisory** al 2026-10-18. Nessun force/legacy-peer-deps: i plugin eslint-plugin-react 7.37.5 e jsx-a11y 6.10.2 non sono installati perche non dichiarano ESLint 10. Il preset Hooks non abilita la trasformazione React Compiler. Gli advisory delle altre toolchain restano separati e non sono risolti da questo risultato.

Limiti: browser Chrome, demo statico locale senza backend; nessun screen reader, prova manuale di zoom/reflow o certificazione WCAG. Nessun test TypeScript, preset Next, editor, pre-commit hook, plugin JSX aggiuntivo o CI remota. Il TitleCounter viene analizzato dal linter e renderizzato sul server, non collaudato qui per il ciclo di vita nel browser. Le suite precedenti restano indipendenti.

## React: Storybook e confronti visuali

`react-storybook-visual.test.mjs` estrae componente, CSS, storie, configurazioni e test dalle due note. Usa una toolchain temporanea separata: non installa Storybook nelle dipendenze di Quartz e non modifica le toolchain precedenti.

```powershell
$env:REACT_STORYBOOK_TOOLCHAIN_PATH = Join-Path $env:TEMP 'appunti-react-storybook-tools'
```

```powershell
npm --prefix "$env:REACT_STORYBOOK_TOOLCHAIN_PATH" install --save-exact storybook@10.6.2 @storybook/react-vite@10.6.2 @storybook/addon-docs@10.6.2 @storybook/addon-vitest@10.6.2 vitest@5.0.5 @vitest/browser-playwright@5.0.5 react@19.3.0 react-dom@19.3.0 vite@8.3.4 @vitejs/plugin-react@6.1.2 @playwright/test@1.62.1 playwright@1.62.1 http-server@14.1.1
```

```powershell
node --test --test-concurrency=1 _Meta/tests/react-storybook-visual.test.mjs
```

**9 test superati** nell'esecuzione mirata in circa 45 secondi, Node 24.14.0 e Chrome installato tramite channel chrome. Il runner pinna anche playwright direttamente: il peer del provider Vitest altrimenti puo risolvere una versione diversa da @playwright/test. Audit della nuova toolchain: zero advisory al 2026-10-19; nessuna correzione forzata o modifica alle segnalazioni delle altre toolchain.

- Un gruppo di sola sintassi e controllo delle versioni effettive.
- Vitest Browser Mode esegue le cinque storie originali; Activated controlla il callback, Disabled la mancata attivazione. Una prova negativa rimuove il callback soltanto nella fixture e richiede un fallimento specifico su Activated, con le altre quattro storie verdi.
- Build Storybook reale, verifica degli ID in index.json, pagina Docs, manager e iframe. La configurazione 10.6.2 usa le annotazioni automatiche dell'addon, senza il setup legacy setProjectAnnotations.
- Playwright Test reale su tre storie e due viewport: baseline assente fallisce senza crearla; aggiornamento esplicito genera sei PNG con dimensioni corrette; il confronto successivo passa senza riscriverli, verificando gli hash.
- Controllo negativo CSS: ricompilazione con sfondo rosso, fallimento del caso primary desktop e presenza del diff PNG. Baseline invariate; ripristino del CSS, nuova build e confronto verde senza aggiornare immagini.

Le cinque storie e i sei confronti sono casi interni ai gruppi Node, non sommati nuovamente ai nove test. La fixture usa junction per singolo pacchetto: un wrapper della sola configurazione di test autorizza Vite a servire la toolchain esterna. Gli snippet originali restano immutati; in un'installazione normale i pacchetti sono locali e il wrapper non serve. Browser/processi chiusi e junction scollegate prima di rimuovere la directory temporanea dopo controllo del percorso.

Regressione seriale aggiornata al 2026-10-19: **659 test React superati**, 650 precedenti e 9 nuovi, senza fallimenti o test saltati, in circa 355 secondi. Node 24.14.0 e Chrome 155.0.8059.80. Con le quattro toolchain React e PLAYWRIGHT_MODULE_PATH impostati come nelle rispettive sezioni:

```powershell
$tests = (Get-ChildItem -LiteralPath '_Meta/tests' -Filter 'react-*.test.mjs').FullName
node --test --test-concurrency=1 $tests
```

Eseguire la build Quartz dopo i test, non in parallelo con i browser. La suite JavaScript resta separata e non e stata rieseguita in questo blocco.

Limiti: screenshot di esempio generati nella stessa esecuzione, non approvazione umana di baseline di un prodotto. Solo Windows/Chrome, due viewport, tema chiaro e tre stati; mobile non e un dispositivo fisico. Non provati inizializzatore interattivo, addon a11y, servizi visuali remoti, upload del catalogo, CI remota, TypeScript, Next, MSW, decorators applicativi o altri browser. I casi visuali non attendono interazioni che cambiano aspetto: in questo esempio non ce ne sono. Test delle interazioni, confronti pixel e QA del sito Quartz restano verifiche distinte.

## React: design system e confini delle feature

`react-design-architecture.test.mjs` estrae TextField, CSS, model, form e composizione dalle due note; riusa la configurazione della nota Introduzione e Toolchain. Non contiene una seconda implementazione dei componenti e non installa nuove dipendenze nel sito.

Richiede REACT_TOOLCHAIN_PATH, REACT_TESTING_TOOLCHAIN_PATH e PLAYWRIGHT_MODULE_PATH configurati come nelle sezioni precedenti. La toolchain testing fornisce le assertion Playwright; React, Vite e axe provengono dalla toolchain React.

```powershell
node --test --test-concurrency=1 _Meta/tests/react-design-architecture.test.mjs
```

**35 test mirati superati**: 17 gruppi Node, inclusi due di sola sintassi e due di solo render SSR, e 18 casi browser. Node 24.14.0, React 19.3.0, Vite 8.3.4 e Chrome 155.0.8059.80.

- Policy locale: tipo, trim, vuoto, limite UTF-16 e testo HTML non sanitizzato implicitamente. TextField: label, descrizioni presenti/assenti, required ed escaping nel markup SSR.
- Build Vite reale; grafo degli import ricavato dal metafile esbuild. Due mutazioni nella sola fixture mostrano che un deep import e una dipendenza shared -> feature compilano, ma violano la convenzione scelta. I file temporanei vengono ripristinati dopo ciascuna prova.
- Development e production: istanze indipendenti, ID stabili/univoci, errore, ref/focus, correzione, Enter, nessuna persistenza al reload, cambio tema senza perdere la bozza e focus visibile con Tab.
- Quattro scansioni axe sullo stato di errore, nei due temi e nelle due modalita: zero violazioni e zero risultati incomplete nell'esecuzione registrata. La suite fallisce sulle violazioni e stampa gli incomplete per il triage.
- Un consumer di prova importa il TextField originale e controlla required nativo, name/FormData, disabled escluso da invio e Tab, messaggi lunghi a 320px. Il demo di produzione viene verificato a 320, 390 e 1440px in entrambi i temi, senza overflow del documento.

Il controllo del grafo e intenzionalmente limitato ai tre livelli e alla sola feature del demo: non e un linter generale per alias, cicli, import dinamici o molteplici API pubbliche. Nessun backend, package pubblicato, React 18, hydration, framework router, screen reader o certificazione WCAG. Le prove automatiche di tema e geometria non sono approvazione visuale di un prodotto; il QA delle pagine Quartz resta separato. Dipendenze esistenti riutilizzate senza aggiornamenti; nessun nuovo audit npm in questo blocco.

Regressione seriale aggiornata al 2026-10-19: **694 test React superati**, 659 precedenti e 35 nuovi, nessun fallimento o test saltato, in circa 358 secondi. Eseguito il comando complessivo della sezione precedente, con tutte le toolchain configurate, prima di avviare la build Quartz. Suite JavaScript non rieseguita.

## React: stato colocato e API layer

`react-colocation-api.test.mjs` estrae esempi, CSS e adapter dalle note State colocato e API layer. Riusa la toolchain introduttiva e il ProfilePanel della nota su AbortController, senza duplicare il componente o installare nuove dipendenze nel sito.

Richiede REACT_TOOLCHAIN_PATH, REACT_TESTING_TOOLCHAIN_PATH e PLAYWRIGHT_MODULE_PATH come nelle sezioni precedenti. Il runner testing fornisce le assertion, la toolchain React fornisce React/Vite/axe.

```powershell
node --test --test-concurrency=1 _Meta/tests/react-colocation-api.test.mjs
```

**60 casi**: 42 gruppi Node, inclusi due di sola sintassi e uno di render SSR, e 18 casi browser. La prima esecuzione mirata aveva 59 casi verdi; aggiunto poi un caso di abort prima degli header e ampliato il controllo del successo inatteso per rifiutare 204 quando si attende JSON.

- Filtro puro, dati immutati, markup SSR e ID; due build Vite reali per catalogo e client API. Development/production: istanze indipendenti, stato condiviso dai fratelli, dettaglio locale, hidden contro unmount, reset per key, focus e tastiera.
- Il consumer di prova importa Catalog e verifica che una nuova initialQuery non sovrascriva la bozza, mentre una key diversa la resetta. Produzione a 320/390/1440px senza overflow; due scansioni axe sul catalogo filtrato, zero violazioni e zero incomplete nell'esecuzione registrata. Gli incomplete sono stampati per triage, non ignorati come prova di conformita.
- HTTP: Headers in tre forme, copia senza mutazione, Accept/Content-Type, credenziali omesse, redirect rifiutati, POST 201, DELETE 204 senza parsing, errori HTTP/protocollo/body/rete, DTO proiettati e ID coerenti. Input, JSON non serializzabile e signal gia annullato non inviano richieste.
- Server temporaneo su loopback: Fetch reale per elenco/dettaglio/creazione/eliminazione e abort prima degli header o mentre response.json sta consumando il corpo. Il test del corpo verifica bodyUsed prima di annullare e controlla l'identita del motivo personalizzato.
- UI con API intercettata: cambio ID, mapping, 404, retry esplicito, testo HTML non interpretato e risposta appartenente a un altro ID rifiutata. La queryFn opzionale viene eseguita direttamente per verificare signal e chiave; non e un nuovo test dell'intero ciclo di vita TanStack Query.

Node 24.14.0, React 19.3.0, Vite 8.3.4 e Chrome 155.0.8059.80. Nessun backend di produzione, credenziale o dato reale usato; le scritture avvengono solo nella fixture locale senza persistenza. Browser, server e junction vengono chiusi/scollegati prima di rimuovere la directory temporanea, verificata sotto il percorso previsto.

Limiti: non e una libreria HTTP universale o un audit di sicurezza. Non verificati autenticazione, CORS tra origini, retry automatici, idempotenza backend, FormData, stream di download, SSR dell'adapter, client generati, altri browser o CI remota. Nessuna prova con screen reader o certificazione WCAG; nessun benchmark dei render. Le prove di timeout e obsolescenza del ProfilePanel restano nella suite precedente. Nessuna modifica alle dipendenze Quartz o nuovo audit npm.

Regressione seriale conclusiva al 2026-10-19: **754 test React superati**, 694 precedenti e 60 nuovi, senza fallimenti o test saltati, in circa 376 secondi. Usato il comando complessivo con tutte le toolchain configurate, prima della build Quartz; processi e fixture chiusi/rimossi. La suite JavaScript non e stata rieseguita. Le prove riguardano i casi descritti, non certificano ogni esempio delle 59 note React.

## Browser

Il runner risolve `playwright` dal progetto `site`. Se e disponibile in un runtime esterno, imposta `PLAYWRIGHT_MODULE_PATH` al percorso assoluto della sua cartella pacchetto prima di eseguire il comando. `BROWSER_CHANNEL` permette di cambiare il canale; il default verificato e `chrome`. Il server WebSocket di test usa `ws`, gia presente nelle dipendenze del progetto site.

```powershell
node --test _Meta/tests/javascript-browser.test.mjs
```

63 test con nuovi contesti temporanei e HTML degli esempi. Comprendono DOM, eventi, storage, form, template testuali, import su richiesta, date in contesti UTC/Europe-Rome, globali classici/moduli, window.name, rimozione dei callback, campi di classe rispetto ai setter, copie del carrello e stato privato su istanze congelate. Le prove sull'asincronia aggiungono timer/microtask reali, dispatchEvent sincrono, cleanup dei listener, assenza di unhandledrejection dopo errori multipli nel pool e moduli con top-level await. Sono verificati inoltre multipart FormData, Authorization esplicito con credentials omit, signal gia annullati, timeout nativo e composizione con any.

Le prove di Stile e Paradigmi eseguono la shell DOM dei nomi utenti, controllando sostituzione della lista, caso vuoto e inserimento come testo senza HTML. Import ESM reali da URL intercettate verificano la condivisione della configurazione e l'identita distinta quando cambia la query della URL.

Le nuove prove su copie e generatori eseguono transfer reale di ArrayBuffer, rifiuto dei nodi DOM nel clone, deepFreeze con ciclo/getter, helper nativi Iterator e cleanup su break. La paginazione usa Fetch del browser con richieste intercettate: verificate query preservata, fine su items vuoto, nessuna richiesta successiva a break e cancellazione della pagina pendente tramite signal.

Le prove AJAX coprono XHR nativo con HTTP riuscito/fallito, JSON malformato, 204, timeout e abort. La lista viene aggiornata come testo, conserva i dati su errore, impedisce richieste sovrapposte e ignora risultati dopo unmount. L'avanzamento upload usa ProgressEvent sintetici: verifica il componente e il cleanup, non misura un upload reale.

Le richieste verso URL fittizi sono intercettate da Playwright. Quattro test avviano server temporanei su `127.0.0.1` e porte assegnate dal sistema: uno invia header e parte del JSON senza completarlo per provare l'abort del corpo; tre usano WebSocket reali per messaggi, disconnessione/reconnect, budget e vincoli nativi di send/close. Alla fine chiudono contesti, connessioni e server. Nessun servizio esterno, credenziale reale, storage del sito pubblicato o browser personale viene usato.

## Esecuzione complessiva JavaScript

Con Playwright, WABT, DOMPurify, i tool ESLint/Prettier/Vite e la CLI npm 11.19.0 risolvibili come descritto sopra:

```powershell
$tests = (Get-ChildItem -LiteralPath '_Meta/tests' -Filter 'javascript-*.test.mjs').FullName
node --test --test-concurrency=1 $tests
```

Il limite di concorrenza esegue un file per volta e riduce la competizione fra istanze browser. Non avviare la build Quartz contemporaneamente: una precedente esecuzione parallela ha superato il timeout di navigazione della fixture Wasm; la riesecuzione seriale completa, dopo la build e senza cambiare quel test, e passata.

Risultato aggiornato al 2026-10-13: 1483 test superati, di cui 1209 Node.js `24.14.0` e 274 Chrome `155.0.8059.40` (63 della suite browser generale, 18 della suite worker, 20 della suite componenti/scheduling, 12 WebAssembly, 8 memoria, 15 leak/weak, 11 optimization/buffers, 14 proxy/cycles, 24 decorators, 21 security/CORS, 25 CSP/sanitizzazione, 4 Vite, 4 bundling/source map, 12 SPA/REST, 8 SSR e 15 promemoria). La suite completa richiede accesso ai server di fixture su loopback e alle directory temporanee: il sandbox puo bloccarli con ERR_NETWORK_ACCESS_DENIED o EPERM anche quando le prove intercettate funzionano.

## Limiti JavaScript

Le funzioni e i frammenti selezionati sono elencati nei quarantaquattro file di test. Schemi, parti dipendenti da servizi esterni e frammenti non selezionati non sono certificati da questo risultato. Le verifiche API su any, timeout e WebSocket provano anche i comportamenti descritti nel testo, senza essere copie delle funzioni applicative. Non sono provati tutti i bundler, gli ambienti e le versioni browser. Le verifiche sulle date non coprono tutti i cambi d'ora storici; quelle sulle regex non sono benchmark ReDoS e non eseguono input intenzionalmente bloccanti. Le prove sulle closure non misurano tempi di garbage collection o consumo di memoria; la rimozione dei listener verifica il comportamento osservabile, non l'immediato rilascio fisico della memoria. Le prove sull'incapsulamento non costituiscono un audit di autenticazione o riservatezza dei dati.

Le prove su funzioni pure e pattern verificano i contratti dichiarati, non la purezza di qualunque callback o oggetto con getter/Proxy. Non certificano ordinamenti linguistici identici tra runtime, precisione contabile, conformita completa degli indirizzi email o un sistema di messaggistica distribuito. Il Subject sincrono non gestisce callback async o una coda persistente.

Il deepFreeze e limitato a dati ordinari nello stesso realm, senza Proxy; non e un contenitore sicuro per codice ostile. Le prove di clonazione non coprono tutti i tipi host o tutte le politiche di isolamento cross-origin; SharedArrayBuffer e verificato in Node, non certificato per ogni sito. La paginazione non collauda un backend reale, snapshot consistenti, retry, carico o consumo massimo di memoria. Queste prove riguardano copie e generatori; i test dei worker sono separati.

Le prove sull'Event Loop verificano ordine e separazione dei task, non latenza, frequenza dei frame, paint o throttling in background. Il controesempio di busy wait non viene eseguito. I timeout non sono deadline garantite: i test non misurano durate esatte, rate limit o carico. L'abort e provato prima della risposta e durante il corpo, ma non certifica l'annullamento di effetti sul server. Rete simulata, server locale di test e schema dimostrativo non sono un collaudo del backend. Non vengono provate tutte le politiche CORS, SameSite, cookie di terze parti, cache, redirect e retry. Per WebSocket non sono verificati TLS, autenticazione, heartbeat, replay, ACK applicativi, reti ostili o backpressure sotto carico: restano requisiti di un sistema reale, non funzionalita implicite del client dimostrativo.

I test dei Web Workers non sono benchmark di parallelismo, latenza, CPU, memoria o prestazioni del rendering. Messageerror e generato sinteticamente per provare il cleanup, non provocato tramite una deserializzazione nativa fallita. Non sono collaudati SharedWorker, pool, OffscreenCanvas, SharedArrayBuffer tra thread, CSP/Trusted Types o matrice di browser. Le strategie runtime sono verificate con Cache Storage/Fetch simulati; precache, controllo dei client, offline e update conservativo sono verificati anche nel browser reale.

Push e skipWaiting/claim opzionali sono provati con mock delle API; non costituiscono una verifica di permessi, consegna push o aggiornamento forzato nativo. Background Sync resta uno schema architetturale. Del manifest viene verificata la sintassi JSON, non l'installazione su un dispositivo, le icone reali o la promozione del browser. Quota, eviction e sicurezza dei dati richiedono prove aggiuntive nell'app di destinazione. I test non installano worker nel sito Quartz o nel profilo personale.

I test dei componenti non sono un audit completo di accessibilita, compatibilita framework, form-associated elements, Declarative Shadow DOM, adozione fra documenti o scoped registries. Tastiera, focus, stato e semantica del pulsante dimostrativo non certificano tutti gli screen reader. Le prove di scheduling verificano contratti e risultati, non scadenze, priorita sotto carico, frame effettivamente dipinti o throttling delle schede nascoste. Il polling non contatta un backend reale.

I test Wasm non sono benchmark e non collaudano Rust/C/C++, binding generati, WASI, Wasm GC, memory64, buffer ridimensionabili, SIMD o thread condivisi. La compilazione WAT usa WABT; il comando del server Python e riportato come prerequisito del demo, non e il server usato dalle fixture. Le prove CORS/rete non sono una matrice completa di distribuzione. L'abort dopo compilazione e simulato per verificare lo scarto del risultato, non per misurare o interrompere la compilazione nativa.

I test sulla memoria verificano effetti osservabili del cleanup e contratti delle API, non il rilascio fisico di oggetti, buffer o pagine del processo. Non forzano il GC, non attendono callback di finalizzazione e non sono un profiler o un benchmark di leak. Il ramo WeakRef senza target e una simulazione dichiarata; non prova che il collector abbia eliminato uno specifico oggetto. Il ticker richiede una callback sincrona, il widget un pulsante dello stesso realm e un record ordinario con id stringa.

I test leak/weak non dimostrano assenza universale di leak ne rilascio degli ephemeron. La LRU limita il numero di voci, non i byte, e non implementa TTL o cleanup dei valori. Il grafo ha record ordinari finiti e stabili, senza getter o Proxy ostili; la visita deduplica identita, non rileva distintamente i cicli. Il fallback di inserimento riguarda soltanto la factory sincrona del demo e non e un polyfill generale. Le richieste restano locali/intercettate: nessun backend reale, benchmark o matrice di browser.

I test optimization/buffers non sono benchmark, profili JIT o misure di GC. Il debounce e sincrono, senza maxWait/leading/flush; il throttle scarta il trailing. Il parser didattico accetta byte dello stesso realm su memoria ordinaria fissa, non un flusso da ricomporre o un formato standard. Non collauda limiti di download, autenticazione, cifratura, file di terzi, Float16 su ogni runtime o sincronizzazione tra thread. La verifica SharedArrayBuffer nel browser riguarda soltanto una fixture isolata controllata, non la configurazione del sito pubblicato.

I test proxy/cycles non sono un audit di sandboxing, un motore reattivo o un benchmark di trap. Il record age ha schema limitato, non valida oggetti arbitrari. Non coprono tutte le invarianti di ogni trap, tutti gli oggetti host o proxy cross-realm. I cicli sono provati nei loader nativi: non sono verificati bundler, HMR, lint, alias di progetto o interop ESM/CommonJS. La composizione dei permessi e un esempio architetturale, non un sistema di autorizzazione completo. L'osservazione browser di una Promise pendente e limitata nel tempo; il test Node verifica distintamente l'uscita 13 del caso senza altre risorse attive.

La verifica di contenuti, trasformazione e HTML resta separata:

```powershell
npm --prefix site run content:check -- --report
```

```powershell
npm --prefix site run content:test
```

```powershell
npm --prefix site run site:build
```
