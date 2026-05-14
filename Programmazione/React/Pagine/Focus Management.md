---
date: 2026-05-14
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [react, frontend, javascript]
aliases: [Focus Management]
prerequisites: []
related: []
---
# Focus Management

## Sintesi

Nota su Focus Management in React. Riassume il concetto, quando usarlo, i punti critici e gli errori da evitare durante sviluppo, debugging o revisione di applicazioni React.

Il **focus management** riguarda il modo in cui l'interfaccia controlla e mantiene il focus tastiera sugli elementi interattivi.

In React questo tema e centrale per l'accessibilita, perche componenti complessi come modal, menu, tab, form dinamici e overlay possono rompere facilmente il flusso naturale della navigazione da tastiera.

> [!INFO] Punto chiave
> Un componente accessibile non deve solo "essere cliccabile". Deve permettere all'utente di capire dove si trova il focus, come spostarlo e cosa succede quando l'interfaccia cambia.

---

## 1. Cos'e il focus

Il **focus** indica quale elemento interattivo sta ricevendo input dalla tastiera in quel momento.

Esempi:
- un bottone selezionato con `Tab`;
- un input attivo pronto a ricevere testo;
- una voce di menu navigata da tastiera;
- il pulsante iniziale di una modal appena aperta.

Se il focus non viene gestito bene, l'utente puo:
- perdersi nell'interfaccia;
- non riuscire a raggiungere elementi importanti;
- attivare componenti sbagliati;
- restare bloccato in overlay o sezioni non piu visibili.

---

## 2. Perche e importante in React

React aggiorna il DOM dinamicamente:
- componenti montati o smontati;
- contenuti che compaiono dopo un click;
- modal che si aprono via [[Programmazione/React/Pagine/Portals]];
- messaggi di errore che appaiono nel form;
- liste filtrate o riordinate.

In tutti questi casi il browser non sempre sa quale dovrebbe essere il focus corretto dal punto di vista UX.

Il risultato e che il focus puo:
- restare su un elemento non piu visibile;
- andare perso;
- finire in una posizione poco logica;
- non entrare nel componente appena aperto.

Per questo il focus management e spesso responsabilita esplicita dello sviluppatore.

---

## 3. Focus naturale vs focus gestito

### Focus naturale
Il browser segue l'ordine del DOM e la semantica nativa.

Se usi HTML corretto, spesso hai gia:
- `Tab` coerente;
- attivazione corretta dei bottoni;
- passaggio logico tra input.

### Focus gestito
Serve quando il flusso naturale non basta piu.

Casi tipici:
- apertura di una modal;
- ritorno del focus dopo chiusura;
- menu custom;
- componenti con roving tabindex;
- errori di validazione che devono guidare l'utente.

La regola pratica e: lascia al browser il piu possibile, intervieni solo quando il comportamento naturale non risolve bene il caso.

---

## 4. useRef e focus imperativo

In React il modo piu comune per gestire il focus e usare [[Programmazione/React/Pagine/useRef]].

Esempio:

```javascript
function SearchBox() {
  const inputRef = useRef(null);

  function handleClick() {
    inputRef.current?.focus();
  }

  return (
    <>
      <input ref={inputRef} />
      <button onClick={handleClick}>Focus input</button>
    </>
  );
}
```

Questo approccio e utile quando devi spostare il focus in modo esplicito in risposta a:
- apertura di un componente;
- submit fallito;
- navigazione interna;
- cambio di stato UI.

---

## 5. Focus iniziale

Quando un componente importante appare, spesso serve decidere dove mettere il focus iniziale.

Esempi:
- una modal dovrebbe ricevere focus su un elemento significativo al momento dell'apertura;
- un form con errore puo spostare il focus al primo campo non valido;
- una ricerca appena aperta puo portare focus sull'input.

Esempio concettuale:

```javascript
function Modal({ isOpen }) {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true">
      <button ref={closeButtonRef}>Chiudi</button>
    </div>
  );
}
```

Il focus iniziale aiuta l'utente a capire immediatamente dove si trova.

---

## 6. Focus trap

Una modal accessibile non dovrebbe permettere al focus di uscire dal dialog mentre e aperta.

Questo comportamento si chiama **focus trap**.

Serve perche, se la modal rappresenta il contesto attivo:
- `Tab` non deve portare l'utente dietro l'overlay;
- l'interazione tastiera deve restare confinata nel dialog;
- il contesto deve rimanere coerente finche la modal non viene chiusa.

Questa parte non viene risolta da ARIA da sola. Richiede logica reale di tastiera e focus.

