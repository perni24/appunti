# Storico recente

Questo file contiene un riepilogo operativo delle modifiche importanti al vault.

Non e uno storico completo: serve solo per aiutare l'utente o un modello LLM a riprendere il contesto tra una sessione e l'altra.

Mantieni solo le ultime 10 voci operative.

---

## 2026-10-22 - TypeScript: revisione dei capitoli avanzati

### Fatto

- Completata la revisione tecnica delle **83 note TypeScript uniche su 83**: ultimo blocco Pattern e Architettura, cinque pagine. Declaration Merging e contato una sola volta.
- Capitoli precedenti: utility, type system, interoperabilita, validazione, framework e qualita. Esempi, fonti e risultati dettagliati conservati in [[_Meta/Revisione contenuti|Revisione dei contenuti]].
- Repository: corretto find-then-insert come falsa garanzia di unicita; conflitti, copie, I/O e limiti della memoria espliciti. DTO: parser e proiezione runtime distinti dai tipi statici.
- Dominio: quantita e transizioni verificabili al posto di una debole validazione email. DI: clock, mailer, composition root, errori e durata delle risorse. Clean architecture: progetto ESM completo e controllo della direzione degli import, inclusi type-only.
- Nuova suite da **38 gruppi**, tutti superati al primo giro. Regressione mirata: **108 test superati**, 38 Architettura + 31 Moduli + 39 Qualita, circa 149 secondi; nessun fallimento o test saltato.
- Baseline TypeScript 5.9.3 e Node 24.14.0. Nessuna nuova dipendenza in questo blocco; helper condivisi invariati. Fixture temporanee ripulite dopo verifica dei percorsi.
- content:check: **911 documenti raggiungibili, zero errori e 469 avvisi editoriali**, nessuno nel percorso TypeScript. Nove test della trasformazione superati.
- Build Quartz riuscita: **3.719 file, 2.003 HTML, 168 redirect e 137.555 riferimenti verificati, zero errori**. Solo avvisi preesistenti del generatore.
- QA delle cinque pagine desktop/mobile riuscita dopo la correzione del selettore di un titolo tipografico: 20 blocchi scorrevoli su mobile, sei screenshot ispezionati, nessun errore o overflow del documento. Browser QA chiusi; anteprima esistente lasciata attiva.

### Decisioni

- Conservati date, percorsi, type, publish e status non revisionato; riparato un prerequisito YAML. Nessuna nota aggiunta o spostata, nessun indice o redirect modificato.
- Il completamento riguarda le pagine esistenti, non tutti gli argomenti/versioni TypeScript. Revisione del modello e approvazione dell'utente restano distinte.
- Test in memoria e progetto dimostrativo, non collaudo di database, SMTP, pagamenti o transazioni distribuite. Non rieseguite le altre suite TypeScript o quelle complete React/JavaScript.
- Nessun commit o push. Voce odierna consolidata mantenendo dieci voci operative.

### Prossimi passi

- Proseguire con **Python: Fondamenti del Linguaggio**, partendo da Comandi base e toolchain. Nessuna modifica alle note Python in questa sessione.

## 2026-10-21 - TypeScript: tipi avanzati, moduli e configurazione

### Fatto

- Revisionate le nove note di Tipi Avanzati e le sette di Moduli e Configurazione: **41 note TypeScript su 83** in questa passata. Integrati esempi osservabili, limiti e fonti ufficiali; i 34 blocchi del primo capitolo e i progetti del secondo sono verificati sulla baseline 5.9.3.
- Chiariti distribuzione, never/any/unknown, unwrap singolo rispetto ad Awaited, readonly/optional nei mapped types, chiavi statiche rispetto a Object.keys e accessi a elementi potenzialmente assenti.
- Approfonditi infer con overload e tuple readonly, ricorsione e limiti del modello JSON, concat e partial application. Il wrapper non registra piu gli argomenti; riparato un prerequisito YAML spezzato.
- Moduli: configurazioni complete Node/bundler, ESM/CommonJS separati, estensioni runtime, alias non riscritti, export map e package imports. References domain/api coerenti, cache e output vecchi espliciti; chiariti flag strict e source map con stack verificato. Riparato un prerequisito YAML.
- Suite da 66 test per Tipi Avanzati e da 31 per Moduli entrambe riuscite al primo tentativo. Ultima regressione seriale delle sei suite: **332 test TypeScript superati**, zero fallimenti o test saltati, circa 460 secondi. Baseline TypeScript 5.9.3, Node 24.14.0, esbuild 0.27.3.
- content:check: **911 documenti raggiungibili, zero errori e 507 avvisi editoriali**; nessuno sulle sette note piu recenti. Nove test della trasformazione superati, metadati e dieci voci dello storico verificati.
- Build finale del blocco Moduli riuscita: **3.719 file, 2.003 HTML, 168 redirect, 137.013 riferimenti verificati e zero errori**. QA ripetuta delle sette pagine desktop/mobile senza overflow o errori pagina/console/HTTP; 19 blocchi di codice e una tabella scorrevoli su mobile.
- Sette screenshot ispezionati; convertita la tabella strict in elenco per leggibilita mobile, senza modificare gli esempi. Rigenerazione e QA finale riuscite; risultati precedenti di Tipi Avanzati conservati nel registro dettagliato.
- Anteprima locale su http://localhost:8082/appunti/ riutilizzata e lasciata attiva; browser QA chiusi, scheda personale dell'utente non modificata.

