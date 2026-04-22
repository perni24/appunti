---
date: 2026-04-22
tags: [react, animations, micro-interactions, framer-motion, react-spring, frontend, javascript]
type: #permanent-note
status: budding
---

# Animazioni e Micro-interazioni

Le **animazioni** e le **micro-interazioni** servono a rendere l'interfaccia piu chiara, reattiva e leggibile nel tempo.

In React non sono solo un tema estetico: aiutano a comunicare cambi di stato, transizioni tra viste, feedback ai click, caricamenti e gerarchie visive.

> [!INFO] Punto chiave
> Una buona animazione non serve a "decorare" la UI. Serve a spiegare meglio cosa sta succedendo, dove sta andando l'attenzione e quale azione ha prodotto un effetto.

---

## 1. Cosa sono le micro-interazioni

Le micro-interazioni sono feedback piccoli e mirati che accompagnano l'utente durante l'uso dell'interfaccia.

Esempi comuni:
- un bottone che cambia stato al click;
- un input che evidenzia errore o successo;
- un menu che si apre con transizione morbida;
- un loader che comunica attesa;
- una card che reagisce all'hover;
- una notifica che entra ed esce in modo leggibile.

Sono dettagli, ma influenzano molto la percezione di qualita dell'app.

---

## 2. Perche servono davvero

Senza motion, molti cambi di interfaccia appaiono bruschi:
- elementi che compaiono dal nulla;
- layout che si sposta senza contesto;
- stati di loading poco chiari;
- feedback deboli alle azioni dell'utente.

Le animazioni aiutano a:
- comunicare causalita;
- guidare l'attenzione;
- ridurre la sensazione di instabilita;
- rendere i passaggi piu comprensibili.

In pratica, motion e UX, non solo visual design.

---

## 3. Quando basta il CSS

Per molte animazioni semplici, il CSS e sufficiente:
- hover;
- focus;
- fade in;
- transizioni di colore;
- trasformazioni leggere come `scale` o `translate`.

Esempio:

```css
.button {
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.button:hover {
  transform: translateY(-2px);
}
```

Questo approccio e spesso la scelta migliore quando:
- l'animazione e semplice;
- non dipende dalla logica React;
- non devi coordinare ingresso, uscita e layout complessi.

---

## 4. Quando il CSS non basta

Il CSS diventa meno comodo quando devi gestire:
- mount e unmount di componenti;
- animazioni di presenza;
- transizioni tra liste o layout;
- gesture;
- orchestrazione di piu elementi;
- fisica e spring motion.

In questi casi, una libreria React-oriented puo essere molto piu efficace.

---

## 5. Framer Motion

**Framer Motion** e una delle librerie piu usate per animazioni in React.

Permette di animare componenti in modo dichiarativo.

Esempio:

```javascript
import { motion } from "framer-motion";

function Card() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      Contenuto
    </motion.div>
  );
}
```

Punti forti di Framer Motion:
- API leggibile;
- integrazione naturale con React;
- supporto a ingresso, uscita e layout animation;
- ottimo per interfacce moderne e componenti complessi.

---

## 6. React Spring

**React Spring** e un'altra libreria importante, orientata a un modello basato su fisica e spring animation.

E spesso apprezzata quando vuoi movimenti piu naturali e continui, meno "timeline-based".

Concettualmente:
- Framer Motion e molto ergonomico per UI moderne e transizioni dichiarative;
- React Spring e forte su motion piu fisico e composizioni animate basate su valori interpolati.

La scelta dipende dal tipo di interazione e dalle preferenze del team.

---

## 7. Enter, exit e presence

Un problema tipico in React e che un componente puo sparire immediatamente quando non viene piu renderizzato.

Se vuoi animare l'uscita, ti serve un meccanismo che gestisca la **presence** del componente prima della rimozione effettiva.

Con Framer Motion, per esempio, questo si gestisce con `AnimatePresence`.

E utile per:
- modal;
- tooltip;
- drawer;
- notifiche;
- route transition.

Questo tipo di animazione e difficile da gestire bene solo con CSS, soprattutto quando il componente viene montato e smontato dinamicamente.

---

## 8. Layout transitions

Le animazioni di layout aiutano quando la UI cambia dimensione o posizione:
- card che si espandono;
- liste che si riordinano;
- pannelli che si aprono;
- contenuto che si inserisce tra elementi esistenti.

Qui il valore della motion e molto alto, perche l'utente capisce meglio:
- cosa si e spostato;
- dove e finito un elemento;
- quale parte dell'interfaccia ha reagito.

Se il layout cambia senza transizione, la UI puo sembrare instabile o "saltare".

---

## 9. Performance

Le animazioni possono migliorare la UX, ma possono anche peggiorarla se progettate male.

Problemi comuni:
- troppe animazioni simultanee;
- transizioni lunghe o inutili;
- uso di proprieta costose da animare;
- motion che introduce lag.

Regole pratiche:
- preferire `transform` e `opacity` quando possibile;
- evitare animazioni pesanti su layout complesso;
- non animare tutto;
- verificare con [[Profiler e Debugging]] se la UI perde fluidita.

Un'animazione che scatta o rallenta e peggiore di nessuna animazione.

---

## 10. Accessibilita e reduced motion

Non tutti gli utenti tollerano bene animazioni intense. Alcune persone usano la preferenza di sistema per ridurre il motion.

Per questo e importante rispettare `prefers-reduced-motion` o usare le opzioni equivalenti offerte dalle librerie.

Buona pratica:
- ridurre movimenti ampi;
- evitare parallax aggressivi;
- mantenere comunque feedback chiari anche senza animazione completa.

La motion deve aiutare, non creare frizione o disagio.

---

## 11. Micro-interazioni utili

Le micro-interazioni funzionano bene quando sono:
- brevi;
- coerenti;
- contestuali;
- leggibili.

Esempi buoni:
- bottone che comunica stato di pressione;
- input che segnala focus e validazione;
- spinner o skeleton che indicano caricamento;
- toast che entra ed esce con timing chiaro;
- accordion con apertura leggibile.

Esempi cattivi:
- animazioni troppo lente;
- effetti rumorosi su ogni hover;
- motion che distrae dal contenuto;
- transizioni incoerenti tra componenti simili.

---

## 12. Relazione con React

Le animazioni si collegano spesso a:
- [[Gestione Moduli]] per feedback su input e submit;
- [[Validazione Dati]] per errori e stati di conferma;
- [[React Router]] per route transitions;
- [[Suspense e Lazy Loading]] per loading state e fallback;
- [[Profiler e Debugging]] per verificare costi reali della motion.

In pratica, motion e interazione vanno pensate insieme al flusso dello stato e non come livello separato applicato alla fine.

---

## 13. Best Practices

1. **Usa animazioni per chiarire il comportamento dell'interfaccia:** non per aggiungere rumore visivo.
2. **Parti dal CSS per i casi semplici:** e spesso la soluzione piu economica e robusta.
3. **Usa Framer Motion o React Spring quando la complessita lo giustifica:** mount/unmount, presence, layout e gesture sono casi tipici.
4. **Mantieni timing brevi e coerenti:** micro-interazioni troppo lunghe rallentano la UX percepita.
5. **Rispetta accessibilita e reduced motion:** l'animazione deve poter degradare bene.
6. **Misura il costo delle animazioni nelle interfacce dense:** se il motion peggiora fluidita o leggibilita, va ridotto o ripensato.

---
