---
date: 2026-05-14
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [react, frontend, javascript]
aliases: [Internazionalizzazione]
prerequisites: []
related: []
---
# Internazionalizzazione

## Sintesi

Nota su Internazionalizzazione in React. Riassume il concetto, quando usarlo, i punti critici e gli errori da evitare durante sviluppo, debugging o revisione di applicazioni React.

La **internazionalizzazione** (**i18n**, da *internationalization*) e il processo con cui un'applicazione viene progettata per supportare piu lingue, formati e convenzioni locali senza dover riscrivere i componenti.

In React, questo tema non riguarda solo la traduzione delle stringhe, ma anche:
- date;
- orari;
- numeri;
- valute;
- pluralizzazione;
- direzione del testo;
- gestione della lingua nella navigazione e nel caricamento dei contenuti.

> [!INFO] Punto chiave
> Tradurre il testo non basta. Una UI internazionale deve adattarsi anche al modo in cui utenti diversi leggono, interpretano e formattano i dati.

---

## 1. i18n vs l10n

Conviene distinguere due concetti:

### Internazionalizzazione (i18n)
Preparare il codice e l'architettura per supportare piu lingue e locali.

### Localizzazione (l10n)
Adattare concretamente il contenuto a una lingua o regione specifica.

Esempi di localizzazione:
- traduzione in italiano o inglese;
- formato data `22/04/2026` vs `04/22/2026`;
- valuta `EUR 12,50` vs `$12.50`;
- uso corretto di plurali e formati numerici.

In pratica:
- i18n e la struttura;
- l10n e l'adattamento concreto.

---

## 2. Perche serve

Senza una strategia di internazionalizzazione, il codice tende a riempirsi di stringhe hardcoded:

```javascript
<button>Save</button>
```

Questo crea problemi:
- difficile tradurre;
- difficile mantenere coerenza tra pagine;
- impossibile cambiare lingua in modo strutturato;
- rischio di formati errati per date e valute.

Una strategia i18n permette invece di:
- centralizzare il testo;
- gestire piu lingue;
- evitare duplicazione;
- adattare meglio l'app a mercati e utenti diversi.

---

## 3. Stringhe tradotte

La forma piu basilare di i18n e spostare il testo fuori dal componente e risolverlo tramite chiavi.

Concettualmente:

```javascript
{
  "login.button": "Accedi"
}
```

Nel componente:

```javascript
<button>{t("login.button")}</button>
```

Questo approccio rende possibile:
- cambiare lingua;
- mantenere i testi in file dedicati;
- evitare testo hardcoded nel markup.

---

## 4. react-i18next

**react-i18next** e una delle librerie piu usate per l'internazionalizzazione in React.

Si basa sul progetto `i18next` e fornisce integrazione React tramite hook e provider.

Esempio concettuale:

```javascript
import { useTranslation } from "react-i18next";

function LoginButton() {
  const { t } = useTranslation();

  return <button>{t("login.button")}</button>;
}
```

Vantaggi pratici:
- hook semplice da usare;
- gestione di namespace e risorse tradotte;
- cambio lingua runtime;
- supporto a interpolazione e pluralizzazione.

---

## 5. Cambio lingua

Una buona integrazione i18n deve permettere di cambiare lingua senza riscrivere i componenti.

Esempio concettuale:

```javascript
import i18n from "i18next";

function LanguageSwitcher() {
  return (
    <>
      <button onClick={() => i18n.changeLanguage("it")}>IT</button>
      <button onClick={() => i18n.changeLanguage("en")}>EN</button>
    </>
  );
}
```

Questo apre poi domande architetturali importanti:
- dove salvare la lingua scelta;
- come inizializzarla;
- come leggerla da route, cookie o localStorage;
- come sincronizzarla con il backend o con la preferenza utente.

Qui il tema puo collegarsi a [[Programmazione/React/Pagine/React Router]] e a sistemi di persistenza leggeri.

---

## 6. Interpolazione e pluralizzazione

Tradurre non significa solo sostituire stringhe statiche.

Spesso serve interpolare valori:

```javascript
t("welcome", { name: "Luca" })
```

oppure gestire plurali:

```javascript
t("cart.items", { count: 3 })
```

