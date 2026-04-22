---
date: 2026-04-22
tags: [react, virtualization, lists, performance, react-window, react-virtuoso, frontend, javascript]
type: #permanent-note
status: budding
---

# Virtualizzazione delle liste

La **virtualizzazione delle liste** e una tecnica per renderizzare solo la parte visibile di una collezione molto grande, invece di montare nel DOM tutti gli elementi contemporaneamente.

In React e una strategia molto utile quando una lista contiene centinaia o migliaia di righe, card o celle.

> [!INFO] Punto chiave
> Il problema non e solo avere molti dati in memoria. Il problema e quanti elementi React e il browser devono davvero renderizzare e mantenere attivi nel DOM nello stesso momento.

---

## 1. Il problema che risolve

Quando renderizzi una lista molto grande con `.map()`, React crea un albero di componenti potenzialmente enorme.

Esempio concettuale:

```javascript
function UserList({ users }) {
  return (
    <div>
      {users.map(user => (
        <UserRow key={user.id} user={user} />
      ))}
    </div>
  );
}
```

Questo approccio va benissimo su liste piccole o medie, ma puo diventare problematico quando:
- ci sono migliaia di elementi;
- ogni riga ha markup complesso;
- la lista si aggiorna spesso;
- scorri rapidamente su dispositivi meno potenti.

Gli effetti tipici sono:
- scroll poco fluido;
- mount iniziale pesante;
- re-render costosi;
- DOM troppo grande.

Si collega direttamente a [[Profiler e Debugging]], perche il sintomo emerge spesso come componente lento o interazione poco reattiva.

---

## 2. Come funziona la virtualizzazione

L'idea e semplice:
- la lista completa esiste a livello di dati;
- il DOM contiene solo gli elementi visibili, o quasi visibili, nella finestra corrente;
- man mano che scorri, i nodi vengono riusati o sostituiti.

In pratica, invece di renderizzare 10.000 righe, il browser ne gestisce magari 20 o 40 alla volta.

Questo riduce:
- numero di nodi DOM;
- costo di mount iniziale;
- lavoro di layout e paint;
- costo di aggiornamento percepito.

---

## 3. Windowing

Spesso la virtualizzazione viene descritta anche come **windowing**.

La "window" e la porzione della lista che in quel momento interessa all'utente:
- viewport visibile;
- qualche elemento extra sopra;
- qualche elemento extra sotto.

Gli elementi extra servono a evitare scroll bruschi o comparsa tardiva dei contenuti.

Quindi il principio non e "renderizza solo quello che si vede in modo esatto", ma "renderizza una finestra ragionevole attorno alla vista corrente".

---

## 4. Perche non basta usare key corrette

Le `key` corrette sono fondamentali per il rendering di liste, ma non risolvono il problema del volume.

[[Rendering Condizionale e Liste]] spiega perche le `key` aiutano React a riconciliare meglio gli elementi.

Ma anche con key perfette:
- 10.000 nodi restano 10.000 nodi;
- il browser deve comunque gestirli;
- il costo di layout e paint puo restare troppo alto.

La virtualizzazione affronta un problema diverso: non solo *come* riconciliare la lista, ma *quanta lista* renderizzare davvero.

---

## 5. react-window

**react-window** e una libreria molto nota per il windowing di liste e griglie.

Esempio concettuale:

```javascript
import { FixedSizeList } from "react-window";

function Row({ index, style, data }) {
  return (
    <div style={style}>
      {data[index].name}
    </div>
  );
}

function UserList({ users }) {
  return (
    <FixedSizeList
      height={500}
      width={300}
      itemCount={users.length}
      itemSize={48}
      itemData={users}
    >
      {Row}
    </FixedSizeList>
  );
}
```

Punti forti di `react-window`:
- API relativamente semplice;
- molto leggero;
- ottimo per liste con altezza fissa;
- adatto quando vuoi massimo controllo con poco overhead.

Limite tipico:
- quando gli elementi hanno altezza molto variabile, la gestione diventa piu delicata.

---

## 6. react-virtuoso

**react-virtuoso** e una libreria piu orientata all'ergonomia e ai casi reali complessi.

E spesso apprezzata quando servono:
- item di altezza dinamica;
- liste piu ricche;
- integrazione piu comoda con scenari reali;
- infinite scrolling.

