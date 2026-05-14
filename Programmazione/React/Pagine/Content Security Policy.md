---
date: 2026-05-14
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [react, frontend, javascript]
aliases: [Content Security Policy]
prerequisites: []
related: []
---
# Content Security Policy

## Sintesi

Nota su Content Security Policy in React. Riassume il concetto, quando usarlo, i punti critici e gli errori da evitare durante sviluppo, debugging o revisione di applicazioni React.

La **Content Security Policy** (**CSP**) e un meccanismo di sicurezza del browser che limita quali risorse una pagina puo caricare o eseguire.

Nel contesto React, la CSP e una difesa a strati utile soprattutto contro alcune conseguenze degli attacchi XSS e contro il caricamento non autorizzato di script, stili o altre risorse.

> [!INFO] Punto chiave
> La CSP non sostituisce un codice sicuro. Riduce l'impatto di certi errori o vulnerabilita imponendo regole piu rigide su cio che il browser puo eseguire.

---

## 1. A cosa serve

Senza una policy restrittiva, il browser tende a eseguire:
- script inline;
- script caricati da origini esterne;
- stili inline;
- risorse provenienti da domini inattesi.

La CSP permette invece di dire esplicitamente:
- da dove sono permessi gli script;
- da dove possono arrivare immagini, font e API;
- se gli script inline sono vietati;
- se e richiesto un nonce o un hash.

In pratica, e un modo per ridurre la superficie di esecuzione arbitraria nel browser.

---

## 2. Relazione con XSS

La CSP e fortemente collegata a [[Programmazione/React/Pagine/Protezione XSS]].

Se un'app ha una vulnerabilita XSS, una CSP ben progettata puo limitare alcuni scenari, per esempio:
- bloccare script inline non autorizzati;
- impedire il caricamento di script da domini malevoli;
- ridurre la probabilita che un payload venga eseguito come previsto dall'attaccante.

Ma e importante capire il limite:
- la CSP non elimina la vulnerabilita di origine;
- non sostituisce escaping, sanitizzazione o validazione;
- non va trattata come unico meccanismo di sicurezza.

E una difesa aggiuntiva, non una scorciatoia.

---

## 3. Come viene definita

La CSP viene tipicamente inviata tramite header HTTP:

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none';
```

Oppure, in alcuni casi, tramite meta tag, anche se l'header HTTP e generalmente preferibile.

L'idea generale e che il server comunica al browser una serie di regole su cio che e permesso caricare o eseguire.

---

## 4. Direttive fondamentali

Alcune direttive molto comuni sono:

### `default-src`
Definisce la policy di default per varie categorie di risorse.

### `script-src`
Controlla da dove possono arrivare gli script e quali script possono essere eseguiti.

### `style-src`
Controlla fogli di stile e, in alcuni casi, stili inline.

### `img-src`
Controlla da dove possono arrivare le immagini.

### `connect-src`
Controlla connessioni come:
- `fetch`;
- XHR;
- WebSocket;
- EventSource.

### `font-src`
Controlla font esterni.

### `object-src`
Spesso viene impostato a `'none'` per ridurre superfici storicamente rischiose.

### `frame-ancestors`
Controlla chi puo embeddare la pagina in un frame.

---

## 5. Esempio pratico

Policy concettuale:

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self';
  img-src 'self' data:;
  connect-src 'self' https://api.example.com;
  object-src 'none';
  frame-ancestors 'none';
```

Questa policy dice, in sostanza:
- usa come default solo risorse dello stesso dominio;
- esegui script solo dello stesso dominio;
- consenti chiamate API solo verso l'host previsto;
- blocca oggetti embedded;
- impedisci framing della pagina.

E ovviamente solo un esempio: la policy reale dipende dall'architettura.

---

## 6. Inline script, nonce e hash

Uno dei punti piu importanti riguarda gli **inline script**.

Una CSP robusta tende a evitare `unsafe-inline` in `script-src`, perche:
- rende molto piu facile l'esecuzione di payload iniettati;
- indebolisce parecchio il valore della policy.

Quando serve autorizzare script specifici, si usano spesso:
- **nonce**;
- **hash**.

### Nonce
Il server genera un valore casuale per la risposta e lo associa agli script consentiti.

