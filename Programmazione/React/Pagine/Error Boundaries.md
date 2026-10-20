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
  - error-handling
  - architecture
aliases:
  - Error Boundaries
  - Error handling globale
  - Boundary UI
prerequisites:
  - "[[Programmazione/React/Pagine/Componenti Funzionali vs Componenti a Classe|Componenti Funzionali vs Componenti a Classe]]"
related:
  - "[[Programmazione/React/Pagine/Suspense e Lazy Loading|Suspense e Lazy Loading]]"
title: Error Boundaries
---

# Error Boundaries

## Sintesi

Un Error Boundary sostituisce con un fallback un sottoalbero React che fallisce durante il rendering o altre fasi gestite da React. Permette di isolare un pannello guasto mantenendo utilizzabili le sezioni esterne.

Non e un `try/catch` globale, non valida dati di dominio e non recupera automaticamente una richiesta HTTP. Gli errori previsti vanno rappresentati nello stato dell'applicazione; il boundary gestisce soprattutto errori che impediscono di renderizzare quella UI.

## Quando usarlo

Posizionalo intorno a route, widget di terze parti, pannelli indipendenti e sezioni caricate lazy. Il confine dovrebbe corrispondere a un'area in cui un fallback ha senso: un solo boundary globale puo essere troppo ampio, uno per ogni elemento troppo frammentato.

## Come funziona

| Origine | Boundary client |
| --- | --- |
| Render, constructor e lifecycle di un discendente | Si |
| Errore sincrono in un effect gestito da React | Si |
| Eccezione direttamente in un event handler | No |
| Callback `setTimeout` o Promise rifiutata non integrata con React | No |
| Errore nel boundary stesso o nel suo fallback | Serve un boundary superiore |
| Rendering sul server | Non viene gestito da questa classe client |
| Errore rilanciato durante render da `lazy` o `use` | Puo raggiungere il boundary |

In React 19, anche gli errori nelle Actions delle transition gestite con `useTransition` possono raggiungere il boundary. Quindi "nessun errore async viene catturato" e una semplificazione scorretta: conta **come React riceve l'errore**, non soltanto se e coinvolta una Promise.

Un `try/catch` attorno a `return <Child />` non cattura il render successivo di `Child`: in quel punto si sta creando un elemento, non eseguendo il discendente.

## API / Sintassi

React non espone un Hook equivalente per definire direttamente un boundary: si usa una classe oppure un componente fornito da una libreria/framework.

- `static getDerivedStateFromError(error)` decide lo stato di fallback; deve restare puro.
- `componentDidCatch(error, info)` e adatto alla segnalazione; `info.componentStack` descrive il percorso dei componenti.
- Il fallback deve essere semplice e robusto. Non dipendere dagli stessi dati o servizi appena falliti.
- In React 19 i callback di root `onCaughtError`, `onUncaughtError` e `onRecoverableError` possono centralizzare il reporting, ma non sostituiscono la UI di un boundary. Evita invii duplicati tra root e `componentDidCatch`.

## Esempio pratico

### Isolamento e recupero

Modulo completo. `renderFallback` e `onError` sono props definite da questo esempio, non nomi riservati di React. Il pulsante di recupero corregge la causa simulata prima di riprovare il sottoalbero.

```jsx
import { Component, useState } from "react";

export class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    this.props.onError?.(error, info);
  }

  reset = () => this.setState({ hasError: false });

  render() {
    return this.state.hasError
      ? this.props.renderFallback({ reset: this.reset })
      : this.props.children;
  }
}

export function CounterPanel({ broken }) {
  const [count, setCount] = useState(0);
  if (broken) throw new Error("Guasto dimostrativo del pannello");
  return (
    <button type="button" onClick={() => setCount(n => n + 1)}>
      Conteggio: {count}
    </button>
  );
}

export default function BoundaryDemo({ onError = console.error }) {
  const [broken, setBroken] = useState(false);
  return (
    <>
      <label>Nota esterna <input /></label>
      <button type="button" onClick={() => setBroken(true)}>Simula guasto</button>
      <ErrorBoundary onError={onError} renderFallback={({ reset }) => (
        <section aria-label="Pannello non disponibile">
          <p role="alert">Il pannello non e disponibile.</p>
          <button type="button" onClick={() => { setBroken(false); reset(); }}>
            Ripristina pannello
          </button>
        </section>
      )}>
        <CounterPanel broken={broken} />
      </ErrorBoundary>
    </>
  );
}
```