### Decisioni

- Percorsi, date, pubblicabilita e status non revisionato conservati. Nessuna nota aggiunta o spostata, nessun indice o redirect da modificare.
- Nessun aggiornamento delle dipendenze e nessun commit o push. Test limitati al percorso TypeScript, senza rieseguire le suite React/JavaScript.

### Prossimi passi

- Proseguire con **Utility e Pattern di Tipo**. Restano 42 note TypeScript; la revisione tecnica non sostituisce l'approvazione dell'utente.

## 2026-10-20 - TypeScript: percorso base e narrowing

### Fatto

- Avviata la revisione TypeScript dopo il push della revisione React: **25 note su 83**, percorso base e capitolo Narrowing e Controllo dei Tipi. Fonti ufficiali aggiunte, esempi e limiti chiariti.
- Distinti controllo statico, emissione ed esecuzione; corrette ambiguita su strict, primitive, inferenza, optional, any/unknown/never, union/intersection e contratti strutturali.
- Sostituito l'esempio di creazione utente simulata con un calcolo locale verificabile; aggiunti parser con proiezione e controesempi sui campi non rimossi da un'interfaccia.
- Corretti il type guard che verificava solo la presenza dei campi e il lookup che poteva restituire proprieta ereditate. Approfonditi void, optional/default, readonly/tuple, enum, asserzioni, overload e index signatures; anteprima email distinta dall'invio.
- Approfonditi classi, this, ordine dei campi, private/#private, readonly, abstract, implements e generics. Factory Password sostituita con titoli locali; falso SMTP sostituito con test double; repository in memoria e controesempi dei limiti del checker.
- Approfonditi narrowing, guardie, union, esaustivita, predicate nei due rami e assertion. Corretti quattro collegamenti YAML; assertNever non serializza piu payload arbitrari; espliciti limiti di truthiness, alias, filtri, catch e async.
- **235 test TypeScript superati**, 173 precedenti e 62 nuovi, in circa 149 secondi: checker reale, errori attesi, runtime, CLI e DOM nel browser. Supporto comune riusato; baseline 5.9.3, Node 24.14.0; nessuna dipendenza nuova.
- content:check: **911 documenti raggiungibili, zero errori e 522 avvisi editoriali**. Nessun avviso sulle sei note appena revisionate; nove test della trasformazione superati.
- Build Quartz riuscita: **3.719 file, 2.003 HTML, 168 redirect e 136.859 riferimenti verificati, zero errori**. Invariati gli avvisi preesistenti del generatore.
- QA delle sei pagine su desktop e mobile riuscita: quattro screenshot ispezionati, 25 blocchi di codice scorrevoli su mobile, nessun errore pagina/console/HTTP o overflow del documento. Anteprima esistente lasciata attiva; risultati delle passate precedenti conservati nel registro.

### Decisioni

- Conservati percorsi, date, pubblicabilita e status non revisionato. Nessun indice o redirect da aggiornare, perche non sono state aggiunte o spostate note.
- Test mirati al blocco, non riesecuzione delle suite React/JavaScript. Nessun commit o push TypeScript.

### Prossimi passi

- Proseguire con **Tipi Avanzati**. Restano 58 note TypeScript in questa passata; approvazione dell'utente separata dalla revisione tecnica.

## 2026-10-19 - React: revisione delle 59 note conclusa

### Fatto

- Revisionate Storybook, Visual regression testing, Design system, Feature-based architecture, State colocato e API layer: **59 note React su 59** esaminate. Conclusa la revisione tecnica delle pagine attuali, non una certificazione universale di React. Esempi, fonti e collegamenti aggiornati.
- Nuova suite con **9 test mirati superati**: cinque storie in Vitest Browser Mode, build Storybook, sei confronti Playwright, baseline assente e due controlli negativi per callback/CSS. Le baseline non vengono riscritte nel confronto ordinario.
- Altri **35 test mirati superati** per design system e architettura: TextField condiviso, due form locali, temi, focus, quattro scansioni axe e controlli del grafo con import volutamente errati nella sola fixture. Distinti contratto UI e policy del prodotto.
- Altri **60 test** per stato colocato e API layer, superati nella regressione: proprietario/durata, hidden/unmount/key, client HTTP con schema e mapping, 204, errori e abort reale prima degli header/durante il corpo. ProfilePanel riusato, non duplicato; backend di produzione non incluso.
- Regressione seriale completa aggiornata: **754 test React superati**, nessun fallimento o test saltato, in circa 376 secondi. Node 24.14.0 e Chrome 155.0.8059.80; processi e fixture temporanee chiusi/rimossi.
- content:check: **911 documenti raggiungibili, zero errori e 546 avvisi editoriali**, nessuno nell'area React; nove test della trasformazione superati. Registro e README aggiornati.
- Ultima build Quartz riuscita: **3.719 file, 2.003 HTML, 168 redirect e 136.554 riferimenti verificati, zero errori**. Sei screenshot delle ultime due note ispezionati su desktop/mobile; sei blocchi di codice e due tabelle larghe scorrono internamente, senza errori browser o overflow del documento. Anteprima esistente su http://localhost:8082/appunti/ lasciata attiva.