Concettualmente, `react-virtuoso` tende a ridurre parte della complessita manuale che con altre librerie ricade sullo sviluppatore.

La scelta pratica spesso e:
- `react-window` se vuoi una soluzione leggera e controllata;
- `react-virtuoso` se vuoi migliore ergonomia su casi meno banali.

---

## 7. Altezza fissa vs altezza dinamica

La virtualizzazione funziona piu facilmente quando ogni riga ha altezza nota e costante.

Per esempio:
- tabella con righe omogenee;
- menu lungo;
- elenco semplice di nomi o record.

Diventa piu complessa quando:
- le card cambiano altezza;
- il contenuto si espande;
- immagini e testo alterano il layout;
- alcune righe hanno sottosezioni o stato aperto/chiuso.

Qui la libreria scelta e importante, perche non tutte gestiscono bene il caso dinamico.

---

## 8. Infinite scroll e virtualizzazione

Virtualizzazione e infinite scroll non sono la stessa cosa, anche se spesso lavorano insieme.

### Infinite scroll
Carica nuovi dati mentre l'utente scorre.

### Virtualizzazione
Limita quanti elementi renderizzare nel DOM.

Puoi avere:
- virtualizzazione senza infinite scroll;
- infinite scroll senza virtualizzazione;
- entrambe insieme.

In applicazioni grandi, la combinazione delle due tecniche e molto comune.

Questo si collega anche a [[Data Fetching e Cache]] quando la lista carica pagine successive via API.

---

## 9. Tradeoff e complessita

La virtualizzazione migliora molto le performance, ma introduce anche vincoli:
- maggiore complessita del componente lista;
- gestione piu attenta delle misure;
- possibili problemi con layout dinamici;
- maggiore attenzione ad accessibilita e test.

Non va introdotta automaticamente su ogni lista. Se la lista e piccola, la complessita aggiuntiva potrebbe non essere giustificata.

> [!WARNING] Errore comune
> Virtualizzare tutto per principio e una forma di ottimizzazione prematura. Prima bisogna capire se la lista e davvero un collo di bottiglia.

---

## 10. Accessibilita e UX

Quando virtualizzi una lista, devi fare attenzione a:
- focus management;
- navigazione da tastiera;
- screen reader;
- percezione della lunghezza reale del contenuto;
- mantenimento del contesto durante lo scroll.

Una lista molto performante ma difficile da navigare puo peggiorare l'esperienza complessiva.

Quindi performance e accessibilita vanno progettate insieme.

---

## 11. Quando usarla davvero

La virtualizzazione conviene quando:
- la lista e molto grande;
- il rendering iniziale pesa;
- lo scroll non e fluido;
- il profiler mostra costo significativo sulle liste;
- la UI si blocca o perde reattivita.

Di solito non serve quando:
- gli elementi sono pochi;
- la lista viene mostrata raramente;
- il costo vero sta altrove, per esempio in fetch, calcoli o stato mal posizionato.

Il criterio corretto resta sempre: misurare prima.

---

## 12. Relazione con React

La virtualizzazione si collega bene a:
- [[Rendering Condizionale e Liste]] per il tema `key` e rendering di array;
- [[Profiler e Debugging]] per misurare il costo reale;
- [[useMemo e useCallback]] quando servono ottimizzazioni mirate attorno alle righe;
- [[Data Fetching e Cache]] se la lista carica dati a pagine;
- UI dense come dashboard, tabelle e risultati di ricerca.

In pratica, non sostituisce una buona architettura del dato, ma riduce il costo della rappresentazione visuale di grandi collezioni.

---

## 13. Best Practices

1. **Virtualizza solo quando la lista e davvero grande o misurata come costosa:** evita complessita gratuita.
2. **Mantieni le righe il piu semplici possibile:** meno lavoro per item significa scroll piu fluido.
3. **Scegli la libreria in base al caso:** `react-window` per approccio leggero, `react-virtuoso` per scenari piu ergonomici o dinamici.
4. **Fai attenzione a focus, tastiera e screen reader:** performance senza accessibilita non basta.
5. **Combina virtualizzazione e data fetching con criterio:** caricare poco e renderizzare poco sono problemi collegati ma distinti.
6. **Usa il profiler per verificare il beneficio reale:** la virtualizzazione deve ridurre un problema misurabile, non solo sembrare una buona idea.

---
