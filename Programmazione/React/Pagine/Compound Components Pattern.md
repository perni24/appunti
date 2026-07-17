---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
publish: true
difficulty: advanced
tags: [react, patterns, components]
aliases: [Compound Components Pattern, Compound Components]
prerequisites: []
related: []
---

# Compound Components Pattern

## Sintesi

Il Compound Components Pattern permette di creare componenti coordinati che lavorano insieme attraverso composizione esplicita. E comune in tab, accordion, menu, select custom e componenti di design system.

L'obiettivo e dare controllo al chiamante mantenendo logica condivisa nel componente padre.

## Quando usarlo

Usalo quando un componente ha parti interne configurabili e l'utente del componente deve controllarne composizione e ordine. Evitalo per componenti semplici dove props esplicite bastano.

## Come funziona

```jsx
<Tabs defaultValue="profile">
  <Tabs.List>
    <Tabs.Trigger value="profile">Profilo</Tabs.Trigger>
    <Tabs.Trigger value="settings">Impostazioni</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Panel value="profile">Profilo</Tabs.Panel>
  <Tabs.Panel value="settings">Impostazioni</Tabs.Panel>
</Tabs>
```

I sotto-componenti condividono stato tramite Context.

## API / Sintassi

```jsx
const TabsContext = createContext(null);

function Tabs({ children, defaultValue }) {
  const [value, setValue] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ value, setValue }}>
      {children}
    </TabsContext.Provider>
  );
}
```

```jsx
Tabs.Trigger = function Trigger({ value, children }) {
  const context = useContext(TabsContext);
  return <button onClick={() => context.setValue(value)}>{children}</button>;
};
```

## Esempio pratico

Accordion:

```jsx
<Accordion>
  <Accordion.Item value="a">
    <Accordion.Header>Domanda</Accordion.Header>
    <Accordion.Panel>Risposta</Accordion.Panel>
  </Accordion.Item>
</Accordion>
```

Il chiamante compone la struttura, mentre il componente gestisce apertura, ARIA e keyboard navigation.

## Varianti

- **Compound + Context**: pattern piu comune.
- **Controlled compound**: valore controllato da props.
- **Uncontrolled compound**: stato interno.
- **Headless component**: logica senza stile imposto.
- **Slot pattern**: composizione di aree nominate.

## Errori comuni

- Rendere il pattern troppo magico.
- Non gestire accessibilita.
- Non supportare controlled/uncontrolled quando serve.
- Accoppiare sotto-componenti a struttura DOM troppo rigida.
- Usarlo per componenti banali.

## Checklist

- La composizione libera porta valore reale?
- I sotto-componenti hanno nomi chiari?
- Accessibilita e tastiera sono gestite?
- Stato controllato e non controllato sono coerenti?
- L'API e piu semplice di props annidate?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[Context API]]
- [[Control Props e State Reducer Pattern]]
- [[Design system]]
- [[WAI-ARIA]]