### Decisioni

- Toolchain temporanea isolata per Storybook: Storybook 10.6.2, Vitest 5.0.5 e Playwright 1.62.1; audit senza advisory. Il blocco design/architettura riusa toolchain esistenti senza nuove installazioni o audit. Dipendenze Quartz invariate.
- Distinti build, interazioni, screenshot, accessibilita e approvazione umana delle immagini. Test limitati a Windows/Chrome e viewport desktop/mobile, non CI remota o dispositivi reali.
- Convenzione app -> features -> shared esplicita, non obbligo React o adozione completa di FSD. Il controllo del grafo e limitato al demo, non un linter generale; form in memoria senza backend o persistenza.
- Stato scelto anche per durata, non solo numero di consumatori. Client JSON deliberatamente limitato: trasporto distinto da dominio/cache/UI, credenziali omesse e nessun retry implicito. Le scritture nei test usano solo fixture senza dati reali.
- Date e percorsi conservati; status non revisionato fino all'approvazione dell'utente. Nessun commit, push o deploy remoto.

### Prossimi passi

- Proseguire la revisione degli altri percorsi di Programmazione. Le 59 note React restano non revisionate dall'utente finche non approvate; nuove API o versioni richiedono verifiche separate.

## 2026-10-18 - React: concorrenza, sicurezza e testing

### Fatto

- Revisionate useTransition e useDeferredValue, Gestione della memoria e AbortController, Protezione XSS, Gestione Autenticazione, CSRF, Content Security Policy, Testing Jest, Testing Cypress e Playwright, Test di accessibilita e Linting e Formattazione: **53 note React su 59**. Distinti scheduling, cancellazione, leak, sicurezza, test e controlli statici.
- Ricerca con filtro nel figlio memoizzato; profilo completo con cancel, timeout, retry, guardie e controllo HTTP/JSON/schema. Esempio distinto per listener e timer, con cleanup verificabile.
- Sanitizer DOMPurify con policy minima e URL controllate; client sessione completo con stati distinti, logout confermato solo dal server, retry e rimozione della bozza al cambio identita. Non sono implementati login reale, OIDC o sicurezza backend completa.
- CSRF: contratto server esplicito, form con endpoint fisso e token, errori senza retry automatico. CSP: baseline statica e demo React CSR con nonce per risposta, CSS esterno e server Node limitato; distinti report-only, enforcement e integrazioni framework.
- Testing: configurazioni eseguibili, form condiviso, adapter HTTP e casi di validazione/successo/errore. Eseguiti sette test Jest, tre Playwright e tre Cypress; prova negativa mirata verifica che Jest rilevi la validazione rimossa. API browser simulate, non backend completo.
- Accessibilita: riusati disclosure, form e dialog esistenti, quattro test Playwright e cinque report axe. Linting: configurazione ESLint 10/Hooks/Prettier completa, globali scoped, ignore e controesempi. Tastiera e scansioni automatiche restano distinte dai controlli manuali non eseguiti.
- Cinque nuove suite con **140 test superati** (24 concorrenza, 36 XSS/autenticazione, 31 CSRF/CSP, 23 runner e 26 accessibilita/lint), inclusi bundle, HTTP locale, cleanup, CSP e controlli statici. Regressione completa: **650 test React superati**; i casi interni dei runner non sono contati due volte. Diciassette scansioni axe positive introdotte su stati selezionati, non un audit completo.
- content:check: **911 documenti raggiungibili, zero errori, 552 avvisi editoriali**; nove test della trasformazione superati. Registro e README aggiornati; storico mantenuto a dieci voci operative.
- Ultima build Quartz riuscita: **3.719 file, 2.003 HTML, 168 redirect e 136.390 riferimenti verificati, zero errori**. Ultime due note controllate su desktop/mobile e altri sei screenshot ispezionati: 14 blocchi di codice e una tabella larghi scorrono su mobile, senza overflow del documento o errori browser/HTTP.
- Anteprima riavviata nel primo blocco dopo la rigenerazione di index.html, poi riutilizzata su http://localhost:8082/appunti/ (PID 30336). Browser e server dei test chiusi; anteprima lasciata disponibile. HTML generati non modificati manualmente.

### Decisioni

