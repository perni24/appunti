---
date: 2026-04-22
tags: [react, security, xss, dangerouslysetinnerhtml, sanitization, frontend, javascript]
type: #permanent-note
status: budding
---

# Protezione XSS

La **protezione XSS** riguarda la difesa dagli attacchi **Cross-Site Scripting**, cioe situazioni in cui codice malevolo viene iniettato nella pagina ed eseguito nel browser dell'utente.

Nel frontend React questo tema e centrale perche l'interfaccia spesso visualizza dati che arrivano da:
- input utente;
- backend;
- CMS;
- query string;
- contenuti HTML esterni.

> [!INFO] Punto chiave
> Il rischio XSS nasce quando dati non affidabili vengono trattati come markup o codice eseguibile invece che come semplice testo.

---

## 1. Cos'e un attacco XSS

Un attacco XSS avviene quando un'applicazione permette a contenuti malevoli di finire nel DOM in modo eseguibile.

Esempio concettuale di input malevolo:

```html
<script>alert("xss")</script>
```

Se quell'input viene renderizzato come HTML attivo invece che come testo innocuo, il browser puo eseguire codice arbitrario.

Le conseguenze possono includere:
- furto di token o sessioni;
- esecuzione di azioni a nome dell'utente;
- manipolazione dell'interfaccia;
- esfiltrazione di dati sensibili.

---

## 2. Perche React e relativamente protettivo di default

React, per impostazione predefinita, fa **escaping** dei valori inseriti nel JSX.

Esempio:

```javascript
function Message({ text }) {
  return <p>{text}</p>;
}
```

Se `text` contiene una stringa con tag HTML o script, React la renderizza come testo e non come markup attivo.

Questo e uno dei motivi per cui [[JSX]] e relativamente sicuro nei casi normali.

In pratica:
- `"<b>Hello</b>"` viene mostrato come testo;
- non viene interpretato automaticamente come HTML reale.

---

## 3. Il vero punto critico: dangerouslySetInnerHTML

Il meccanismo piu delicato in React e `dangerouslySetInnerHTML`.

Esempio:

```javascript
function Article({ html }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
```

Qui React non applica il normale escaping del JSX. Stai dicendo esplicitamente al framework:

"Prendi questa stringa e inseriscila come HTML vero nel DOM."

Se `html` non e affidabile o non e stato sanitizzato, il rischio XSS diventa concreto.

> [!WARNING] Nome intenzionale
> `dangerouslySetInnerHTML` si chiama cosi proprio per segnalare che stai bypassando una protezione importante del rendering React.

---

## 4. Quando compare davvero il rischio

I casi piu comuni sono:
- contenuti HTML presi da un CMS;
- commenti utente con markup;
- descrizioni prodotto in HTML;
- preview di editor rich text;
- rendering di email, markdown convertito o contenuti remoti.

Il problema non e che usi HTML, ma che l'HTML arrivi da una fonte **non trusted** o solo parzialmente trusted.

Una regola utile e questa:
- **trusted text**: puo essere renderizzato come testo;
- **untrusted HTML**: va sanitizzato prima di essere inserito.

---

## 5. Sanitizzazione

La **sanitizzazione** rimuove o neutralizza parti pericolose dell'HTML prima del rendering.

Non basta "fare replace a mano" di alcuni tag. La sanitizzazione seria richiede una libreria o una strategia pensata per la sicurezza.

Esempio concettuale:

```javascript
const safeHtml = sanitize(userProvidedHtml);
```

Poi:

```javascript
<div dangerouslySetInnerHTML={{ __html: safeHtml }} />
```

Il punto importante e questo:
- escaping trasforma il contenuto in testo innocuo;
- sanitizzazione permette ancora un sottoinsieme controllato di HTML, eliminando le parti pericolose.

Sono due concetti diversi.

---

## 6. Non fidarti del backend "a occhi chiusi"

Un errore comune e pensare:

"Se l'HTML arriva dal backend, allora e sicuro."

