---
date: 2026-06-04
area: Programmazione
topic: React
type: theory-note
status: "non revisionato"
difficulty: beginner
tags: [react, state, architecture]
aliases: [State colocato, Colocation state]
prerequisites: []
related: []
---

# State colocato

## Sintesi

Colocare lo state significa tenerlo il piu vicino possibile ai componenti che lo usano. E una regola pratica fondamentale per evitare stato globale inutile e render troppo ampi.

Lo stato va sollevato solo quando piu componenti devono leggerlo o modificarlo.

## Quando usarlo

Usa state colocato per modali locali, input, toggle, hover persistenti, tab di un singolo pannello, filtri locali e UI state che non interessa al resto dell'app.

## Come funziona

```jsx
function AccordionItem({ title, children }) {
  const [open, setOpen] = useState(false);

  return (
    <section>
      <button onClick={() => setOpen((value) => !value)}>{title}</button>
      {open && <div>{children}</div>}
    </section>
  );
}
```

Lo stato `open` appartiene all'item: non serve renderlo globale.

## API / Sintassi

Regola pratica:

```text
1. tieni lo state dove serve
2. se due fratelli lo condividono, sollevalo al padre
3. se molti rami lontani lo usano, valuta Context o store
```

## Esempio pratico

State sollevato:

```jsx
function Tabs({ tabs }) {
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <>
      <TabList tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      <TabPanel tab={tabs.find((tab) => tab.id === activeTab)} />
    </>
  );
}
```

Qui lo state sta nel componente comune che coordina lista e pannello.

## Varianti

- **State locale**: un solo componente lo usa.
- **Lift state up**: piu componenti fratelli lo condividono.
- **Context**: molti discendenti lo leggono.
- **Store esterno**: molti rami lo modificano.
- **URL state**: filtri e paginazione condivisibili via URL.

## Errori comuni

- Rendere globale stato che serve a un solo componente.
- Sollevare stato troppo presto.
- Duplicare lo stesso dato in piu punti.
- Confondere stato UI e dati remoti.
- Tenere nel parent dettagli che appartengono al child.

## Checklist

- Chi legge questo stato?
- Chi lo modifica?
- Puo restare locale?
- Serve sollevarlo solo di un livello?
- Dovrebbe stare nell'URL?
- Sto creando stato globale per comodita temporanea?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[useState]]
- [[Props e Flusso di dati unidirezionale]]
- [[Context API]]
- [[State Management Esterno]]
