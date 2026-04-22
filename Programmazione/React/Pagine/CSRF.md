---
date: 2026-04-22
tags: [react, security, csrf, cookies, httpOnly, sameSite, frontend, javascript]
type: #permanent-note
status: budding
---

# CSRF

La **CSRF** (**Cross-Site Request Forgery**) e un attacco in cui un sito malevolo induce il browser dell'utente autenticato a inviare richieste indesiderate verso un'altra applicazione.

Il punto chiave e che il browser puo allegare automaticamente credenziali valide, come cookie di sessione, anche se l'utente non intende compiere quell'azione.

> [!INFO] Punto chiave
> La CSRF non ruba direttamente il login. Sfrutta una sessione gia valida per far eseguire al browser richieste non volute.

---

## 1. Come funziona l'attacco

Scenario tipico:
- l'utente e autenticato su `app.example.com`;
- il browser conserva cookie validi per quel dominio;
- l'utente visita un sito malevolo;
- il sito malevolo induce il browser a inviare una richiesta verso `app.example.com`.

Se il server accetta quella richiesta solo perche il cookie e valido, l'azione puo andare a buon fine:
- cambio email;
- cambio password;
- acquisto;
- modifica impostazioni;
- logout forzato;
- qualsiasi azione sensibile esposta dall'applicazione.

Il browser, dal punto di vista tecnico, non sta "barando": sta solo inviando cookie associati al dominio target.

---

## 2. Quando il rischio e alto

La CSRF e particolarmente rilevante quando l'autenticazione usa:
- cookie di sessione;
- cookie `HttpOnly`;
- meccanismi in cui il browser allega automaticamente credenziali.

Il rischio e invece diverso quando l'autenticazione usa token esplicitamente inviati in header `Authorization` dal codice client, perche il browser non li aggiunge da solo in una richiesta cross-site arbitraria.

Questa e una delle ragioni per cui la CSRF si collega strettamente a [[Gestione Autenticazione]].

---

## 3. CSRF vs XSS

CSRF e XSS sono problemi diversi.

### CSRF
L'attaccante sfrutta il browser dell'utente autenticato per inviare richieste non volute.

### XSS
L'attaccante riesce a eseguire codice dentro il contesto della tua applicazione.

Differenza pratica:
- CSRF sfrutta l'autenticazione automatica del browser;
- XSS sfrutta l'esecuzione di script malevoli nella pagina.

Si collegano, ma non vanno confusi. Una buona nota di riferimento qui e [[Protezione XSS]].

---

## 4. Perche il frontend da solo non basta

Il frontend React puo contribuire alla difesa, ma la mitigazione reale della CSRF e soprattutto un problema di backend e configurazione HTTP.

Il motivo e semplice:
- la verifica finale della richiesta avviene lato server;
- il server decide se una richiesta autenticata e lecita o sospetta;
- il client non puo essere l'unico punto di fiducia.

Il frontend puo:
- inviare token CSRF;
- rispettare il flusso previsto;
- non introdurre eccezioni pericolose.

Ma il controllo reale resta lato server.

---

## 5. SameSite cookies

Una difesa molto importante e l'attributo `SameSite` dei cookie.

Valori tipici:
- `Strict`
- `Lax`
- `None` (da usare insieme a `Secure`)

Effetto pratico:
- limita quando il browser allega cookie in contesti cross-site;
- riduce molti scenari CSRF;
- aggiunge una difesa di base molto utile.

In molti casi moderni, `SameSite=Lax` o `SameSite=Strict` abbassano molto il rischio.

> [!WARNING] Non e una bacchetta magica
> `SameSite` aiuta molto, ma non sostituisce una strategia completa se l'applicazione espone operazioni sensibili o usa configurazioni cross-site particolari.

---

## 6. CSRF token

Una strategia classica e usare un **CSRF token**.

L'idea e questa:
- il server genera un token anti-CSRF;
- il frontend lo recupera in modo legittimo;
- il token viene inviato nelle richieste sensibili;
- il server verifica che sia presente e corretto.