Questi casi sono importanti perche le regole grammaticali cambiano tra lingue diverse. Una soluzione i18n seria deve supportarle nativamente, altrimenti il testo diventa rapidamente fragile o innaturale.

---

## 7. Date, numeri e valute

Una parte importante della localizzazione riguarda i formati dei dati, non solo le parole.

Esempi:
- `22/04/2026` vs `04/22/2026`
- `1.234,56` vs `1,234.56`
- `EUR 12,50` vs `$12.50`

In JavaScript e spesso utile usare `Intl`:

```javascript
const formattedDate = new Intl.DateTimeFormat("it-IT").format(new Date());
const formattedPrice = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR"
}).format(12.5);
```

Questa parte e fondamentale, perche una UI tradotta ma con formati sbagliati continua a sembrare "straniera" all'utente.

---

## 8. Namespace e organizzazione delle traduzioni

Quando il progetto cresce, conviene organizzare le traduzioni in modo coerente.

Strategie comuni:
- file per lingua;
- file per feature;
- namespace separati per aree dell'app.

Esempio concettuale:
- `common`
- `auth`
- `dashboard`
- `errors`

Questo evita file enormi e rende piu semplice trovare e mantenere le chiavi.

Una cattiva organizzazione delle traduzioni porta rapidamente a:
- chiavi duplicate;
- naming incoerente;
- difficolta nel riuso.

---

## 9. i18n e data fetching

L'internazionalizzazione puo influenzare anche il caricamento dati:
- contenuti remoti in lingua diversa;
- route o endpoint localizzati;
- fetch delle risorse di traduzione;
- invalidazione della cache quando cambia locale.

Per questo puo collegarsi a [[Programmazione/React/Pagine/Data Fetching e Cache]], soprattutto se:
- la lingua influisce sulle query;
- il backend restituisce contenuti localizzati;
- alcune risorse vanno ricaricate al cambio lingua.

---

## 10. Routing e URL localizzate

In alcune applicazioni la lingua compare anche nella URL:

```text
/it/prodotti
/en/products
```

Questo approccio puo essere utile per:
- SEO;
- condivisione di link corretti;
- gestione esplicita del contesto lingua;
- allineamento con [[Programmazione/React/Pagine/React Router]].

Ma introduce anche piu complessita:
- mapping delle route;
- redirect iniziali;
- sincronizzazione tra URL e locale attivo.

Non sempre serve, ma in prodotti pubblici multi-lingua puo avere molto senso.

---

## 11. Accessibilita e testo

Una buona internazionalizzazione deve considerare anche:
- attributo `lang`;
- leggibilita dei messaggi;
- lunghezza diversa delle traduzioni;
- direzione del testo in lingue RTL;
- etichette accessibili coerenti con la lingua attiva.

Se l'interfaccia e progettata assumendo sempre testi corti in una sola lingua, il layout puo rompersi rapidamente quando cambia locale.

Quindi i18n ha anche implicazioni di layout e design, non solo di contenuto.

---

## 12. Errori comuni

Errori frequenti:
- stringhe hardcoded nei componenti;
- chiavi poco chiare o duplicate;
- formati data/valuta non localizzati;
- testo concatenato in modo fragile;
- validazione o messaggi di errore non tradotti;
- ignorare testo piu lungo in altre lingue.

Esempio fragile:

```javascript
"Hello " + userName
```

Meglio usare interpolazione nella libreria i18n, per lasciare flessibilita alla struttura grammaticale della lingua.

---

## 13. Best Practices

1. **Non hardcodare testo nei componenti:** usa chiavi e risorse dedicate.
2. **Distingui traduzione da localizzazione:** date, numeri e valute sono parte del problema.
3. **Usa `react-i18next` o una soluzione equivalente quando l'app cresce:** gestire tutto a mano scala male.
4. **Progetta naming e namespace delle chiavi con criterio:** l'ordine iniziale evita caos futuro.
5. **Testa layout e UX in piu lingue:** il testo cambia lunghezza e puo rompere componenti o gerarchie visive.
6. **Ricorda che la validazione finale resta anche lato backend:** lingua e messaggi possono cambiare, ma le regole di dominio devono restare coerenti.

---
