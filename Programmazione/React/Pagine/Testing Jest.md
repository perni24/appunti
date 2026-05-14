---
date: 2026-05-14
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [react, frontend, javascript]
aliases: [Testing Jest]
prerequisites: []
related: []
---
# Testing Jest

## Sintesi

Nota su Testing Jest in React. Riassume il concetto, quando usarlo, i punti critici e gli errori da evitare durante sviluppo, debugging o revisione di applicazioni React.

Il **testing con Jest** in React serve a verificare che componenti, hook e logiche dell'interfaccia funzionino correttamente in modo ripetibile.

Nell'ecosistema React moderno, Jest viene spesso usato insieme a **React Testing Library**, che sposta l'attenzione dal test dell'implementazione interna al test del comportamento percepito dall'utente.

> [!INFO] Punto chiave
> Un buon test React non dovrebbe chiedersi "quale stato interno ha il componente?", ma "cosa vede e cosa puo fare l'utente?".

---

## 1. Ruolo di Jest

**Jest** e un test runner e assertion framework.

In pratica si occupa di:
- eseguire i test;
- fornire funzioni come `test`, `describe` ed `expect`;
- gestire mock e spy;
- produrre report di successo o fallimento;
- calcolare coverage se configurato.

Esempio base:

```javascript
test("somma due numeri", () => {
  expect(2 + 2).toBe(4);
});
```

Nel contesto React, Jest da solo non basta per testare bene componenti renderizzati nel DOM. Per quello si usa spesso React Testing Library.

---

## 2. React Testing Library

**React Testing Library** e una libreria pensata per testare componenti React dal punto di vista dell'utente.

Permette di:
- renderizzare componenti in un ambiente di test;
- cercare elementi tramite testo, ruolo o label;
- simulare interazioni;
- verificare cosa appare nella UI.

Esempio:

```javascript
import { render, screen } from "@testing-library/react";

test("mostra il titolo", () => {
  render(<h1>Dashboard</h1>);

  expect(screen.getByText("Dashboard")).toBeInTheDocument();
});
```

Il test non controlla dettagli interni del componente. Controlla il risultato accessibile nel DOM.

---

## 3. Query orientate all'utente

React Testing Library incoraggia a cercare elementi come farebbe un utente o una tecnologia assistiva.

Esempio consigliato:

```javascript
screen.getByRole("button", { name: "Invia" });
```

Esempio meno ideale:

```javascript
container.querySelector(".submit-button");
```

Il primo approccio e migliore perche:
- forza markup piu accessibile;
- testa il comportamento percepito;
- evita dipendenza da classi CSS o struttura interna.

Questo si collega bene a [[Programmazione/React/Pagine/WAI-ARIA]] e [[Programmazione/React/Pagine/Test di accessibilita]].

---

## 4. Testare interazioni

Per testare click, digitazione e interazioni utente si usa spesso `userEvent`.

Esempio:

```javascript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

test("incrementa il contatore", async () => {
  const user = userEvent.setup();

  render(<Counter />);

  await user.click(screen.getByRole("button", { name: "Incrementa" }));

  expect(screen.getByText("1")).toBeInTheDocument();
});
```

`userEvent` e preferibile a simulazioni troppo basse di livello perche rappresenta meglio il comportamento reale dell'utente.

---

## 5. Testare form

I form sono un caso molto comune.

Esempio concettuale:

```javascript
test("invia email valida", async () => {
  const user = userEvent.setup();
  const handleSubmit = jest.fn();

  render(<LoginForm onSubmit={handleSubmit} />);

  await user.type(screen.getByLabelText("Email"), "test@example.com");
  await user.click(screen.getByRole("button", { name: "Invia" }));

  expect(handleSubmit).toHaveBeenCalledWith({
    email: "test@example.com"
  });
});
```

Questo approccio verifica:
- label accessibile;
- input reale dell'utente;
- submit;
- callback finale.

Si collega direttamente a [[Programmazione/React/Pagine/Gestione Moduli]] e [[Programmazione/React/Pagine/Validazione Dati]].

---

## 6. Testare stati asincroni

Molte UI React cambiano dopo fetch, timeout o aggiornamenti asincroni.

In questi casi si usano query asincrone come `findBy...`.

```javascript
test("mostra gli utenti caricati", async () => {
  render(<UserList />);

  expect(screen.getByText("Loading...")).toBeInTheDocument();

  expect(await screen.findByText("Luca")).toBeInTheDocument();
});
```

`findByText` aspetta che l'elemento compaia entro un timeout ragionevole.

Questo si collega a [[Programmazione/React/Pagine/Data Fetching e Cache]], dove loading, error e dati remoti sono parte centrale della UI.