- Fonti ufficiali e moduli eseguibili; DOMPurify 3.4.17 nella toolchain temporanea React, con il low Babel preesistente. Nuova toolchain isolata per i runner: 19 segnalazioni moderate transitive sprintf-js, nessuna high/critical; nessun downgrade automatico. Dipendenze Quartz e toolchain JavaScript invariate. Test distinti da benchmark e audit completi.
- Toolchain qualita separata con audit npm senza advisory. ESLint 10 con plugin Hooks compatibile; nessun force/legacy-peer-deps o downgrade a ESLint 9 fuori manutenzione per aggiungere plugin JSX non compatibili. La baseline non equivale a tutti i controlli React/TypeScript.
- Data, percorsi e pubblicabilita conservati; note non revisionate fino al controllo dell'utente. Nessun commit, push o deploy remoto.

### Prossimi passi

- Rimangono **6 note React**: proseguire con Storybook e Visual regression testing, poi le quattro note di Architettura Frontend.

## 2026-10-16 - React: Actions, risorse e framework

### Fatto

- Revisionate Actions e form actions, useActionState, useOptimistic, useFormStatus, use hook e Framework Next.js e Remix: React arriva a **43 note su 59**. Esempi completi di trasformazione locale, alias con bozza controllata e contatore in coda; distinti dati, pending, reset, errore e conferma.
- Corretti firme e contesto Action, differenze client/server e limiti di permalink. Il reset automatico non interpreta un errore applicativo restituito; la bozza va conservata intenzionalmente.
- Aggiunti commenti ottimistici con rebase e conferma nel parent, correlazione requestId e rifiuto tipizzato; due form con scope e dati indipendenti. Precisati ripristino della base diverso dal rollback server e metadati del form diversi da una misura della rete.
- use: Promise stabile, Context condizionale, retry/boundary e variante browser(). Framework: distinti Remix v2, nuovo Remix e React Router, con catalogo SSR completo e form GET funzionante senza JavaScript; rimandi agli esempi Next gia verificati.
- **510 test React superati**, inclusi 100 nuovi nei tre blocchi della giornata (34, 39 e 27). Quindici scansioni axe introdotte su stati selezionati, senza pretesa di audit completo. Ultima suite: build SSR reale, status HTTP, navigazione idratata e proiezione pubblica dei dati.
- content:check: **911 documenti raggiungibili, zero errori, 561 avvisi editoriali**; superati i nove test della trasformazione. Rapporto, registro e README dei test aggiornati.
- Nessuna nuova dipendenza del sito. Aggiunti dev/serve React Router nella toolchain esterna; isbot dichiarato nel demo. Audit esterno con un low preesistente su Babel, senza aggiornamenti forzati. Fixture/junction e processi di test ripuliti; suite JavaScript non rieseguita.
- Build Quartz riuscita: **3.719 file, 2.003 HTML, 168 redirect e 136.087 riferimenti verificati, zero errori**. Ultime due note controllate su desktop/mobile e sei screenshot finali ispezionati; dieci blocchi di codice mobile scorribili e due tabelle entro il viewport, nessun overflow del documento.
- Anteprima esistente riutilizzata su http://localhost:8082/appunti/. Browser QA chiusi; HTML generati non modificati manualmente. Storico mantenuto a dieci voci operative.

### Decisioni

- Demo client con servizi locali espliciti, non finte registrazioni riuscite; catalogo Framework Mode con server SSR reale di sola lettura. Server Functions, persistenza e sicurezza backend non sono collaudati da questi test.
- Date e pubblicabilita conservate; note ancora non revisionate fino al controllo dell'utente. Nessun commit, push o deploy remoto.

### Prossimi passi

- Rimangono **16 note React**: proseguire con useTransition e useDeferredValue e Gestione della memoria e AbortController.

## 2026-10-15 - React: stato, UX e rendering

### Fatto

