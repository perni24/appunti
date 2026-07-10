---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [react, security, xss]
aliases: [Protezione XSS, Sanitizzazione HTML]
prerequisites: []
related: []
---

# Protezione XSS

## Sintesi

XSS e l'esecuzione di script malevoli nel browser della vittima. React riduce molti rischi escapando i valori renderizzati in JSX, ma non elimina il problema: HTML inserito manualmente, URL pericolosi, dipendenze e contenuti esterni restano rischi reali.

## Quando usarlo

Ogni app React che mostra input utente, markdown, HTML, link esterni, contenuti CMS o dati non fidati deve considerare XSS.

## Come funziona

Sicuro:

```jsx
<p>{userInput}</p>
```

React renderizza testo escaped.

Rischioso:

```jsx
<div dangerouslySetInnerHTML={{ __html: html }} />
```

Qui devi sanitizzare prima.

## API / Sintassi

Sanitizzazione concettuale:

```jsx
const safeHtml = sanitizeHtml(untrustedHtml);

return <div dangerouslySetInnerHTML={{ __html: safeHtml }} />;
```

Link:

```jsx
<a href={safeUrl} rel="noreferrer">Apri</a>
```

## Esempio pratico

Per markdown utente:

1. converti markdown in HTML;
2. sanitizza HTML con libreria affidabile;
3. limita tag e attributi ammessi;
4. applica CSP;
5. testa payload XSS noti.

## Varianti

- **Escaping automatico JSX**: protezione base.
- **Sanitizzazione HTML**: necessaria per HTML non fidato.
- **CSP**: riduce impatto di script iniettati.
- **URL validation**: blocca schemi pericolosi.
- **Trusted Types**: ulteriore controllo in contesti avanzati.

## Errori comuni

- Usare `dangerouslySetInnerHTML` senza sanitizzazione.
- Fidarsi di HTML da CMS o backend.
- Non validare URL.
- Salvare token accessibili a script se non necessario.
- Disabilitare regole lint o CSP per comodita.
- Pensare che React renda XSS impossibile.

## Checklist

- I dati visualizzati sono fidati?
- Uso HTML raw?
- L'HTML viene sanitizzato?
- I link sono validati?
- CSP e configurata?
- Token e dati sensibili sono esposti a JavaScript?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[Programmazione/React/Pagine/Content Security Policy|Content Security Policy]]
- [[Gestione Autenticazione]]
- [[Validazione Dati]]
- [[CSRF]]