---

## 7. Mock

I mock servono a sostituire dipendenze esterne durante il test.

Esempi:
- funzioni callback;
- moduli API;
- client HTTP;
- hook custom;
- router o provider.

Esempio con callback:

```javascript
const onClose = jest.fn();

render(<Modal onClose={onClose} />);

await user.click(screen.getByRole("button", { name: "Chiudi" }));

expect(onClose).toHaveBeenCalled();
```

I mock sono utili, ma vanno usati con criterio. Troppi mock rendono il test meno vicino al comportamento reale.

---

## 8. Mock delle API

Quando un componente fa data fetching, conviene evitare di chiamare API reali nei test unitari.

Strategie possibili:
- mockare il modulo API;
- mockare `fetch`;
- usare strumenti dedicati come Mock Service Worker.

L'obiettivo e testare il comportamento della UI:
- stato di loading;
- successo;
- errore;
- retry o empty state.

Non serve verificare il backend in un unit test del componente.

---

## 9. Testare routing e provider

Molti componenti React dipendono da:
- [[Programmazione/React/Pagine/React Router]];
- [[Programmazione/React/Pagine/Context API]];
- provider di state management;
- provider di query client;
- tema o i18n.

In questi casi conviene creare utility di test che renderizzano il componente con i provider necessari.

Esempio concettuale:

```javascript
function renderWithProviders(ui) {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </BrowserRouter>
  );
}
```

Questo evita duplicazione nei test e rende piu chiaro il contesto richiesto dal componente.

---

## 10. Cosa testare

Conviene testare:
- rendering di stati importanti;
- interazioni utente;
- submit di form;
- stati asincroni;
- error state;
- componenti con logica condizionale;
- hook custom con logica significativa.

Conviene evitare test troppo fragili su:
- classi CSS interne;
- struttura DOM non rilevante;
- dettagli di implementazione;
- stato interno non osservabile dall'utente.

La domanda guida e: se questo comportamento si rompe, l'utente o il prodotto se ne accorgono?

---

## 11. Unit test, integration test e component test

Nel frontend React i confini non sono sempre rigidi.

### Unit test
Verifica una funzione o una piccola unita isolata.

### Component test
Verifica un componente renderizzato e le sue interazioni principali.

### Integration test
Verifica piu componenti o provider che collaborano.

React Testing Library tende a favorire test di componente o piccole integrazioni, perche spesso sono piu utili dei test troppo isolati.

---

## 12. Snapshot test

Jest supporta anche gli snapshot test.

Servono a confrontare l'output renderizzato con una versione salvata.

Sono utili in alcuni casi, ma spesso diventano fragili:
- cambiano per dettagli non importanti;
- vengono aggiornati senza capire il motivo;
- non verificano davvero comportamento utente.

Per componenti React interattivi, e spesso meglio scrivere assertion esplicite su testo, ruoli e interazioni.

---

## 13. Errori comuni

Errori frequenti:
- testare dettagli interni invece del comportamento;
- usare selector CSS dove basterebbe `getByRole`;
- mockare troppo;
- non testare stati di errore;
- ignorare loading e casi asincroni;
- scrivere snapshot enormi e poco leggibili;
- non includere provider necessari nel render di test.

Un test utile deve dare fiducia sul comportamento reale, non solo aumentare il numero di righe coperte.

---

## 14. Relazione con React

Il testing con Jest si collega bene a:
- [[Programmazione/React/Pagine/Gestione Moduli]] per input, submit e validazione;
- [[Programmazione/React/Pagine/Data Fetching e Cache]] per stati asincroni;
- [[Programmazione/React/Pagine/React Router]] per pagine e navigazione;
- [[Programmazione/React/Pagine/Context API]] per provider condivisi;
- [[Programmazione/React/Pagine/Test di accessibilita]] per query orientate a ruoli e label.

In React, testare bene significa verificare come stato, props, effetti e interazioni producono una UI corretta.

---

## 15. Best Practices

1. **Testa comportamento visibile, non dettagli interni:** i test devono restare validi anche se rifattorizzi l'implementazione.
2. **Preferisci query accessibili come `getByRole` e `getByLabelText`:** migliorano sia test sia markup.
3. **Usa `userEvent` per interazioni realistiche:** click, typing e tab sono parte del comportamento utente.
4. **Gestisci bene gli stati asincroni:** usa `findBy...` o attese mirate quando la UI cambia dopo una promise.
5. **Mocka solo cio che e davvero esterno al comportamento da testare:** troppi mock riducono il valore del test.
6. **Copri loading, successo ed errore:** molte regressioni frontend nascono proprio negli stati non felici.

---