Questo funziona perche un sito esterno malevolo non dovrebbe poter conoscere o costruire quel token valido.

Esempio concettuale:

```http
X-CSRF-Token: abc123
```

Il browser puo inviare automaticamente il cookie, ma non puo inventare correttamente anche il token protettivo senza passare dal flusso previsto.

---

## 7. Double Submit Cookie e strategie simili

Un pattern comune e il **double submit cookie**:
- il server invia un cookie con valore anti-CSRF;
- il frontend legge o riceve quel valore in modo consentito;
- lo rimanda in un header o nel body;
- il server verifica che i valori combacino.

Esistono varianti architetturali, ma il principio resta simile:
- non fidarti solo del fatto che il cookie di sessione esista;
- richiedi anche una prova aggiuntiva che la richiesta arrivi dal flusso applicativo legittimo.

---

## 8. Request methods e rischio reale

In generale:
- richieste `GET` dovrebbero essere sicure e non cambiare stato;
- richieste `POST`, `PUT`, `PATCH`, `DELETE` sono le piu sensibili per CSRF.

Se un endpoint muta stato via `GET`, stai gia creando un problema di design HTTP prima ancora della sicurezza.

Quindi una parte della difesa consiste anche nel rispettare correttamente la semantica delle API.

---

## 9. Fetch, credenziali e frontend React

Nel frontend React, una richiesta autenticata cookie-based puo apparire cosi:

```javascript
fetch("/api/profile", {
  method: "POST",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
    "X-CSRF-Token": csrfToken
  },
  body: JSON.stringify(payload)
});
```

Il punto importante e capire che:
- `credentials: "include"` abilita l'invio dei cookie;
- se l'architettura e cookie-based, devi pensare anche alla difesa CSRF;
- il frontend deve seguire il protocollo di sicurezza previsto dal server.

---

## 10. HttpOnly cookies e CSRF

I cookie `HttpOnly` migliorano la difesa contro il furto via JavaScript in molti scenari XSS, ma non eliminano automaticamente la CSRF.

Anzi, proprio perche il browser li invia da solo, il tema CSRF resta molto rilevante nelle architetture cookie-based.

Quindi:
- `HttpOnly` aiuta contro furto del token via script;
- `SameSite`, CSRF token e controlli server aiutano contro richieste cross-site non volute.

Sono difese complementari, non alternative.

---

## 11. Controlli lato server utili

Oltre ai token CSRF, il server puo controllare:
- header `Origin`;
- header `Referer` in alcuni contesti;
- metodo HTTP corretto;
- presenza di header custom attesi;
- validita della sessione.

Il frontend non deve implementare tutta questa logica, ma deve sapere che la difesa seria non si esaurisce nel componente React.

---

## 12. Errori comuni

Errori frequenti:
- pensare che `HttpOnly` risolva da solo la CSRF;
- non usare `SameSite` quando l'architettura lo permetterebbe;
- esporre azioni sensibili senza token anti-CSRF;
- usare `GET` per operazioni che cambiano stato;
- delegare tutta la sicurezza al frontend;
- confondere CSRF e XSS.

Questi errori spesso nascono da una comprensione incompleta del comportamento automatico del browser.

---

## 13. Best Practices

1. **Considera la CSRF soprattutto quando usi autenticazione cookie-based:** li il browser allega credenziali automaticamente.
2. **Usa `SameSite` in modo corretto:** e una difesa semplice ma molto utile.
3. **Aggiungi token anti-CSRF o strategia equivalente per azioni sensibili:** il solo cookie di sessione non basta.
4. **Mantieni `GET` idempotente e senza effetti collaterali:** riduce superficie d'attacco e ambiguita.
5. **Non confondere CSRF e XSS:** richiedono difese diverse, anche se entrambe toccano la sicurezza frontend.
6. **Ricorda che la verifica finale e sempre lato server:** React puo partecipare al flusso, ma non fare enforcement autonomo della sicurezza.

---