Non basta.

La domanda corretta e:
- il backend valida davvero il contenuto?
- la sanitizzazione avviene in modo affidabile?
- il dato puo essere stato inserito da utenti o sistemi esterni?
- esistono piu punti di ingresso dello stesso contenuto?

La sicurezza reale richiede chiarezza sul trust boundary, non assunzioni vaghe.

---

## 7. XSS non significa solo tag script

Il rischio XSS non si limita al tag `<script>`.

Possono essere pericolosi anche:
- attributi evento come `onerror`;
- URL malevole in certi contesti;
- SVG o markup complesso;
- payload che sfruttano parsing HTML permissivo.

Per questo i filtri manuali e le blacklist improvvisate sono spesso inaffidabili.

Serve un approccio sistematico, non patch ad hoc.

---

## 8. Dove React aiuta e dove no

React aiuta bene quando:
- usi JSX normale;
- mostri testo tramite espressioni `{value}`;
- eviti di inserire HTML arbitrario nel DOM.

React non ti protegge automaticamente quando:
- usi `dangerouslySetInnerHTML`;
- integri librerie che manipolano il DOM in modo imperativo;
- monti contenuti esterni fuori dal flusso React;
- fai assunzioni errate sulla provenienza dei dati.

Quindi React riduce il rischio in molti casi comuni, ma non elimina il problema se aggiri il suo modello sicuro.

---

## 9. CSP e difesa a strati

Una difesa importante e la **Content Security Policy** (**CSP**).

La CSP aiuta a limitare:
- esecuzione di script inline;
- caricamento di script da origini non autorizzate;
- alcune forme di exploit lato browser.

Non sostituisce la sanitizzazione, ma aggiunge un livello di protezione.

In pratica:
- sanitizzazione riduce la probabilita di markup pericoloso;
- CSP riduce l'impatto di alcune esecuzioni malevole residue.

La sicurezza qui va pensata a strati, non come singolo fix.

---

## 10. Relazione con autenticazione e token

Gli attacchi XSS sono particolarmente pericolosi quando l'applicazione gestisce:
- token in memoria;
- token in `localStorage`;
- dati sensibili nel frontend;
- sessioni utente attive.

Per questo il tema si collega anche a:
- gestione autenticazione;
- scelte tra `HttpOnly cookies` e token esposti al JavaScript client;
- protezione generale del frontend.

Un'app con XSS e token leggibili da JavaScript espone un rischio molto piu alto.

---

## 11. Pattern sicuri

Pattern consigliati:
- renderizzare testo con JSX normale;
- evitare `dangerouslySetInnerHTML` quando non serve;
- sanitizzare HTML trusted solo in modo esplicito e controllato;
- centralizzare i punti dove HTML esterno viene ammesso;
- trattare query string, contenuti remoti e input utente come non affidabili.

Pattern rischiosi:
- passare HTML utente direttamente a `dangerouslySetInnerHTML`;
- fare sanitizzazione incompleta "a regex";
- concatenare markup dinamico senza controllo;
- usare librerie DOM imperative senza capire come inseriscono il contenuto.

---

## 12. Best Practices

1. **Usa JSX normale per testo e contenuti standard:** React fa escaping automatico e riduce il rischio XSS nei casi comuni.
2. **Evita `dangerouslySetInnerHTML` se non hai un bisogno reale:** e il punto di ingresso piu critico per il rendering HTML.
3. **Se devi renderizzare HTML esterno, sanitizzalo prima:** non fidarti di filtri manuali o blacklist improvvisate.
4. **Tratta sempre come untrusted i dati provenienti da utenti, CMS o query string:** il problema nasce proprio dai confini di fiducia ambigui.
5. **Aggiungi difese a strati come la CSP:** la sicurezza non deve dipendere da un solo meccanismo.
6. **Riduci l'impatto potenziale di un XSS anche sul piano architetturale:** sessioni, token e dati sensibili non dovrebbero essere esposti inutilmente al JavaScript client.

---
