---
date: 2026-04-17
tags: [react, error-boundaries, frontend, error-handling, javascript]
type: #permanent-note
status: budding
---

# Error Boundaries

Gli **Error Boundaries** sono componenti React che intercettano errori JavaScript lanciati durante il rendering, nei lifecycle methods e nei costruttori dei componenti figli.

Servono a evitare che un errore in una parte dell'interfaccia faccia crollare l'intera applicazione React senza alcun fallback visibile.

> [!INFO] Obiettivo del pattern
> Un Error Boundary non "risolve" l'errore: impedisce che l'intera UI si rompa senza controllo, mostrando invece una fallback UI piu gestibile.

---

## 1. Il problema che risolvono

Senza un error boundary, un errore non gestito nel rendering di un componente React puo far fallire tutto il sottoalbero coinvolto, e in molti casi portare allo smontaggio dell'intera UI.

Esempio:

```jsx
function BuggyComponent() {
  throw new Error('Errore durante il rendering');
}
```

Se questo componente viene renderizzato senza protezioni, l'app puo rompersi in modo brusco.

Con un error boundary, invece, si puo mostrare un fallback:

```jsx
<ErrorBoundary>
  <BuggyComponent />
</ErrorBoundary>
```

---

## 2. Come si implementano

In React, un Error Boundary classico e ancora un **componente a classe**.

Questo e uno dei pochi casi moderni in cui i class component restano rilevanti. Si collega direttamente a [[Componenti Funzionali vs Componenti a Classe]].

### Struttura base

```javascript
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Errore intercettato:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Qualcosa e andato storto.</h1>;
    }

    return this.props.children;
  }
}
```

---

## 3. I due metodi chiave

### `getDerivedStateFromError`
E un metodo statico che viene usato per aggiornare lo stato dopo un errore.

Scopo tipico:
- impostare un flag come `hasError`;
- passare a una fallback UI.

### `componentDidCatch`
Viene chiamato dopo che l'errore e stato intercettato.

Scopo tipico:
- logging;
- invio dell'errore a servizi esterni;
- raccolta di stack trace e contesto.

Esempio:

```javascript
componentDidCatch(error, errorInfo) {
  logErrorToService(error, errorInfo);
}
```

Questa parte si collega al tema del [[Logging]].

---

## 4. Cosa intercettano davvero

Gli Error Boundaries intercettano errori che avvengono:
- durante il rendering;
- nei lifecycle methods;
- nei costruttori dei componenti figli.

### Cosa NON intercettano
Non intercettano errori che avvengono:
- negli event handler;
- nel codice asincrono (`setTimeout`, promise, fetch);
- nel server-side rendering;
- dentro l'error boundary stesso.

> [!WARNING] Limite importante
> Gli Error Boundaries non sono un equivalente universale di `try/catch`. Servono per errori nella fase di rendering React, non per ogni tipo di eccezione dell'applicazione.

---

## 5. Esempio pratico

```javascript
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <p>Impossibile mostrare questo contenuto.</p>;
    }

    return this.props.children;
  }
}

function UserProfile({ user }) {
  return <h2>{user.name.toUpperCase()}</h2>;
}
```

Utilizzo:

```jsx
<ErrorBoundary>
  <UserProfile user={null} />
</ErrorBoundary>
```

In questo caso l'errore causato da `user.name` non valido viene intercettato e sostituito da una fallback UI.

---

## 6. Dove posizionarli

Gli Error Boundaries possono essere usati a livelli diversi dell'applicazione.

### Boundary globale
Protegge quasi tutta l'app.

```jsx
<AppErrorBoundary>
  <App />
</AppErrorBoundary>
```

### Boundary locali
Proteggono solo sezioni piu fragili o indipendenti, ad esempio:
- dashboard widgets;
- moduli caricati dinamicamente;
- pannelli complessi;
- integrazioni terze parti.

Questo approccio e spesso migliore, perche limita il danno e preserva il resto dell'interfaccia.

> [!TIP] Regola pratica
> Meglio piu boundary ben posizionati che un unico boundary gigantesco che copre tutto senza distinzione.

---

## 7. Error Boundaries vs `try/catch`

| Meccanismo | Dove funziona | Quando usarlo |
| :--- | :--- | :--- |
| **`try/catch`** | Codice imperativo e sincrono | Logica normale JavaScript |
| **Error Boundary** | Rendering e lifecycle React | Proteggere UI da crash di rendering |

Quindi:
- usa `try/catch` per operazioni imperative e asincrone;
- usa error boundaries per isolare crash del rendering.

---

## 8. Error Boundaries e componenti funzionali

Anche se React moderno usa quasi sempre componenti funzionali, l'implementazione classica degli error boundaries e ancora basata su classi.

Per chi vuole una API piu moderna, esistono librerie come `react-error-boundary` che rendono l'uso piu ergonomico in contesti funzionali.

Esempio concettuale:

```jsx
<ErrorBoundary fallback={<p>Errore nel widget</p>}>
  <Widget />
</ErrorBoundary>
```

Il principio resta lo stesso: isolare il crash e mostrare un fallback.

---

## 9. Best Practices

1. **Usa gli error boundaries per sezioni UI importanti ma isolate:** widget, panel, moduli complessi, pagine secondarie.
2. **Mostra fallback UI chiare:** l'utente deve capire che qualcosa e fallito, non vedere uno schermo vuoto.
3. **Registra gli errori in `componentDidCatch`:** un boundary senza logging ti nasconde il problema ma non ti aiuta a risolverlo.
4. **Non affidarti agli error boundaries per errori asincroni:** per quelli servono strategie diverse.
5. **Evita fallback troppo generici ovunque:** se possibile, differenzia i fallback in base al contesto.
6. **Non mettere tutta l'app sotto un unico boundary senza motivo:** boundary piu granulari offrono recovery piu utile.

---
