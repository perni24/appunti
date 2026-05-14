---
date: 2026-05-14
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [react, frontend, javascript]
aliases: [Suspense e Lazy Loading]
prerequisites: []
related: []
---
# Suspense e Lazy Loading

## Sintesi

Nota su Suspense e Lazy Loading in React. Riassume il concetto, quando usarlo, i punti critici e gli errori da evitare durante sviluppo, debugging o revisione di applicazioni React.

**Suspense** e **Lazy Loading** sono strumenti React usati per migliorare il caricamento dell'interfaccia, rimandando il rendering di parti dell'applicazione finche il relativo codice o i dati necessari non sono pronti.

Nel caso piu comune:
- `React.lazy()` carica un componente in modo lazy;
- `<Suspense>` mostra una fallback UI mentre quel componente non e ancora disponibile.

> [!INFO] Obiettivo del pattern
> Suspense e Lazy Loading servono a ridurre il carico iniziale dell'applicazione e a distribuire meglio il costo del rendering, migliorando la percezione di performance.

---

## 1. Il problema che risolvono

In una SPA React, tutto il codice puo finire nel bundle iniziale. Questo crea due problemi:
- tempo di download maggiore;
- tempo di parsing ed esecuzione piu alto;
- peggioramento della first render experience.

Se invece alcune sezioni vengono caricate solo quando servono, il bundle iniziale puo restare piu leggero.

Esempio tipico:
- una pagina di analytics;
- una modal complessa;
- un editor avanzato;
- componenti admin usati raramente.

---

## 2. Lazy Loading con `React.lazy`

Il lazy loading di un componente si ottiene con `React.lazy`.

```javascript
import React, { lazy } from 'react';

const SettingsPage = lazy(() => import('./SettingsPage'));
```

In questo modo React carica il modulo solo quando il componente deve essere davvero renderizzato.

### Uso con `Suspense`

```javascript
import React, { Suspense, lazy } from 'react';

const SettingsPage = lazy(() => import('./SettingsPage'));

function App() {
  return (
    <Suspense fallback={<p>Caricamento...</p>}>
      <SettingsPage />
    </Suspense>
  );
}
```

Finche il modulo non e pronto, React mostra il fallback.

---

## 3. Come funziona `Suspense`

`Suspense` non carica nulla da solo. E un boundary che dice a React:

"Se un componente figlio non e ancora pronto, mostra questo fallback temporaneo."

Quindi:
- `React.lazy` o un'altra risorsa sospende;
- `Suspense` intercetta quella sospensione;
- viene mostrata la fallback UI;
- appena la risorsa e pronta, React renderizza il contenuto reale.

Dal punto di vista architetturale, `Suspense` e una strategia di orchestrazione del rendering asincrono.

---

## 4. Esempio pratico: route o sezione pesante

```javascript
import React, { Suspense, lazy } from 'react';

const AdminPanel = lazy(() => import('./AdminPanel'));

function Dashboard({ isAdmin }) {
  return (
    <div>
      <h1>Dashboard</h1>

      {isAdmin && (
        <Suspense fallback={<p>Caricamento pannello admin...</p>}>
          <AdminPanel />
        </Suspense>
      )}
    </div>
  );
}
```

Qui il pannello admin viene caricato solo se serve davvero.

Questo si integra bene con il [[Programmazione/React/Pagine/Rendering Condizionale e Liste]].

---

## 5. Code Splitting

Il lazy loading e una forma di **code splitting**: il bundle viene spezzato in chunk piu piccoli.

Invece di spedire tutto subito:
- il bundle iniziale contiene solo il necessario;
- i chunk secondari vengono scaricati quando richiesti.

Questo riduce il costo iniziale ma introduce una fase di attesa al primo accesso al componente lazy.

> [!TIP] Regola pratica
> Il lazy loading ha senso per parti pesanti, rare o secondarie dell'app. Non sempre conviene spezzare componenti piccoli o usati immediatamente all'avvio.

---

## 6. Suspense vs Error Boundaries

`Suspense` e `Error Boundaries` risolvono problemi diversi:

| Strumento | Gestisce | Output |
| :--- | :--- | :--- |
| **Suspense** | attesa di codice o risorse | fallback temporaneo |
| **Error Boundary** | errore nel rendering | fallback di errore |

Molto spesso conviene combinarli:

```jsx
<ErrorBoundary>
  <Suspense fallback={<p>Caricamento...</p>}>
    <LazyWidget />
  </Suspense>
</ErrorBoundary>
```

Questo collega direttamente il pattern a [[Programmazione/React/Pagine/Error Boundaries]].

---

## 7. Relazione con rendering concorrente

In React moderno, `Suspense` si inserisce bene nella strategia di rendering concorrente e si collega ai concetti di [[Programmazione/React/Pagine/useTransition e useDeferredValue]].

In pratica:
- `Suspense` gestisce stati di attesa visuali;
- `useTransition` aiuta a marcare aggiornamenti come non urgenti;
- insieme possono migliorare molto la UX di caricamento.

Non sono però la stessa cosa:
- `Suspense` gestisce il fallback durante una sospensione;
- `useTransition` gestisce la priorita dell'aggiornamento.

---

## 8. Limiti e tradeoff

Suspense e Lazy Loading non sono gratis.

### Vantaggi
- bundle iniziale piu leggero;
- caricamento progressivo delle feature;
- UX migliore in app complesse;
- piu controllo sui punti di fallback.

### Svantaggi
- piu complessita architetturale;
- rischio di fallback UI troppo invasive;
- possibile frammentazione eccessiva dei chunk;
- primo accesso al componente lazy piu lento.

### Rischio comune
Spezzare troppo il codice puo peggiorare la UX invece di migliorarla, soprattutto se ogni piccolo componente introduce il proprio caricamento.

> [!WARNING] Over-splitting
> Non ogni componente deve diventare lazy. Se il componente e piccolo o subito necessario al bootstrap della pagina, il lazy loading puo aggiungere overhead inutile.

---

## 9. Best Practices

1. **Usa `React.lazy` per sezioni pesanti o rare:** pannelli admin, editor, analytics, moduli secondari.
2. **Posiziona `Suspense` vicino al punto giusto di fallback:** evita che un fallback piccolo oscuri parti troppo grandi della UI.
3. **Combina `Suspense` con Error Boundaries:** attesa e fallimento vanno gestiti separatamente.
4. **Mantieni i fallback semplici e coerenti:** loading state chiari, non rumorosi.
5. **Non spezzare tutto automaticamente:** il code splitting va guidato da uso reale e peso del codice.
6. **Pensa alla UX del primo accesso:** lazy loading migliora il bootstrap, ma sposta il costo al primo utilizzo del chunk.

---
