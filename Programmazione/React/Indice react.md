## Fondamenta di React
- Introduzione e Toolchain (Vite, npx create-react-app)
- JSX (JavaScript XML) e sintassi
- Componenti Funzionali vs Componenti a Classe
- Props e Flusso di dati unidirezionale
- Rendering Condizionale e Liste (Key prop)

## Gestione dello Stato e Ciclo di Vita
- useState: Gestione dello stato locale
- useEffect: Side effects e cleanup (prevenzione memory leak)
- useRef: Accesso diretto al DOM e persistenza valori
- useMemo e useCallback: Ottimizzazione delle performance
- useReducer: Gestione di stati complessi
- useTransition e useDeferredValue: Gestione priorità rendering (Concurrent React)
- Custom Hooks: Logica riutilizzabile

## Concetti Avanzati e Design Patterns
- Context API: Global State Management
- Compound Components Pattern (Es. Tabs, Accordion)
- Control Props e State Reducer Pattern
- Portals: Rendering fuori dalla gerarchia DOM principale
- Error Boundaries: Gestione degli errori nei componenti
- Suspense e Lazy Loading: Code Splitting
- Profiler e Debugging (React DevTools)

## Reattività e Internals
- Virtual DOM e Algoritmo di Riconciliazione (Diffing)
- Fiber Architecture e Concurrent Mode
- Batching degli aggiornamenti di stato
- Gestione della memoria e AbortController nelle API

## Ecosistema e UX
- React Router: Gestione della navigazione (SPA) e Protezione Rotte
- State Management Esterno: Zustand, Redux Toolkit
- Data Fetching e Cache: TanStack Query (React Query)
- Gestione Moduli (Form): Controlled vs Uncontrolled, React Hook Form
- Validazione Dati: Schema validation con Zod o Yup
- Animazioni e Micro-interazioni: Framer Motion, React Spring
- Internazionalizzazione (i18n): react-i18next e localizzazione date/valute
- Virtualizzazione delle liste (react-window, react-virtuoso)

## Sicurezza nel Frontend
- Protezione XSS (Cross-Site Scripting) e dangerouslySetInnerHTML
- Gestione Autenticazione: JWT, HttpOnly Cookies vs LocalStorage
- CSRF (Cross-Site Request Forgery) e strategie di difesa
- Content Security Policy (CSP) per applicazioni React

## Accessibilità (a11y)
- Standard WAI-ARIA e Ruoli Semantici
- Focus Management e Navigazione da tastiera
- Test di accessibilità (Axe-core, Lighthouse)

## Testing e Qualità
- Unit Testing con Jest e React Testing Library
- E2E Testing con Cypress o Playwright
- Linting (ESLint) e Formattazione (Prettier)

## React Moderno e Server-Side
- Server Components (RSC)
- Server-Side Rendering (SSR) e Static Site Generation (SSG)
- Frameworks consigliati: Next.js, Remix

---