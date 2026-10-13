---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - javascript
  - security
  - xss
  - csrf
  - sanitization
  - browser
aliases:
  - Sicurezza JS
  - JavaScript Security
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Manipolazione del DOM]]"
  - "[[Programmazione/JavaScript/Pagine/Fetch API]]"
  - "[[Programmazione/JavaScript/Pagine/Browser Storage]]"
related:
  - "[[Programmazione/JavaScript/Pagine/CORS]]"
  - "[[Programmazione/JavaScript/Pagine/Browser Storage]]"
  - "[[Programmazione/JavaScript/Pagine/Form Handling e Validazione]]"
title: Sicurezza
---

# Sicurezza

## Sintesi

Questa nota riguarda la **sicurezza del JavaScript nel browser**: dati non fidati, DOM, sessioni e richieste HTTP. Non e un audit completo del backend o di Node.js.

Il punto centrale e distinguere **dati, codice e autorizzazioni**. Una stringa valida per il tuo modello puo essere pericolosa se interpretata come HTML; un pulsante nascosto non impedisce di chiamare l'API; una richiesta bloccata da CORS puo aver gia raggiunto il server.

## Quando usarlo

- Quando renderizzi nomi, messaggi, Markdown o altri contenuti esterni.
- Quando gestisci login, sessioni, cookie o token.
- Quando invii operazioni che modificano dati.
- Quando scegli dipendenze, script di terze parti, storage e log.

Considera non fidati anche i dati di API, URL, file importati e storage locale. Una fonte interna puo aver memorizzato contenuti originariamente inseriti da un utente.

## Come funziona

### Confini di fiducia

| Controllo | Cosa fa | Cosa non garantisce |
| --- | --- | --- |
| Validazione client | Aiuta l'utente a compilare correttamente | Non impedisce richieste create fuori dalla UI |
| Autenticazione server | Identifica una sessione o un chiamante | Non autorizza qualsiasi operazione o oggetto |
| Autorizzazione server | Decide se il chiamante puo agire su quella risorsa | Non sostituisce la verifica CSRF |
| CORS | Regola l'accesso cross-origin alle risposte nel browser | Non rende privata una API |
| API DOM testuali | Inseriscono testo senza interpretarlo come HTML | Non validano un URL usato altrove |

Il server deve ricontrollare tipi, dimensioni, valori ammessi e permessi **per ogni operazione**. Non fidarti di un ID utente, prezzo o ruolo inviato dal client. `form.checkValidity()` e `reportValidity()` riguardano la UX; non verificano esistenza di un indirizzo email, proprieta di un account o autorizzazioni.

### XSS: quando un dato diventa codice

XSS permette l'esecuzione di codice nel contesto della pagina. Puo essere riflesso da una risposta, memorizzato e mostrato ad altri utenti, oppure prodotto interamente da una manipolazione DOM. Queste categorie possono sovrapporsi.

**Controesempi da non usare con dati non fidati:** `element.innerHTML = userInput` e ``container.innerHTML = `<strong>${username}</strong>` ``. Anche `insertAdjacentHTML`, attributi evento, `eval` e `new Function` sono contesti pericolosi. Non tutti i payload richiedono un tag script.

Per mostrare testo in un elemento ordinario usa `textContent`. Per HTML ricco serve un sanitizer mantenuto, con regole coerenti con il contenuto ammesso; sostituzioni manuali o una regex non costituiscono un parser HTML sicuro. Non modificare poi il risultato in modo da reintrodurre markup non fidato.

La protezione dipende dal **contesto di destinazione**: escaping HTML, URL, JSON, SQL e shell non sono intercambiabili. Nemmeno `setAttribute` rende innocuo qualsiasi attributo: `href`, `src`, `srcdoc` e gestori evento hanno significati diversi. `textContent` non e una giustificazione per creare elementi `script` con testo esterno.

### CSRF: una richiesta autenticata ma non voluta

Con una sessione basata su cookie il browser puo allegare l'identita dell'utente a una richiesta provocata da un altro sito. L'attaccante non ha necessariamente bisogno di leggere la risposta: il danno puo essere la modifica gia eseguita.

Preferisci la protezione CSRF del framework. Per il modello con token sincronizzato, il server emette un valore imprevedibile associato alla sessione, il client lo rimanda e il server lo verifica **prima** della modifica. Non basta aggiungere un header con un valore fisso; non inserire il token in URL o log. Il token CSRF non e il cookie di sessione e non e un access token.

Difese complementari sono cookie SameSite, verifica esatta di Origin/Referer e Fetch Metadata con una policy esplicita per header mancanti e client supportati. Non usare GET per cambiare dati. Autenticazione, autorizzazione e scelta di POST sono necessarie nel loro ambito, ma **non bastano da sole contro CSRF**.