La nota esterna conserva il contenuto, mentre il contatore viene smontato e riparte da zero dopo il recupero. Il reset del boundary non ripristina lo stato precedente dei discendenti.

Se chiami solo `reset()` senza correggere la causa, il figlio puo fallire di nuovo immediatamente. Anche cambiare la `key` del boundary lo rimonta, ma non ripara dati invalidi o una cache che continua a rilanciare lo stesso errore. Con un framework o una libreria di fetching segui anche la loro procedura di retry/reset.

### Errori previsti negli handler

Modulo indipendente: `save` e una funzione asincrona fornita dal chiamante. L'handler attende la Promise dentro il `try/catch`; il fallimento resta locale, senza interrompere il resto della pagina.

```jsx
import { useState } from "react";

export function SaveButton({ save }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function handleSave() {
    setPending(true);
    setMessage("");
    try {
      await save();
      setMessage("Salvataggio completato");
    } catch {
      setMessage("Salvataggio non riuscito. Riprova.");
    } finally {
      setPending(false);
    }
  }
  return <>
    <button type="button" disabled={pending} onClick={handleSave}>Salva</button>
    <p role="status">{message}</p>
  </>;
}
```

Un errore di validazione, un 404 atteso o un problema di rete non devono per forza diventare eccezioni di rendering. Se `save` usa `fetch`, deve verificare anche `response.ok`: gli status HTTP di errore non fanno rifiutare automaticamente la Promise.

## Varianti

- **Globale e locale**: un boundary superiore puo proteggere anche dal fallimento di un fallback locale.
- **Per route**: un boundary React generico non gestisce automaticamente loader e action di un router. Usa anche le API di errore del router scelto.
- **Suspense**: il fallback di caricamento e distinto da quello di errore. Non qualsiasi `fetch` in un effect attiva Suspense.
- **SSR streaming**: il renderer e il framework hanno protocolli propri; Suspense puo gestire alcuni errori server e ritentare sul client. Non significa che `componentDidCatch` venga eseguito sul server.
- **Reporting**: in produzione usa un servizio affidabile, con deduplicazione e rimozione di dati sensibili. `console.error` nell'esempio serve solo a osservare il guasto locale.

## Errori comuni

- Lasciare Promise rifiutate senza gestione aspettandosi un fallback automatico.
- Rilanciare nell'handler e aspettarsi che il boundary lo catturi.
- Mostrare stack trace, token o risposte integrali del server nel fallback.
- Fare fallire il logger o il fallback: il boundary non protegge se stesso.
- Riprovare automaticamente in ciclo senza correggere la causa.
- Considerare l'isolamento UI un rollback: richieste gia inviate o effetti esterni non vengono annullati dal boundary.

## Checklist

- Il confine coincide con un'area recuperabile e il resto della pagina resta utilizzabile?
- Gli errori previsti sono distinti dai guasti di rendering?
- Il retry corregge la causa e rende esplicita l'eventuale perdita di stato?
- Il logger non espone dati sensibili e non duplica le segnalazioni?
- Sono testati fallback, reset, guasto nel fallback e handler asincroni?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/Suspense e Lazy Loading|Suspense e Lazy Loading]]
- [[Programmazione/React/Pagine/React Router|React Router]]
- [[Programmazione/React/Pagine/Profiler e Debugging|Profiler e Debugging]]
- [[Programmazione/React/Pagine/API layer|API layer]]

## Fonti

- [React: Error Boundaries e limiti](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary).
- [React: useTransition, error boundary](https://react.dev/reference/react/useTransition#displaying-an-error-to-users-with-an-error-boundary), [use](https://react.dev/reference/react/use), [lazy](https://react.dev/reference/react/lazy) e [createRoot](https://react.dev/reference/react-dom/client/createRoot).
- [React: Suspense ed errori server](https://react.dev/reference/react/Suspense#providing-a-fallback-for-server-errors-and-client-only-content).
- Esempi verificati con React e React DOM 19.3.0. Le API di framework e router hanno contratti aggiuntivi; questa classe non li sostituisce.