Si collega direttamente a [[Programmazione/React/Pagine/WAI-ARIA]] e [[Programmazione/React/Pagine/Portals]].

---

## 7. Ritorno del focus

Quando chiudi un overlay o una modal, il focus dovrebbe tornare all'elemento che aveva attivato l'apertura.

Esempio tipico:
- l'utente preme "Apri dettagli";
- si apre una modal;
- chiude la modal;
- il focus torna su "Apri dettagli".

Questo e importante per:
- continuita della navigazione;
- orientamento dell'utente;
- uso corretto della tastiera.

Se il focus non torna in un punto logico, l'utente puo perdere il contesto.

---

## 8. Focus e validazione form

Nei form, il focus management e molto utile quando il submit fallisce.

Pattern frequente:
- validi i campi;
- trovi il primo errore;
- sposti il focus su quel campo;
- eventualmente colleghi il messaggio via `aria-describedby`.

Questo rende piu facile correggere il problema, specialmente per utenti tastiera o screen reader.

Si collega bene a [[Programmazione/React/Pagine/Gestione Moduli]] e [[Programmazione/React/Pagine/WAI-ARIA]].

---

## 9. Navigazione da tastiera

Il focus management e strettamente legato alla navigazione da tastiera.

Controlli base da rispettare:
- ordine di tab sensato;
- elementi interattivi davvero focussabili;
- focus visibile;
- attivazione coerente con `Enter` e `Space` dove atteso;
- nessun blocco o salto illogico.

Errore comune:

```javascript
<div onClick={openMenu}>Menu</div>
```

Questo rompe:
- focus nativo;
- interazione tastiera;
- semantica accessibile.

Meglio usare elementi nativi o implementare completamente il comportamento necessario.

---

## 10. Focus visibile

Gestire il focus non significa solo spostarlo. Significa anche rendere visibile dove si trova.

Problemi comuni:
- outline rimossa via CSS;
- stato di focus poco visibile;
- differenza insufficiente tra focus e hover.

Una buona UI deve mostrare chiaramente:
- quale elemento ha focus;
- quando il focus si sposta;
- quale controllo ricevera input da tastiera.

Togliere l'outline senza sostituirla con un'alternativa equivalente e un anti-pattern.

---

## 11. Componenti dinamici

Il focus management diventa piu delicato in componenti dinamici:
- dropdown custom;
- combobox;
- autocomplete;
- tablist;
- menu contestuali;
- wizard multi-step.

In questi casi bisogna progettare:
- dove entra il focus;
- come si muove;
- come esce;
- come reagisce ai cambi di stato.

Se il comportamento non e definito in modo esplicito, il componente rischia di essere usabile solo col mouse.

---

## 12. Errori comuni

Errori frequenti:
- aprire una modal senza spostare il focus dentro;
- chiudere una modal senza restituire il focus;
- usare elementi non focussabili come controlli interattivi;
- rimuovere l'outline di focus;
- lasciare il focus su elementi nascosti o smontati;
- gestire ARIA ma non il comportamento tastiera reale.

Questi bug spesso non si notano con il mouse, ma emergono subito con tastiera e screen reader.

---

## 13. Relazione con React

Il focus management si collega bene a:
- [[Programmazione/React/Pagine/WAI-ARIA]] per ruoli, stati e descrizioni corrette;
- [[Programmazione/React/Pagine/Portals]] per modal e overlay;
- [[Programmazione/React/Pagine/Gestione Moduli]] per errori e campi invalidi;
- navigazione da tastiera e test di accessibilita.

In React il punto chiave e mantenere allineati:
- stato del componente;
- visibilita del contenuto;
- focus reale nel DOM;
- semantica accessibile.

Se uno di questi aspetti resta indietro rispetto agli altri, l'esperienza tastiera si rompe.

---

## 14. Best Practices

1. **Affidati al focus naturale del browser quando basta:** HTML semantico corretto risolve gia molti problemi.
2. **Gestisci esplicitamente focus iniziale e ritorno del focus per overlay e modal:** sono i casi piu importanti.
3. **Usa `useRef` per spostare il focus in modo mirato:** evita soluzioni fragili o troppo indirette.
4. **Non usare ARIA come sostituto del comportamento reale:** focus, tastiera e trap vanno implementati davvero.
5. **Mantieni sempre visibile lo stato di focus:** rimuovere l'outline senza alternativa e un errore serio.
6. **Testa l'interfaccia solo con tastiera:** e il modo piu rapido per individuare problemi reali di focus management.

---
