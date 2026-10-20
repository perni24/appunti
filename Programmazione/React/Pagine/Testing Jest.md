---
date: 2026-06-04
area: Programmazione
topic: React
type: operational-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - react
  - testing
  - jest
  - vitest
aliases:
  - Testing Jest
  - Testing Library
  - Unit test React
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Testing|Basi del testing]]"
  - "[[Programmazione/React/Pagine/Gestione Moduli|Gestione Moduli]]"
related:
  - "[[Programmazione/React/Pagine/Testing Cypress e Playwright|Test nel browser]]"
  - "[[Programmazione/React/Pagine/Test di accessibilita|Test di accessibilita]]"
title: Testing Jest
---

# Testing Jest

## Obiettivo

Eseguire test riproducibili di funzioni e componenti React con **Jest, React Testing Library e user-event**. La verifica principale e il comportamento osservabile: input, interazioni, risultato ed errori, non il nome di uno state interno.

Jest e il runner; Testing Library renderizza e cerca elementi; user-event simula interazioni; jest-dom aggiunge matcher DOM. **jsdom non e un browser completo**: questi test non certificano layout, CSS, CORS, navigazione o accessibilita complessiva.

## Quando usarlo

- Logica pura, rendering condizionale, form, custom hook e regressioni circoscritte.
- Stati vuoti, pending, successo ed errore con dipendenze controllate.
- Contratti pubblici di componenti riusabili prima dei test di integrazione nel browser.

Per routing reale, CSS, API del browser e flussi con backend usa anche [[Programmazione/React/Pagine/Testing Cypress e Playwright|test nel browser]]. Un mock del servizio non prova quel servizio.

## Procedura

### 1. Preparare runner e trasformazione

Esempio per un progetto JavaScript con Node 24.14.0, React 19.3.0 e Jest 30.5.2. Il progetto ha gia package.json e React/React DOM installati. I pin rendono riproducibile il demo, non garantiscono assenza di advisory: conserva il lockfile e controlla anche le dipendenze di sviluppo.

Installa runner e ambiente DOM:

```sh
npm install --save-dev --save-exact jest@30.5.2 jest-environment-jsdom@30.5.2 babel-jest@30.5.2
```

Installa la trasformazione JSX; questo demo mantiene Babel 7:

```sh
npm install --save-dev --save-exact @babel/core@7.29.7 @babel/preset-env@7.29.7 @babel/preset-react@7.29.7
```

Installa le librerie per interazioni e assertion:

```sh
npm install --save-dev --save-exact @testing-library/react@16.3.3 @testing-library/dom@10.4.2 @testing-library/jest-dom@7.0.1 @testing-library/user-event@14.6.8
```

File `jest.config.cjs`:

```js
module.exports = {
  testEnvironment: "jsdom",
  testMatch: ["<rootDir>/src/**/*.test.jsx"],
  setupFilesAfterEnv: ["<rootDir>/test/setup.js"],
  transform: { "^.+\\.[jt]sx?$": "babel-jest" },
  clearMocks: true,
  restoreMocks: true,
  collectCoverageFrom: ["src/ProfileForm.jsx"],
};
```

File `babel.config.cjs`:

```js
module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" }, modules: "commonjs" }],
    ["@babel/preset-react", { runtime: "automatic" }],
  ],
};
```

File `test/setup.js`:

```js
import "@testing-library/jest-dom";
```

