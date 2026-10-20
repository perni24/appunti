---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - react
  - security
  - csrf
aliases:
  - CSRF
  - Cross-Site Request Forgery
prerequisites:
  - "[[Programmazione/React/Pagine/Gestione Autenticazione|Gestione Autenticazione]]"
related:
  - "[[Programmazione/React/Pagine/Protezione XSS|Protezione XSS]]"
  - "[[Programmazione/React/Pagine/API layer|API layer]]"
title: CSRF
---

# CSRF

## Sintesi

**CSRF** (Cross-Site Request Forgery) induce il browser a compiere un'azione indesiderata usando credenziali inviate automaticamente, tipicamente un cookie di sessione. L'attaccante non deve necessariamente leggere la risposta.

React non e una protezione CSRF. Il client puo allegare un token, ma e il **server** a dover rifiutare richieste non valide prima della modifica. Autenticazione, autorizzazione e protezione CSRF sono controlli distinti.

## Quando usarlo

- Sessioni via cookie e operazioni di modifica: preferenze, account, logout, acquisti.
- Form HTML, chiamate fetch e Server Functions: il tipo di UI non elimina il rischio.
- Anche login e collegamento di account richiedono un'analisi dedicata, non solo le pagine gia autenticate.

Preferisci la difesa integrata nel framework backend. Questa nota mostra il contratto di un client, non un middleware universale.

## Come funziona

### Cosa protegge ciascun meccanismo

| Meccanismo | Utilita e limite |
| --- | --- |
| Cookie `HttpOnly` | Impedisce la lettura da JavaScript, non il suo invio nelle richieste |
| Cookie `SameSite` | Limita l'invio cross-site; non equivale a same-origin |
| Token CSRF | Il server verifica un valore imprevedibile associato alla sessione |
| Controllo `Origin` | Il server confronta schema, host e porta con un'origine fidata |
| CORS | Regola accesso cross-origin alle risposte e preflight; non blocca ogni invio |
| Autorizzazione | Controlla se l'utente puo modificare quella risorsa, non se voleva farlo |

`https://app.example.com` e `https://altro.example.com` sono origini diverse ma possono essere same-site. Un sottodominio non fidato conta quindi anche con SameSite. `Lax` permette alcuni invii di cookie durante navigazioni principali con metodi sicuri: **GET non deve modificare stato**. `SameSite=None` richiede `Secure`; non e la scelta automatica per risolvere CORS. [Cookie e SameSite](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie).

Un normale form cross-origin puo inviare POST senza preflight. JSON e header personalizzati richiedono invece un preflight nelle richieste cross-origin; un server che consente origini arbitrarie con credenziali puo vanificare questo confine. Il fallimento della lettura CORS non dimostra che la richiesta non abbia raggiunto il server. [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS).

### Token e origine

Nel pattern **synchronizer token**, il backend genera il token, lo lega alla sessione e lo consegna tramite HTML/JSON non condiviso in cache. Il client lo restituisce in un header o campo form. Non usare l'ID di sessione come token, non metterlo nella URL o nei log e non accettare il solo cookie come prova.

Il pattern **signed double-submit** e un'alternativa: firma e legame alla sessione sono importanti. Il semplice confronto di due valori, cookie e parametro, non e equivalente. XSS puo leggere il token o effettuare richieste valide: prevenire XSS resta necessario. [OWASP CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).

## API / Sintassi

### Contratto dell'esempio

L'applicazione e l'API sono **same-origin**. La sessione e gia stata verificata come in [[Programmazione/React/Pagine/Gestione Autenticazione|Gestione Autenticazione]]; il componente riceve `csrfToken` dal provider, non da una costante nel bundle.

| Richiesta | Contratto scelto per il demo |
| --- | --- |
| `GET /api/session` | Restituisce user e csrfToken; nessuna modifica applicativa, `Cache-Control: no-store` |
| `PUT /api/preferences` | JSON con il solo booleano `newsletter`; header `X-CSRF-Token` |
| `204` | Modifica confermata, nessun body JSON da leggere |
| `401` | Sessione assente o scaduta: riconciliare lo stato autenticato |
| `403` | Origine, token o permessi rifiutati; non e sempre "token scaduto" |
| Altri status / rete | Non confermare il salvataggio e non ripetere automaticamente |

Prima di salvare, il backend deve verificare metodo, origine configurata, sessione, token, Content-Type, dimensione/schema del body e autorizzazione. L'utente da modificare deriva dalla sessione, non da un `userId` scelto dal client. La validazione client serve alla UX e non sostituisce questi controlli.

Per questo contratto browser-only scegliamo di rifiutare `Origin` assente, `null` o diverso dall'origine configurata. Non ricavare l'origine fidata da un header Host/Forwarded arbitrario. Se il prodotto richiede fallback su Referer, client non-browser o proxy, definire e testare una policy separata. `Origin` e controllato dal browser ma non autentica un client HTTP generico. [Header Origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Origin).

## Esempio pratico

### Client e form React

File `PreferencesForm.jsx`, React 19. Il token del contratto usa 32-256 caratteri base64url. Importa il componente in una schermata autenticata e passagli il token della sessione corrente; smontalo al logout o al cambio sessione/token, per esempio tramite una `key` di sessione gestita dal parent. Non montarlo durante il caricamento della sessione.