- Revisionate 32 note fra Stato e Rendering, Toolchain Base, Hooks e Stato, Routing/Data Fetching/Form, Component Patterns, UX/Accessibilita, Performance/Internals e primo blocco server-side. Insieme ai cinque fondamenti del 14 ottobre, React arriva a **37 note su 59**. Dettagli e risultati intermedi in Revisione contenuti.
- Corretti snapshot/updater, cleanup e race condition, form e ref; metriche del Profiler, scope CSS, temi e responsive; memoizzazione, reducer e custom hook. Esempi completi con import, contratti, fonti ufficiali e metadati conservati.
- Completate Context API, State Management Esterno e Derived state: fallback e provider annidati, store Zustand/Redux con selector e reset, durata distinta dalla persistenza, valori derivati e bozze con politiche esplicite.
- Completate React Router, Data Fetching e Cache e Validazione Dati: modalita/versioni del router e hosting, cache e rollback con riconciliazione, parsing Zod e form accessibili. Contratti e limiti dei demo espliciti; nessun backend reale incluso.
- Completate Compound Components Pattern, Control Props e State Reducer Pattern, Portals ed Error Boundaries: accordion completo, contratti controlled/reducer/render prop, dialog nativo, propagazione eventi, limiti e recupero degli errori.
- Completate WAI-ARIA, Focus Management, Animazioni e Micro-interazioni e Internazionalizzazione: esempi completi, nomi/relazioni, focus dopo commit, reduced motion, plurali/fallback e locale distinto da valuta/fuso.
- Completate Virtual DOM, Fiber Architecture e Concurrent Mode, Batching e React Compiler: identita/riordino, scheduling, snapshot/coda e flushSync; configurazione Vite 8/plugin-react 6 con Compiler realmente eseguito e baseline non compilata.
- Completate Virtualizzazione delle liste e Suspense e Lazy Loading: esempi completi TanStack Virtual, misure e stato/focus; code splitting con import reale, fallback, error boundary e distinzione fra cache del codice e stato del pannello.
- Completate Server Components e SSR e SSG: progetto Next reale, confini degli import/JSX e dati pubblici, rendering per richiesta, streaming, export statico e mismatch. Corretti benefici automatici e hydration implicita, chiudendo la segnalazione precedente.
- Regressione finale: **410 test React superati**, inclusi 22 nuovi su API React, build/HTTP Next ed export, Chrome e hydration. Due nuove scansioni axe e sedici ripetute dai blocchi precedenti, non equivalenti a un audit completo. Dettagli e limiti nel registro.
- Dipendenze degli esempi solo nella toolchain temporanea esterna; aggiunti Next 16.4.1 e server-only 0.0.1. Nessuna modifica a package/lockfile Quartz; processi/server/browser degli esempi chiusi e fixture rimosse. Suite JavaScript non rieseguita.
- content:check: **911 documenti raggiungibili, zero errori, 563 avvisi editoriali**. Superati i nove test della trasformazione; README, rapporto e registro aggiornati.
- Build finale riuscita: **3.719 file, 2.003 HTML, 168 redirect e 135.941 riferimenti verificati, zero errori**. Nessuna modifica manuale agli HTML generati.
- Ultime due note controllate in quattro viste desktop/mobile e sei screenshot ispezionati: nessun errore di caricamento o overflow del documento. Dieci blocchi di codice larghi su mobile, tutti scorribili; entrambe le tabelle entro il viewport. Anteprima trovata spenta e riavviata in background senza finestra su http://localhost:8082/appunti/; browser QA chiuso.

### Decisioni

- Testare il codice estratto dalle note; distinguere Fetch reale da mock differiti e autenticazione simulata da un backend reale.
- Le note restano non revisionate fino al controllo dell'utente. Nessun commit, push o deploy remoto.

### Prossimi passi

- Rimangono **22 note React**: proseguire con Actions e form actions e useActionState nel blocco React Moderno e Server-Side. Suspense e gia revisionata; i richiami alla stessa nota nell'indice non vanno ricontati.
- Il punto aperto su SSR e SSG e risolto; non estendere le prove del catalogo pubblico a sessioni, mutazioni o deploy di produzione.

## 2026-10-14 - Fondamenta React

### Fatto

- Lette integralmente e corrette le cinque note iniziali: Introduzione e Toolchain, JSX, Componenti Funzionali vs Componenti a Classe, Props e Flusso di dati unidirezionale, Rendering Condizionale e Liste.
- Aggiunto un progetto Vite completo e riproducibile; distinti React, renderer, JSX e strumenti di controllo. Comandi separati, import espliciti, esempi client senza backend.
- Corretti parita funzione/classe, inizializzazione e identita dello stato, props condivise, input controllati, children, key e bozze dopo riordino. Fonti ufficiali nelle note, date originarie e stato non revisionato conservati.
- Superati 33 nuovi test: 19 Node (cinque gruppi di sola sintassi) e 14 Chrome. Verificati build reale, interazioni e variante negativa con key indice. React 19.3.0, Vite 8.3.4, plugin React 6.1.2, Node 24.14.0 e Chrome 155.0.8059.79.
- Toolchain installata soltanto in una directory temporanea esterna; nessun aggiornamento delle dipendenze di Quartz. Fixture, server e browser di test chiusi. Non rieseguita la suite JavaScript precedente.
- Superati i nove test della trasformazione e content:check: 911 documenti raggiungibili, zero errori, 592 avvisi editoriali. Aggiornati registro della revisione, rapporto e README dei test.
- Build Quartz ripetuta dopo il miglioramento della tabella mobile: 2.003 HTML e 135.401 riferimenti verificati, zero errori. Anteprima riavviata sulla porta 8082; nessuna modifica agli HTML generati.
- Verificate tutte le cinque pagine su desktop/mobile, con codice scorrevole, due tabelle e screenshot ispezionati. Nessun overflow del documento, errore JavaScript o caricamento HTTP fallito.

### Decisioni

- Proseguire React per blocchi dell'indice, senza estendere le prove dei fondamenti a framework, SSR/RSC, effect o sicurezza.
- Esempi estratti dai Markdown nei test; render statico usato per controllare markup, non presentato come implementazione SSR.
- Le note restano non revisionate fino all'approvazione dell'utente. Nessun nuovo commit, push o deploy remoto.

