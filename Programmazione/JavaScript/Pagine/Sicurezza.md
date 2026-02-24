---
date: 2026-02-24
tags: [javascript, security, xss, csrf, sanitization]
type: #permanent-note
status: budding
---

# Sicurezza in JavaScript

La sicurezza nelle applicazioni web è una responsabilità condivisibile tra frontend e backend. JavaScript, girando sul client, è esposto a vulnerabilità specifiche che possono compromettere i dati degli utenti.

## 1. XSS (Cross-Site Scripting)

L'**XSS** si verifica quando un utente malintenzionato inietta script malevoli (JS) in una pagina web visualizzata da altri utenti.

- **Esempio**: Un commento in un blog che contiene `<script>rubo_cookie()</script>`.

### Prevenzione
- **Uso di `textContent`**: Preferire sempre `element.textContent` invece di `innerHTML` per inserire testo dinamico, poiché il primo non interpreta i tag HTML.
- **Sanitizzazione**: Pulire l'input utente rimuovendo tag pericolosi.
- **CSP (Content Security Policy)**: Un header HTTP che istruisce il browser su quali sorgenti di script sono attendibili, bloccando script inline non autorizzati.

## 2. CSRF (Cross-Site Request Forgery)

Il **CSRF** inganna un utente autenticato spingendolo a eseguire azioni non volute (es. cambiare password o fare un bonifico) su un sito su cui è loggato.

- **Esempio**: Un'immagine con un link malevolo del tipo `<img src="https://banca.com/trasferisci?importo=1000&a=hacker">`.

### Prevenzione
- **SameSite Cookies**: Impostare il flag `SameSite=Strict` o `Lax` nei cookies per impedire che vengano inviati in richieste effettuate da siti terzi.
- **CSRF Tokens**: Il server genera un token unico e segreto per ogni sessione, che il client deve inviare in ogni richiesta "mutativa" (POST, PUT, DELETE).

## 3. Sanitizzazione e Validazione

Non fidarsi mai dell'input dell'utente. 

- **Validazione**: Controllare che il dato sia del tipo corretto (es. un'email sia davvero un'email).
- **Sanitizzazione**: Rimuovere o codificare caratteri speciali. In JavaScript si usa spesso una libreria collaudata come **DOMPurify** per pulire stringhe HTML prima di renderizzarle.

```javascript
import DOMPurify from 'dompurify';
const stringaSporca = '<img src=x onerror=alert(1)>';
const stringaPulita = DOMPurify.sanitize(stringaSporca);
document.body.innerHTML = stringaPulita; // Sicuro
```

## 4. Migliori Pratiche Generali

1.  **HTTPS**: Usare sempre connessioni sicure per impedire attacchi "Man-in-the-Middle".
2.  **Evitare `eval()`**: Questa funzione esegue stringhe come codice e rappresenta un enorme rischio di sicurezza.
3.  **Cookies Sicuri**: Usare i flag `Secure` (solo HTTPS) e `HttpOnly` (non accessibile da JavaScript) per i cookies di sessione.
4.  **Validazione Duplicata**: Validare i dati sia lato client (per UX) che lato server (per sicurezza reale).

---