Questa e una configurazione **Jest con trasformazione CommonJS**, anche se il progetto Vite usa `"type": "module"`; i file config .cjs restano CommonJS. Non e la modalita ESM nativa di Jest. Jest non eredita automaticamente plugin, alias, asset e import.meta.env di Vite. Integra le configurazioni esistenti, non sostituirle alla cieca. [Jest: avvio e trasformazione](https://jestjs.io/docs/getting-started), [configurazione](https://jestjs.io/docs/configuration).

### 2. Definire il contratto del componente

Il form seguente modifica un nome visualizzato, non implementa login. `saveName(name)` restituisce una Promise con il nome confermato dal servizio oppure rifiuta. Nel test e una dipendenza iniettata; nella nota browser sara un adapter HTTP.

La regola del demo accetta 1-40 unita UTF-16 dopo trim; non e una regola universale per nomi di persone. noValidate disattiva intenzionalmente il blocco HTML per esercitare la validazione applicativa. Con un normale input required/email, il browser puo impedire submit prima che il tuo handler produca un messaggio personalizzato.

### 3. Scegliere query e attese

| API | Uso |
| --- | --- |
| `getByRole` / `getByLabelText` | Elemento atteso subito; fallisce se manca o e ambiguo |
| `queryByRole` | Verificare assenza: restituisce null se non trova, non se trova duplicati |
| `findByRole` | Attendere la comparsa; restituisce una Promise |
| `waitFor` | Riprovare un'assertion che puo fallire finche lo stato non e pronto |
| `within(container)` | Limitare la ricerca a una regione o istanza |

Preferisci ruolo e nome accessibile; un test id stabile resta utile quando non c'e una query semantica adatta. Non aggiungere ruoli errati soltanto per far passare il test. [Query Testing Library](https://testing-library.com/docs/queries/about/).

Attendi le azioni user-event. Non inserire click o scritture dentro waitFor: il callback puo essere ripetuto. Un elemento role=status gia presente non diventa "aggiornato" solo perche findByRole lo trova: attendi il contenuto specifico. [API asincrone](https://testing-library.com/docs/dom-testing-library/api-async/), [user-event](https://testing-library.com/docs/user-event/intro/).

## Snippet

### Componente: src/ProfileForm.jsx

```jsx
import { useEffect, useId, useRef, useState } from "react";

export function normalizeName(value) {
  if (typeof value !== "string") throw new TypeError("Nome non valido");
  const name = value.trim();
  if (name.length === 0 || name.length > 40) {
    throw new RangeError("Inserisci un nome da 1 a 40 caratteri.");
  }
  return name;
}

export default function ProfileForm({ saveName }) {
  const id = useId();
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [confirmed, setConfirmed] = useState("");
  const [pending, setPending] = useState(false);
  const operation = useRef(null);

  useEffect(() => () => { operation.current = null; }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (operation.current) return;
    setError(null);
    setConfirmed("");
    let normalized;
    try { normalized = normalizeName(name); }
    catch (failure) {
      setError({ kind: "validation", message: failure.message });
      return;
    }
    const current = {};
    operation.current = current;
    setPending(true);
    try {
      const saved = normalizeName(await saveName(normalized));
      if (operation.current === current) setConfirmed(saved);
    } catch {
      if (operation.current === current) {
        setError({
          kind: "service",
          message: "Salvataggio non confermato. Verifica prima di riprovare.",
        });
      }
    } finally {
      if (operation.current === current) {
        operation.current = null;
        setPending(false);
      }
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <label htmlFor={id}>Nome visualizzato</label>
      <input id={id} data-cy="profile-name" required maxLength={40}
        value={name} readOnly={pending} aria-invalid={error?.kind === "validation"}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={event => {
          setName(event.target.value); setError(null); setConfirmed("");
        }} />
      <button type="submit" disabled={pending}>
        {pending ? "Salvataggio..." : "Salva"}
      </button>
      {error && <p id={`${id}-error`} role="alert">{error.message}</p>}
      <p role="status">{confirmed ? `Nome salvato: ${confirmed}` : ""}</p>
    </form>
  );
}
```

Il cleanup scarta risultati dopo lo smontaggio, ma non annulla il servizio ne la scrittura server. La ref blocca invii sovrapposti nello stesso form; non fornisce idempotenza tra schede. La bozza viene conservata su errore. Un errore del servizio non rende automaticamente invalido il campo; il messaggio di successo viene rimosso quando si modifica nuovamente l'input.

### Suite: src/ProfileForm.test.jsx

```jsx
import { StrictMode } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfileForm, { normalizeName } from "./ProfileForm.jsx";

function setup(saveName) {
  const user = userEvent.setup();
  render(<StrictMode><ProfileForm saveName={saveName} /></StrictMode>);
  return user;
}

test.each([
  [" Ada ", "Ada"],
  ["A", "A"],
  ["x".repeat(40), "x".repeat(40)],
])("normalizza %s", (input, expected) => {
  expect(normalizeName(input)).toBe(expected);
});

test("rifiuta valori fuori contratto", () => {
  expect(() => normalizeName(null)).toThrow(TypeError);
  for (const value of ["", "   ", "x".repeat(41)]) {
    expect(() => normalizeName(value)).toThrow(RangeError);
  }
});

test("vuoto: mostra errore senza chiamare il servizio", async () => {
  const saveName = jest.fn();
  const user = setup(saveName);
  await user.click(screen.getByRole("button", { name: "Salva" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Inserisci un nome");
  expect(screen.getByLabelText("Nome visualizzato")).toHaveAttribute("aria-invalid", "true");
  expect(saveName).not.toHaveBeenCalled();
});

test("attesa, singolo invio e conferma del servizio", async () => {
  let resolve;
  const response = new Promise(done => { resolve = done; });
  const saveName = jest.fn(() => response);
  const user = setup(saveName);
  await user.type(screen.getByLabelText("Nome visualizzato"), " Ada ");
  await user.click(screen.getByRole("button", { name: "Salva" }));
  const button = screen.getByRole("button", { name: "Salvataggio..." });
  expect(button).toBeDisabled();
  expect(screen.getByLabelText("Nome visualizzato")).toHaveAttribute("readonly");
  await user.click(button);
  expect(saveName).toHaveBeenCalledTimes(1);
  expect(saveName).toHaveBeenCalledWith("Ada");

  await act(async () => { resolve("Ada Lovelace"); await response; });
  await waitFor(() => expect(screen.getByRole("status"))
    .toHaveTextContent("Nome salvato: Ada Lovelace"));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Salva" })).toBeEnabled();
});

test("errore: conserva bozza e permette un nuovo tentativo esplicito", async () => {
  const saveName = jest.fn()
    .mockRejectedValueOnce(new Error("fixture unavailable"))
    .mockResolvedValueOnce("Ada");
  const user = setup(saveName);
  const input = screen.getByLabelText("Nome visualizzato");
  await user.type(input, "Ada");
  await user.click(screen.getByRole("button", { name: "Salva" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Salvataggio non confermato");
  expect(input).toHaveValue("Ada");
  expect(input).toHaveAttribute("aria-invalid", "false");
  expect(saveName).toHaveBeenCalledTimes(1);

  await user.click(screen.getByRole("button", { name: "Salva" }));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Nome salvato: Ada"));
  expect(saveName).toHaveBeenCalledTimes(2);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
```

Jest fornisce qui test, expect e jest come globali. Testing Library esegue il cleanup automatico dopo ogni test nell'ambiente configurato. act e usato solo per risolvere la Promise controllata dall'esterno; user-event e le normali utility gestiscono gia le interazioni. Non ignorare gli avvisi act, ma non avvolgere tutto indiscriminatamente. [Setup Testing Library](https://testing-library.com/docs/react-testing-library/setup/).

### Esecuzione

Dalla directory del progetto:

```sh
npx --no-install jest --config jest.config.cjs --runInBand
```

Risultato atteso: **7 test**, quattro sulla funzione e tre sul componente. Non vengono contattati backend o database.

Per includere il rapporto di copertura:

```sh
npx --no-install jest --config jest.config.cjs --runInBand --coverage
```

La coverage misura codice eseguito, non la qualita delle assertion. Questo demo non pretende il 100%: mancano, per esempio, prove specifiche su unmount e risposta incoerente. I test devono fallire se il comportamento atteso viene intenzionalmente rotto.

## Adattamenti comuni

- **Vitest:** in un progetto Vite puo riusare la sua pipeline. Usa la configurazione Vitest, vi e il setup jest-dom/vitest; non sostituire solo il comando lasciando mock e config Jest. Questa nota esegue Jest, non Vitest. [Migrazione Vitest](https://vitest.dev/guide/migration/).
- **Custom hook:** renderHook e utile per il contratto dell'hook; per focus, label e UI testa anche un componente che lo usa.
- **API:** inietta un servizio, come qui, oppure usa MSW per simulare il confine HTTP. Mantieni prove separate dell'adapter reale e del backend.
- **Mock:** clear elimina la cronologia, reset elimina anche l'implementazione, restore ripristina lo spy originale. restoreMocks non ripristina assegnazioni manuali a globali. [Mock Jest](https://jestjs.io/docs/mock-function-api).
- **Timer:** usa fake timer solo quando il tempo e parte del requisito; con user-event configura advanceTimers. Esegui i timer pendenti e ripristina quelli reali nel cleanup. Non usare timer finti come sostituto della rete. [Testing Library e timer](https://testing-library.com/docs/using-fake-timers/).
- **TypeScript/ESM:** Babel che rimuove i tipi non esegue il type checking; ESM nativo Jest ha regole proprie per import e mocking. Prevedi tsc separato e leggi la [guida ESM](https://jestjs.io/docs/ecmascript-modules).
- **Snapshot:** piccoli e rivisti consapevolmente; non sostituire i test di comportamento con una fotografia enorme del markup.

## Debug rapido

| Sintomo | Controllo |
| --- | --- |
| document is not defined | Ambiente jsdom installato e selezionato |
| Unexpected token JSX/import | babel-jest e preset; config effettivamente caricata |
| toBeInTheDocument non esiste | Setup jest-dom in setupFilesAfterEnv |
| Query ambigua | Ruolo/nome precisi o within, non un indice arbitrario |
| Test verde prima della risposta | Promise o assertion asincrona non attesa |
| Avviso act | Aggiornamento esterno non atteso, timer o risorsa ancora attiva |
| Form non produce errore custom | Constraint validation HTML ha impedito submit |

## Checklist finale

- Runner, DOM, trasformazione JSX e matcher sono configurati esplicitamente?
- Il test controlla un risultato osservabile oltre alle chiamate del mock?
- Sono coperti input invalido, pending, successo ed errore?
- Le azioni e le Promise sono attese, senza sleep arbitrari?
- I test hanno stato indipendente e cleanup delle risorse?
- Il comando CI termina, esegue i file previsti e propaga exit code non zero?
- Browser reale, accessibilita e backend hanno verifiche distinte?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/Testing Cypress e Playwright|Testing Cypress e Playwright]]
- [[Programmazione/React/Pagine/Test di accessibilita|Test di accessibilita]]
- [[Programmazione/React/Pagine/Storybook|Storybook]]
- [[Programmazione/React/Pagine/Custom Hooks|Custom Hooks]]
- [[Programmazione/JavaScript/Pagine/Testing|Fondamenti di testing]]
- [[Programmazione/React/Pagine/Gestione Moduli|Gestione Moduli]]

## Fonti

- [Jest: avvio](https://jestjs.io/docs/getting-started), [configurazione](https://jestjs.io/docs/configuration), [mock](https://jestjs.io/docs/mock-function-api) e [timer](https://jestjs.io/docs/timer-mocks).
- [React Testing Library: setup](https://testing-library.com/docs/react-testing-library/setup/), [query](https://testing-library.com/docs/queries/about/), [attese](https://testing-library.com/docs/dom-testing-library/api-async/) e [user-event](https://testing-library.com/docs/user-event/intro/).
- [Vitest: migrazione da Jest](https://vitest.dev/guide/migration/). Versioni del demo indicate nella procedura; le prove non equivalgono a un audit di accessibilita.