### Hash
La policy autorizza solo script inline il cui contenuto corrisponde a un hash noto.

Questi meccanismi permettono controllo fine senza aprire indiscriminatamente agli inline script.

---

## 7. CSP e applicazioni React

In una app React moderna, la CSP va progettata tenendo conto di:
- bundle JavaScript generati dal build tool;
- chiamate API verso backend o servizi esterni;
- immagini da CDN;
- font remoti;
- eventuali analytics;
- eventuali script di terze parti.

Per esempio, `connect-src` e spesso rilevante perche React usa `fetch` o librerie di data fetching verso endpoint esterni. Qui si collega direttamente a [[Programmazione/React/Pagine/Data Fetching e Cache]].

Se la policy e troppo permissiva, perde valore.

Se e troppo restrittiva senza criterio, rompe l'app.

Quindi va trattata come parte dell'architettura, non come flag finale aggiunto all'ultimo minuto.

---

## 8. Perche puo rompere un'app

Una CSP mal calibrata puo bloccare:
- script di analytics;
- font esterni;
- immagini CDN;
- richieste API cross-origin;
- stili inline generati da alcune librerie;
- hot reload o dev tooling.

Per questo spesso bisogna distinguere bene:
- policy di produzione;
- esigenze dell'ambiente di sviluppo.

L'errore comune e aprire tutto per "far funzionare l'app", perdendo il beneficio della policy.

---

## 9. CSP e terze parti

Ogni script o risorsa di terze parti aumenta la complessita della policy.

Domande utili:
- serve davvero quel provider esterno?
- da quali domini deve poter caricare?
- quel dominio deve eseguire script o solo servire immagini?
- possiamo limitarlo a una direttiva specifica invece di aprire tutto?

La CSP spinge anche a una disciplina architetturale migliore: ridurre dipendenze esterne inutili migliora sia sicurezza sia chiarezza.

---

## 10. Report-Only

Una strategia molto utile e usare inizialmente **Content-Security-Policy-Report-Only**.

In questo modo:
- il browser non blocca ancora le risorse;
- segnala pero cosa verrebbe bloccato;
- puoi osservare violazioni e aggiustare la policy.

Questo aiuta a costruire una CSP reale senza rompere subito l'applicazione in produzione.

E spesso il modo corretto di introdurla gradualmente.

---

## 11. CSP non risolve tutto

La CSP non protegge automaticamente da ogni problema:
- non corregge sanitizzazione assente;
- non elimina bug logici;
- non sostituisce controlli server;
- non annulla il rischio di usare librerie pericolose;
- non impedisce tutte le varianti di attacco se la policy e troppo aperta.

Va quindi vista come parte di una difesa a strati insieme a:
- escaping del JSX;
- sanitizzazione HTML;
- gestione corretta di token e cookie;
- difese contro CSRF come in [[Programmazione/React/Pagine/CSRF]].

---

## 12. Errori comuni

Errori frequenti:
- usare `unsafe-inline` senza reale necessita;
- usare `unsafe-eval` troppo liberamente;
- aprire wildcard troppo ampie;
- autorizzare piu domini del necessario;
- ignorare `connect-src` in app con molte chiamate API;
- introdurre CSP senza fase di osservazione o test.

Una CSP debole puo dare un falso senso di sicurezza. Una CSP forte ma non capita puo rompere l'app. Il punto e trovare una policy stretta ma consapevole.

---

## 13. Best Practices

1. **Considera la CSP una difesa aggiuntiva, non il meccanismo principale:** prima vengono codice sicuro e rendering corretto.
2. **Evita `unsafe-inline` e `unsafe-eval` quando possibile:** indeboliscono molto la policy.
3. **Permetti solo origini strettamente necessarie per ogni tipo di risorsa:** meno aperture, meno superficie d'attacco.
4. **Usa `Report-Only` per costruire la policy in modo iterativo:** e il modo piu pragmatico per non rompere l'app.
5. **Coordina la CSP con build tool, CDN, API e script di terze parti:** deve riflettere l'architettura reale del frontend.
6. **Collega la CSP al resto della strategia di sicurezza:** XSS, autenticazione cookie-based e sanitizzazione restano temi separati ma connessi.

---