CORS puo contribuire a una policy per API con header obbligatori e origini strettamente controllate; non e una soluzione generale per form e richieste senza preflight. Un XSS nella pagina puo leggere il token CSRF o usare la sessione e aggirare queste difese.

### Cookie, storage e segreti

Esempio di **header di risposta HTTPS del server**, con valore segnaposto da sostituire con un identificatore di sessione generato dal server:

```http
Set-Cookie: __Host-session=VALORE_GENERATO_DAL_SERVER; Path=/; Secure; HttpOnly; SameSite=Lax
```

- `HttpOnly` impedisce la lettura tramite JavaScript, non l'invio del cookie nelle richieste. Un XSS puo comunque compiere azioni come l'utente.
- `Secure` limita l'invio ai collegamenti sicuri, salvo regole speciali per ambienti locali; non usare tali eccezioni come configurazione di produzione.
- `SameSite` riguarda il **site**, non l'origin: due sottodomini possono essere same-site ma cross-origin. Lax consente alcune navigazioni top-level con metodi sicuri; non e un'autorizzazione applicativa.
- Il prefisso `__Host-` richiede Secure, Path=/ e assenza di Domain nei browser che lo supportano. Restringe l'ambito al singolo host, non alla porta.

Per cookie usati in contesti cross-site puo servire `SameSite=None; Secure`, insieme alle difese CSRF. Le politiche sui cookie di terze parti possono comunque impedirne uso o memorizzazione. Rotazione al login, scadenza, revoca e logout vanno progettati sul server.

`localStorage`, `sessionStorage` e IndexedDB sono leggibili dagli script della stessa origine: non sono casseforti. Il controesempio `localStorage.setItem("token", token)` rende il token accessibile anche a un XSS. La scelta tra cookie e token richiede un modello di minaccia, non una sostituzione meccanica. Una chiave segreta inclusa nel bundle frontend o in una sua variabile di ambiente e pubblica per chi scarica il codice.

### Dipendenze, policy e log

Usa lockfile, aggiornamenti controllati, advisory e dipendenze limitate al necessario. Un audit senza segnalazioni non dimostra assenza di vulnerabilita o codice malevolo. Gli script di terze parti caricati nella pagina possono avere ampio accesso al suo contesto.

CSP aggiunge vincoli all'esecuzione e al caricamento delle risorse, ma non sostituisce rendering corretto e validazione. Un semplice `default-src 'self'` non e una policy completa per ogni applicazione: segui la nota dedicata e verifica le violazioni prima del rollout.

Non mostrare stack trace, SQL, cookie o token agli utenti; non inviarli automaticamente a log e telemetria. Mostra un messaggio comprensibile e un identificatore di richiesta non sensibile, mantenendo i dettagli tecnici negli strumenti autorizzati.

## API / Sintassi

### Testo e URL richiedono controlli diversi

Funzioni browser indipendenti da framework. Il nome deve essere una stringa da 1 a 80 unita UTF-16; il link deve puntare all'origine HTTPS esatta della documentazione. Il limite del nome e un contratto della demo, non una difesa XSS:

```js
function renderUsername(username) {
  if (typeof username !== "string" || username.length < 1 || username.length > 80) {
    throw new TypeError("Nome richiesto, massimo 80 unita UTF-16");
  }
  const element = document.createElement("strong");
  element.textContent = username;
  return element;
}

function helpUrl(input) {
  if (typeof input !== "string") throw new TypeError("URL testuale richiesto");
  const url = new URL(input);
  if (url.protocol !== "https:" || url.origin !== "https://docs.example.com" ||
      url.username || url.password) {
    throw new TypeError("Origine della documentazione non consentita");
  }
  return url.href;
}

function renderHelpLink(input) {
  const href = helpUrl(input);
  const link = document.createElement("a");
  link.href = href;
  link.textContent = "Documentazione";
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  return link;
}

const preview = document.createElement("p");
preview.append(renderUsername("<img src=x onerror=alert(1)>"));
preview.append(" ", renderHelpLink("https://docs.example.com/guide"));
document.body.append(preview);
```

Il markup nel nome appare come testo: non viene creata un'immagine. L'URL e analizzato con `URL`, non con `startsWith`; `javascript:`, `blob:`, HTTP, altri host/porte e credenziali nell'URL vengono rifiutati. Controlliamo anche il protocollo perche una URL blob puo riportare l'origine HTTPS incorporata. Le URL relative non sono ammesse in questa demo. La normalizzazione del parser puo accettare maiuscole e la porta HTTPS predefinita.