### Prossimi passi

- Revisionare Stato e Rendering: useState, useEffect, useRef e Gestione Moduli (form/eventi e controlled/uncontrolled).
- Rimangono 54 note React per questa passata; conservare il punto gia segnalato su SSR e SSG per il relativo blocco.

## 2026-10-13 - Revisione contenuti JavaScript

### Fatto

- Dal 14 settembre al 13 ottobre lette e corrette tutte le 87 note JavaScript: tutte le 26 del Percorso Base, tutte le 23 del Percorso Intermedio, Web Workers, Service Workers e PWA, Web Components, Scheduling Browser, WebAssembly interop, Memory Lifecycle, Garbage Collection, Memory Leaks, WeakMap e WeakSet, Optimization, Buffer e Typed Arrays, Proxy e Reflect, Circular Dependencies, Decorators, Sicurezza, CORS, Content Security Policy, Sanitizzazione input, Supply chain security npm e Real-time con WebSocket; completato Node.js Runtime con Node.js Basics, File System fs, Path e Process, Events Node.js, Streams Node.js, Buffer Node.js, HTTP server, Child process e Worker threads; completato Tooling e Qualita con Testing, ESLint, Prettier, Vite, Bundling e tree shaking e Source maps e debugging. Completata Applicazioni Frontend e Backend anche con SPA e routing lato client, API REST e Server-side rendering. Fonti primarie e contratti espliciti degli esempi.
- Risolti controlli di input troppo permissivi, esempi con dipendenze implicite e spiegazioni incomplete su scope, asincronia e gestione degli errori.
- Corretti il fallback GET del form con password, i rifiuti asincroni non gestiti, le assunzioni sullo storage e gli esempi di rendering/delegazione/navigazione.
- Corretti this/arguments delle arrow, default e destructuring, copie superficiali e selezione dei campi pubblici; approfonditi moduli browser/Node, live binding e import su richiesta con attesa/errori.
- Corretti copie/riferimenti condivisi, chiavi proprie ed ereditate, array sparsi, Map/Set, parsing distinto da schema JSON, date/fusi/durate e regex; controllati gli esempi di calendario in piu timezone.
- Corretti scope globale/modulo, TDZ e import, cattura dei binding, receiver/this e prototype delle funzioni/istanze. Migliorati esempi di sessione e formattazione, rimozione dei listener e contatori con input controllati.
- Corretti campi di classe/setter, super e inizializzazione, privacy e riferimenti condivisi, static privati ereditati, default e vincoli dei descrittori. Esempi con invarianti controllate, errori intenzionali distinti e limiti di freeze/JSON espliciti.
- Corretti task/microtask e opportunita di rendering, callback sincrone/asincrone, canali di errore e return, stati e composizione delle Promise. Aggiunti esempi completi di lavoro a blocchi, lettura error-first, cleanup dei listener e Fetch con schema dichiarato.
- Corretti combinatori e input vuoti, timeout e abort con cleanup fino alla lettura del corpo, return await e top-level await. Riscritto il pool per evitare rifiuti non gestiti, fermare nuovi avvii dopo un errore e attendere i lavori gia attivi.
- Corretti wrapper Fetch e header, risposte vuote, FormData, consumo del corpo e schema dei dati. Approfonditi signal monouso, motivi di abort, any/timeout, cleanup dei listener e ricerca protetta da risultati obsoleti.
- Corretti XHR e ciclo della UI AJAX; completati parsing, invio limitato e backoff WebSocket. Allineata Real-time con WebSocket con start/stop, cleanup e retry limitati, senza ripartenza dopo stop volontario.
- Chiariti purezza, mutazione locale, currying e composizione; separati core e shell DOM. Corretti Observer, selezione delle strategie e wrapper che perdeva this; precisati scope dei moduli e limiti dei pattern.
- Corretti clonazione, transfer, tabelle freeze/seal e deepFreeze con cicli/accessor. Completati protocolli iterator, next/return/throw e paginazione lazy con schema, limite richieste e abort.
- Corretti protocollo, clone/transfer, errori e cancellazione dei worker. Riscritti lifecycle, scope, cache e fallback dei Service Worker; separati installabilita PWA, offline e API opzionali. Nessun worker installato in Quartz.
- Corretti lifecycle, upgrade, attributi/proprieta, eventi e testo non fidato nei Web Components; aggiunti toggle con tastiera/stato e cleanup esterno. Corretti timeout idle, polling, rAF e lavoro a blocchi con fallback, budget e abort.
- Completata WebAssembly interop con sorgente WAT compilabile, loader HTTP/streaming/fallback, ABI numerica, UTF-8, crescita e ownership della memoria, errori e limiti CSP/toolchain. WABT 1.0.39 isolato in una cartella temporanea esterna, senza modifiche alle dipendenze del sito.
- Corretti stack/heap intesi come collocazione obbligatoria, alias e root del GC. Aggiunti cleanup idempotenti per widget e timer, esempi completi di cicli/Map, WeakRef e FinalizationRegistry; distinti raccolta, riuso, RSS e metriche Node. I test non promettono rilascio fisico o tempi del collector.
- Corretti listener anonimi, abort tardivo, diagnosi dei leak e limiti delle cache; aggiunti vista cancellabile, LRU e richiesta protetta dopo lo smontaggio. Chiariti simboli, identita, ephemeron, valori undefined e API recenti di WeakMap, stato privato e visita iterativa senza duplicare nodi.
- Completati misurazione e limiti delle ottimizzazioni, debounce/throttle e filtro con cleanup, letture DOM e border-box. Corretti copie/viste/conversioni/transfer, ArrayBuffer ridimensionabili, DataView con offset, UTF-8 strict e Buffer Node; aggiunto parser didattico con limiti dichiarati e controlli sui dati.
- Corretti receiver, invarianti, defineProperty e limiti dei Proxy; completati validazione, revoca, chiamate e costruzione. Resi eseguibili e deterministici i casi ESM/CommonJS con entry point espliciti, export parziali/sostituiti, composizione e import lazy; aggiunto il caso di attesa reciproca con top-level await.
- Distinti decorator moderni e legacy, stato TC39 datato e supporto del compilatore. Corretti timing async, validazione dei campi e auto-accessor; completati composizione, addInitializer, binding e metadata. Esempi trasformati con esbuild 0.27.3, non presentati come prova di sintassi nativa.
- Distinti XSS, CSRF, autorizzazione, cookie e storage; aggiunti rendering testuale, URL con protocollo/origine verificati e invio con token CSRF dal contratto esplicito. Riscritta CORS con demo locale completa, credenziali, preflight, cache e header esposti; documentata la divergenza osservata fra Chrome e Fetch per Authorization con wildcard.
- Completate CSP e Sanitizzazione input: nonce per risposta, hash esatti, fallback, strict-dynamic e report-only; distinti validazione, encoding e HTML sanitizzato. Aggiunti moduli eseguibili e allowlist DOMPurify 3.4.16, installato solo in una directory temporanea esterna. Nessuna modifica alla CSP o alle dipendenze di Quartz.
- Aggiunti 1209 test Node.js e 274 test Chrome, tutti superati (1483 totali) con file eseguiti serialmente e senza build concorrente; superati anche i 9 test della trasformazione e i controlli strutturali (911 documenti, zero errori, 597 avvisi editoriali). Il totale include 11 gruppi di controllo sintattico dei promemoria, distinti dall'esecuzione dei frammenti. Fixture loopback e directory temporanee richiedono esecuzione autorizzata fuori dal sandbox che ne blocca l'accesso.
- Completata Supply chain security npm con limiti di lockfile/audit/firme, policy degli script, registry, CI e OIDC. Aggiunta demo npm 11.19.0 e 12 test CLI offline su fixture temporanee, senza aggiornamenti delle dipendenze del sito. Distinti i cambiamenti documentati di npm 12 dai comportamenti provati con npm 11.
- Creato il registro `_Meta/Revisione contenuti.md` con copertura, limiti e prossimo blocco.
- Completata Node.js Basics con formati ESM/CommonJS espliciti, working directory, argomenti, ambiente e gestione degli errori. Aggiunta CLI completa senza dipendenze e 38 test reali di Node/npm su fixture isolate; dichiarati limiti di memoria/Unicode e separazione fra runtime e package manager.
- Completate File System fs e Path e Process: scritture esclusive, JSON validato senza sovrascrivere il sorgente, stream con errori, handle e metadati; distinti cwd/modulo/URL, semantica Windows/POSIX e autorizzazione dei percorsi. Aggiunti parsing CLI e ambiente con precedenza dichiarata e 77 test su fixture temporanee, inclusa una junction/link interna alla fixture.
- Completate Events Node.js e Streams Node.js: dispatch sincrono, errori/rejection, cleanup e attese preventive, job con worker esplicito; chunk/framing/UTF-8, backpressure, fine/chiusura, scrittura e gzip esclusivi, JSON Lines e cancellazione senza rollback. Aggiunti 58 test su snippet reali, filesystem temporaneo e stream controllati.
- Completate Buffer Node.js e HTTP server: copie/viste/encoding, hex rigoroso, interi e lettura Base64 limitata; server locale con routing, body limitato, JSON/schema, HEAD, errori async, timeout e shutdown. Aggiunti 79 test Node su file temporanei e servizi loopback, con limiti delle prove espliciti.
- Completate Child process e Worker threads: programmi Node portabili, argv/ambiente/output, exit/close e limiti dei segnali; calcolo completo e protocollo one-shot con attesa della chiusura, errori tardivi, abort/timeout, clone e transfer. Aggiunti 90 test su processi e thread reali, senza rete esterna o modifiche alle dipendenze.
- Completate Testing ed ESLint: runner/assertion/ambiente, esempi Node completi e asincroni, contratti e limiti di mock/coverage; flat config ESLint 10 con globali distinti, regole reali, ignore, fix ed exit code. Aggiunti 74 test, incluse due alterazioni controllate nelle fixture e la correzione di print-config. Tool ESLint installati solo in una directory temporanea esterna.
- Completate Prettier e Vite: formatter distinto dai controlli logici, configurazione/ignore/CI e output esatto; progetto frontend completo con base, asset, env pubblici, dev/build/preview e limiti HMR/tipi. Aggiunti 32 test Node/browser con Prettier 3.9.10 e Vite 8.3.4 installati soltanto in una directory temporanea esterna.
- Completate Bundling e tree shaking e Source maps e debugging: distinti effetti al caricamento e nel corpo delle funzioni, namespace statici, sideEffects/PURE, splitting e DCE; mappe esatte di build, hidden non privato e diagnosi di un errore intenzionale. Aggiunti 24 test, inclusi quattro Chrome, senza nuove dipendenze del sito.
- Completate SPA e routing lato client e API REST: corrette intercettazione dei link, cronologia e fallback; distinti vincoli REST, semantica HTTP e contratto del client. Aggiunti router didattico completo, client validato e 44 test Node/Chrome, con demo offline e fixture HTTP locali.
- Completata Server-side rendering: distinti SSR, SSG, hydration e progressive enhancement; corretti escaping, cache privata e limiti dell'hosting. Aggiunto demo Node completo con ricerca server e ordinamento opzionale, verificato con 33 test, di cui otto Chrome. Nessuna nuova dipendenza; React hydration, RSC e streaming restano spiegazioni, non funzionalita provate dal demo.
- Completati anche tutti gli 11 promemoria JavaScript: corretti contesti degli snippet, export ESM, copie e campi pubblici, raggruppamenti, regex/date, cleanup Promise, timeout Fetch fino alla lettura del corpo, storage e DOM. Mantenuti sintetici con rinvii alla teoria; aggiunti 64 test Node/Chrome, senza nuove dipendenze.
- Verificata l'ultima build Quartz: 2.003 HTML e 135.332 riferimenti interni senza errori. Controllati tutti gli 11 promemoria con Chrome 155.0.8059.40 su desktop/mobile, inclusi codice e scorrimento delle cinque tabelle; ispezionati 11 screenshot rappresentativi delle schede. Nessun overflow del documento, errore JavaScript o caricamento HTTP fallito. Anteprima esistente mantenuta sulla porta 8082; nessun commit, push o deploy remoto.

