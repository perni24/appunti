---
date: 2026-02-24
tags: [javascript, web-api, storage, cookies]
type: #permanent-note
status: budding
---

# Browser Storage in JavaScript

Le applicazioni web moderne hanno spesso bisogno di salvare dati localmente nel browser per migliorare le performance o mantenere lo stato dell'utente. Esistono diverse tecnologie per farlo, ognuna con scopi e limiti differenti.

## 1. Web Storage API

È il modo più semplice e comune per memorizzare dati (solo stringhe) sotto forma di coppie chiave-valore.

### LocalStorage
I dati salvati in `localStorage` non hanno scadenza: rimangono nel browser anche dopo la chiusura della scheda o del browser stesso.
- **Capacità**: Circa 5-10MB.
- **Scope**: Per Domain (stessa origine).

```javascript
localStorage.setItem('tema', 'dark');
const tema = localStorage.getItem('tema');
localStorage.removeItem('tema');
localStorage.clear(); // Svuota tutto lo storage del dominio
```

### SessionStorage
Identico a LocalStorage nell'API, ma i dati vengono eliminati alla chiusura della scheda (sessione del tab).
- **Utilizzo**: Dati temporanei che servono solo per la navigazione attuale.

## 2. Cookies

Sono la forma più antica di storage. A differenza del Web Storage, i cookies possono essere inviati automaticamente al server ad ogni richiesta HTTP.
- **Capacità**: Molto limitata (~4KB).
- **Scadenza**: Può essere impostata manualmente.
- **Sicurezza**: Supportano parametri come `HttpOnly` (non accessibile da JS) e `Secure` (solo HTTPS).

```javascript
document.cookie = "username=Luca; expires=Thu, 18 Dec 2026 12:00:00 UTC; path=/";
```

## 3. IndexedDB

È un database NoSQL transazionale integrato nel browser. È molto più complesso del Web Storage ma permette di gestire enormi quantità di dati strutturati (oggetti, file, blob).
- **Capacità**: Quasi illimitata (dipende dal disco).
- **Async**: Funziona in modo asincrono per non bloccare il thread principale.

## 4. Tabella Comparativa

| Caratteristica | LocalStorage | SessionStorage | Cookies | IndexedDB |
| :--- | :--- | :--- | :--- | :--- |
| **Durata** | Permanente | Fine Sessione (Tab) | Impostabile | Permanente |
| **Capacità** | ~5-10 MB | ~5-10 MB | ~4 KB | Quasi Illimitata |
| **Inviato a Server**| No | No | Sì | No |
| **API** | Semplice (Sincrona) | Semplice (Sincrona) | Complessa | Complessa (Asincrona) |

> [!CAUTION] Sicurezza dei Dati
> Non memorizzare **MAI** dati sensibili (password, token JWT non protetti, dati personali) in `localStorage` o `sessionStorage`, poiché sono vulnerabili agli attacchi **XSS** (Cross-Site Scripting).

---