```jsx
import { useEffect, useRef, useState } from "react";

export async function savePreferences(newsletter, csrfToken, { signal } = {}) {
  if (typeof newsletter !== "boolean") {
    throw new TypeError("Preferenza non valida");
  }
  if (typeof csrfToken !== "string" || !/^[A-Za-z0-9_-]{32,256}$/.test(csrfToken)) {
    throw new TypeError("Token CSRF non valido");
  }
  const response = await fetch("/api/preferences", {
    method: "PUT",
    credentials: "same-origin",
    cache: "no-store",
    redirect: "error",
    signal,
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify({ newsletter }),
  });
  if (response.status !== 204) {
    const error = new Error(`Salvataggio rifiutato: HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
}

export default function PreferencesForm({ csrfToken }) {
  const [newsletter, setNewsletter] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const request = useRef(null);

  useEffect(() => () => {
    const controller = request.current;
    request.current = null;
    controller?.abort();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    setMessage("");
    try {
      await savePreferences(newsletter, csrfToken, { signal: controller.signal });
      if (request.current === controller) setMessage("Preferenza salvata.");
    } catch (error) {
      if (request.current !== controller) return;
      setMessage(error.status === 401
        ? "Sessione scaduta: accedi di nuovo."
        : error.status === 403
          ? "Richiesta non consentita: verifica la sessione e i permessi."
          : "Esito non confermato: verifica la preferenza prima di riprovare.");
    } finally {
      if (request.current === controller) {
        request.current = null;
        setPending(false);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        <input type="checkbox" checked={newsletter} disabled={pending}
          onChange={event => setNewsletter(event.target.checked)} />
        Ricevi la newsletter
      </label>
      <button type="submit" disabled={pending}>
        {pending ? "Salvataggio..." : "Salva preferenza"}
      </button>
      <p role="status">{message}</p>
    </form>
  );
}
```

La checkbox e una **bozza iniziale**, non il caricamento della preferenza gia salvata. Il demo non implementa backend, login, lettura della preferenza o sincronizzazione fra schede. Il parent gestisce la sessione; il messaggio 401 non esegue da solo il logout globale.

L'URL e fisso: non accettare un endpoint da query string/hash per inviarvi automaticamente token e credenziali. `redirect: "error"` evita di seguire redirect inattesi; `204` e l'unico successo previsto. Fetch non rifiuta automaticamente per status 403/500. [Uso di fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch).

Il doppio invio nello stesso componente viene bloccato, ma altre schede e client restano indipendenti. Annullare fetch allo smontaggio **non annulla una scrittura gia eseguita**. Dopo errore di rete l'esito puo essere incerto: riconciliare col server prima di riprovare. Per operazioni non idempotenti serve anche una strategia server contro duplicati; un token CSRF non e una chiave di idempotenza.

## Varianti

- **Form HTML:** token in un campo hidden verificato dal server; non basta aggiungere l'input al JSX.
- **Fetch Metadata:** il server puo rifiutare mutazioni `Sec-Fetch-Site: cross-site`; decide anche come trattare same-site e header mancanti. Non assume fidati tutti i sottodomini. [Sec-Fetch-Site](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Fetch-Site).
- **API su altra origine:** richiede un contratto CORS esplicito, credenziali e cookie appropriati. Non sostituire indiscriminatamente same-origin con include.
- **Bearer esplicito:** riduce il CSRF classico se il browser non allega automaticamente credenziali. Cookie di refresh/login vanno comunque analizzati e XSS resta un rischio.
- **Server Functions:** usare le difese del framework e autorizzare ogni mutazione; la presenza di un form action React non certifica il backend.

## Errori comuni

- Usare GET per cancellare dati o fare logout, confidando in SameSite=Lax.
- Aggiungere `X-CSRF-Token` senza verificarlo sul server, oppure usare un token fisso pubblico.
- Accettare qualunque origine CORS/Origin, o confrontarla tramite startsWith/includes.
- Ritentare ogni 403 con un nuovo token: puo essere un errore di autorizzazione.
- Inviare token a URL controllate dall'utente o registrarli in log/telemetria.
- Confondere CSP, HttpOnly, CSRF, idempotenza e autorizzazione.

## Checklist

- Identifica le credenziali automatiche e tutte le operazioni mutative, inclusi login/logout.
- Prova token assente, errato e appartenente a un'altra sessione: nessuna modifica deve avvenire.
- Prova form cross-origin, origine simile ma diversa, null/mancante e metodi non ammessi.
- Controlla separatamente cookie, CORS, Content-Type, schema e autorizzazione per risorsa.
- Non condividere in cache risposte di sessione/token; elimina lo stato al cambio identita.
- Verifica rete interrotta e doppio invio senza dichiarare un successo mai confermato.

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/Gestione Autenticazione|Gestione Autenticazione]]
- [[Programmazione/React/Pagine/Protezione XSS|Protezione XSS]]
- [[Programmazione/React/Pagine/Content Security Policy|Content Security Policy]]
- [[Programmazione/React/Pagine/API layer|API layer]]
- [[Programmazione/React/Pagine/Gestione della memoria e AbortController|Abort e richieste obsolete]]

## Fonti

- [OWASP: prevenzione CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).
- [MDN: cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie), [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS), [Origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Origin) e [Fetch Metadata](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Fetch-Site).
- [MDN: fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch). Esempio verificato con React 19.3.0; il protocollo di sicurezza dipende dal backend, non dalla versione di React.