`noopener` separa la finestra aperta dal suo opener; `noreferrer` omette anche il referrer. La allowlist iniziale non controlla i redirect del sito di destinazione: resta necessario fidarsi del servizio. Per una query costruisci l'URL da una base fidata e usa `searchParams`, non concatenazioni di stringhe.

## Esempio pratico

### Invio same-origin con token CSRF

Il contratto presuppone una pagina autenticata HTTPS e un backend `/api/preferences` che verifica sessione, autorizzazione, token CSRF e schema `{ theme: "light" | "dark" }`, restituendo **204 senza corpo** al successo. Nessun backend reale e implementato da questa funzione.

```js
async function saveTheme(theme, csrfToken, { signal } = {}) {
  if (theme !== "light" && theme !== "dark") {
    throw new TypeError("Tema non valido");
  }
  // La demo usa un token del server codificato come 64 cifre esadecimali.
  if (typeof csrfToken !== "string" || !/^[a-f0-9]{64}$/.test(csrfToken)) {
    throw new TypeError("Formato del token CSRF non valido");
  }
  const response = await fetch("/api/preferences", {
    method: "POST",
    mode: "same-origin",
    credentials: "same-origin",
    redirect: "error",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify({ theme }),
    signal,
  });
  if (response.status !== 204) {
    throw new Error(`Salvataggio fallito: HTTP ${response.status}`);
  }
}
```

Il token deve essere fornito dal server alla pagina o da un endpoint same-origin, non generato dal client per ogni chiamata: il controllo della regex riguarda solo il formato. La verifica del valore e del legame con la sessione resta sul server. Un token fittizio nei test non e una credenziale utilizzabile.

Il chiamante deve attendere la Promise e gestire HTTP inattesi, rete, redirect rifiutati e abort. Il redirect automatico e disabilitato; non si segue silenziosamente un cambio di endpoint. Un annullamento o un errore di rete non dimostra che il server non abbia gia salvato la modifica: evita retry automatici di operazioni non idempotenti.

Per collegarla alla UI usa un gestore con try/catch e mostra un errore generico; non stampare token o corpo integrale della risposta. Non applicare questi header a un URL deciso dall'utente. La funzione non gestisce rinnovo della sessione, rate limit, retry o conflitti tra modifiche concorrenti.

## Varianti

- **Testo semplice:** API DOM testuali, senza interpretazione HTML.
- **HTML ricco:** sanitizer e policy dedicati, trattati nella nota Sanitizzazione input.
- **Sessione cookie:** protezioni cookie, CSRF e controlli server.
- **Bearer esplicito:** strategia di emissione, custodia e revoca; non diventa sicuro solo perche non usa cookie.
- **Policy browser:** CORS e CSP risolvono problemi diversi; nessuna sostituisce i controlli server.

## Errori comuni

- Confondere HTML valido con HTML innocuo o una stringa JSON con un dato autorizzato.
- Usare innerHTML, eval o attributi evento con contenuti esterni.
- Considerare HttpOnly una protezione completa da XSS, o SameSite una barriera fra tutti i sottodomini.
- Pensare che POST, autenticazione o CORS bastino da soli contro CSRF.
- Inserire segreti nel bundle, nello storage leggibile da script o nei log.
- Presentare una allowlist di URL o un esempio client come audit completo della sicurezza.

## Checklist

- I dati sono validati sul server e autorizzati per utente, risorsa e azione?
- Ogni inserimento distingue testo, HTML, URL e codice?
- Le operazioni con cookie sono protette contro CSRF anche senza lettura della risposta?
- Cookie, scadenza, rotazione e revoca sono coerenti con il flusso di autenticazione?
- Errori e telemetria escludono credenziali e dati sensibili?
- Dipendenze, policy browser e casi negativi sono verificati nell'ambiente reale?

## Collegamenti

- [[Programmazione/JavaScript/Pagine/CORS|CORS]]
- [[Programmazione/JavaScript/Pagine/Content Security Policy|Content Security Policy]]
- [[Programmazione/JavaScript/Pagine/Sanitizzazione input|Sanitizzazione input]]
- [[Programmazione/JavaScript/Pagine/Supply chain security npm|Supply chain security npm]]
- [[Programmazione/JavaScript/Pagine/Browser Storage|Browser Storage]]
- [[Programmazione/JavaScript/Pagine/Form Handling e Validazione|Form Handling e Validazione]]
- [[Programmazione/JavaScript/Pagine/Manipolazione del DOM|Manipolazione del DOM]]

## Fonti

- [OWASP - XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP - CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [OWASP - HTML5 Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html)
- [MDN - Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)
- [MDN - Site](https://developer.mozilla.org/en-US/docs/Glossary/Site)

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
