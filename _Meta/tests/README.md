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

## Esecuzione complessiva

Con Playwright, WABT, DOMPurify, i tool ESLint/Prettier/Vite e la CLI npm 11.19.0 risolvibili come descritto sopra:

```powershell
$tests = (Get-ChildItem -LiteralPath '_Meta/tests' -Filter 'javascript-*.test.mjs').FullName
node --test --test-concurrency=1 $tests
```

Il limite di concorrenza esegue un file per volta e riduce la competizione fra istanze browser. Non avviare la build Quartz contemporaneamente: una precedente esecuzione parallela ha superato il timeout di navigazione della fixture Wasm; la riesecuzione seriale completa, dopo la build e senza cambiare quel test, e passata.

Risultato aggiornato al 2026-10-13: 1483 test superati, di cui 1209 Node.js `24.14.0` e 274 Chrome `155.0.8059.40` (63 della suite browser generale, 18 della suite worker, 20 della suite componenti/scheduling, 12 WebAssembly, 8 memoria, 15 leak/weak, 11 optimization/buffers, 14 proxy/cycles, 24 decorators, 21 security/CORS, 25 CSP/sanitizzazione, 4 Vite, 4 bundling/source map, 12 SPA/REST, 8 SSR e 15 promemoria). La suite completa richiede accesso ai server di fixture su loopback e alle directory temporanee: il sandbox puo bloccarli con ERR_NETWORK_ACCESS_DENIED o EPERM anche quando le prove intercettate funzionano.

## Limiti

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