### Decisioni

- La revisione tecnica procede per blocchi coerenti; i risultati non si estendono automaticamente alle altre note.
- Le note rimangono `non revisionato` fino al controllo dell'utente.
- I test degli esempi sono separati dai controlli di pubblicazione. Le risposte HTTP sono simulate o servite da una fixture temporanea su loopback; nessuna dipendenza da backend o servizi esterni.

### Prossimi passi

- Completata questa passata su tutte le 87 note JavaScript in Pagine e sugli 11 promemoria, 98 note complessive. Restano i contenuti degli altri argomenti, incluso il punto segnalato su SSR e SSG in React; Symbols e Iteration protocols rimandano a note gia controllate. Non confondere questa copertura con l'approvazione dell'utente.

## 2026-09-13 - Vault focalizzato e navigazione unificata

### Fatto

- Conservate solo le aree Programmazione, Stampante 3D e Programmi open source; rimosse le altre aree tematiche dalla versione corrente.
- Riorganizzati Home, indici principali e promemoria locali dei linguaggi; normalizzati PostgreSQL, nomi, YAML e wikilink completi.
- Corrette gerarchie dei titoli, comandi copiabili e schede software troppo sintetiche; riscritta l'introduzione ai componenti FDM.
- Adattata la pubblicazione Quartz: indici come pagine iniziali di cartella, reindirizzamenti per i percorsi spostati e controlli automatici prima del deploy.
- Aggiunti README, test della trasformazione e rapporto strutturale riproducibile.
- Verificati 911 documenti raggiungibili, 9 test automatici e 2003 HTML senza link o ancore mancanti; controllate navigazione, ricerca e resa desktop/mobile.

### Decisioni

- Markdown e fonte unica; gli indici non usano YAML e gli HTML restano generati.
- Nel sito gli indici curati non ripetono l'elenco automatico di cartella; i font hanno fallback locali e gli URL spostati dispongono di redirect.
- Le tre aree mantenute sono pubblicabili. Raw, template, metadati e infrastruttura restano esclusi dal sito.
- La guida Marlin resta fissata alla release 2.1.2.8. I promemoria rimandano alla teoria, senza duplicarla.
- Le note modificate restano non revisionate. La normalizzazione non equivale a certificare ogni esempio tecnico.

### Prossimi passi

- Integrare progressivamente le fonti mancanti indicate dal rapporto editoriale.
- Rivedere i contenuti modificati prima di commit e pubblicazione.
