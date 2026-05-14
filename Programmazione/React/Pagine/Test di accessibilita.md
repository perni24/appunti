---
date: 2026-05-14
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [react, frontend, javascript]
aliases: [Test di accessibilita]
prerequisites: []
related: []
---
# Test di accessibilita

## Sintesi

Nota su Test di accessibilita in React. Riassume il concetto, quando usarlo, i punti critici e gli errori da evitare durante sviluppo, debugging o revisione di applicazioni React.

I **test di accessibilita** servono a verificare se un'interfaccia e realmente utilizzabile anche da persone che navigano con tastiera, screen reader o altre tecnologie assistive.

In React questo tema e importante perche componenti dinamici, custom UI e rendering condizionale possono introdurre facilmente problemi non immediatamente visibili durante l'uso col mouse.

> [!INFO] Punto chiave
> L'accessibilita non si verifica leggendo il codice "a occhio". Va testata con strumenti automatici e con controlli manuali sul comportamento reale dell'interfaccia.

---

## 1. Perche testare l'accessibilita

Un componente puo sembrare corretto visivamente e restare comunque problematico:
- focus invisibile;
- ordine di tab sbagliato;
- pulsanti non raggiungibili da tastiera;
- label mancanti nei form;
- ruoli ARIA incoerenti;
- dialog che non gestiscono focus o chiusura.

Molti di questi problemi non emergono subito durante lo sviluppo normale, soprattutto se si testa solo con mouse e viewport standard.

Per questo l'accessibilita va trattata come una qualita verificabile, non come un'intenzione.

---

## 2. Test automatici vs test manuali

I test di accessibilita si dividono in due famiglie principali.

### Test automatici
Usano strumenti che analizzano il DOM e segnalano problemi frequenti:
- contrasti insufficienti;
- attributi ARIA errati;
- label mancanti;
- errori semantici ricorrenti.

### Test manuali
Servono a verificare il comportamento reale:
- navigazione da tastiera;
- focus management;
- ordine logico;
- usabilita con screen reader;
- comprensibilita dei messaggi.

I test automatici sono utili, ma non bastano da soli.

---

## 3. Cosa non riescono a vedere i tool automatici

Un tool puo dirti che esiste `aria-label`, ma non sempre puo dirti se:
- il testo e davvero chiaro;
- il focus si sposta nel punto giusto;
- una modal intrappola il focus correttamente;
- il flusso di navigazione da tastiera e sensato;
- l'interfaccia e comprensibile durante l'uso reale.

Quindi l'accessibilita non si riduce a "zero warning nel report".

---

## 4. Axe

**Axe** e uno degli strumenti piu usati per il testing di accessibilita nel frontend.

Puo essere usato:
- nel browser tramite estensioni;
- nei test automatici;
- integrato in pipeline di verifica.

Axe e molto utile per trovare problemi frequenti come:
- ARIA non valida;
- elementi form senza label;
- contrasto insufficiente;
- landmark mancanti;
- pattern semantici errati.

Nel contesto React e particolarmente utile per intercettare regressioni su componenti dinamici.

---

## 5. Lighthouse

**Lighthouse** e uno strumento integrato nell'ecosistema Chrome che fornisce audit su vari aspetti, tra cui accessibilita.

Per la parte a11y puo segnalare:
- nomi accessibili mancanti;
- contrasti insufficienti;
- ruoli non corretti;
- problemi di navigazione o struttura semantica.

Vantaggi:
- rapido da eseguire;
- utile per una prima panoramica;
- integrato con altri audit di performance e best practices.

Limite:
- non sostituisce test mirati su componenti complessi.

---

## 6. Tastiera come primo test manuale

Uno dei test manuali piu semplici e potenti e usare solo la tastiera.

Controlli pratici:
- riesci a raggiungere tutti gli elementi interattivi con `Tab`?
- il focus e visibile?
- l'ordine di navigazione e logico?
- `Enter` e `Space` funzionano come atteso?
- una modal blocca correttamente il focus?
- il focus torna nel punto corretto quando un overlay si chiude?

Questo si collega direttamente a [[Programmazione/React/Pagine/Focus Management]].

Se una UI non e usabile con la tastiera, c'e gia un problema reale.

---

## 7. Screen reader e test reali

Per componenti importanti, conviene testare anche con screen reader.

Obiettivi:
- verificare che i controlli abbiano un nome accessibile chiaro;
- controllare che ruoli e stati siano annunciati correttamente;
- vedere se dialog, tab e form sono comprensibili;
- capire se messaggi dinamici vengono annunciati.

Qui diventano rilevanti:
- [[Programmazione/React/Pagine/WAI-ARIA]];
- label corrette;
- `aria-live`;
- semantica HTML;
- gestione del focus.

Non serve testare ogni schermata in modo estremo ogni volta, ma i componenti fondamentali dovrebbero essere verificati anche da questo punto di vista.

---

## 8. Test nei form

I form sono uno dei punti dove i problemi di accessibilita emergono piu spesso.

Controlli utili:
- ogni campo ha una label?
- il messaggio di errore e associato al campo?
- il focus va al primo errore dopo submit fallito?
- il campo invalido e percepibile anche senza colore?
- l'utente capisce come correggere l'errore?

Questo si collega a [[Programmazione/React/Pagine/Gestione Moduli]] e [[Programmazione/React/Pagine/WAI-ARIA]].

Un form puo essere corretto sul piano funzionale e restare comunque molto difficile da usare per utenti assistive tech.

---

## 9. Test nei componenti custom

Componenti come:
- modal;
- menu;
- accordion;
- tab;
- combobox;
- dropdown custom;

richiedono attenzione extra.

Qui non basta controllare il markup statico. Bisogna testare:
- comportamento da tastiera;
- ruoli e stati ARIA;
- focus iniziale;
- chiusura e ritorno del focus;
- annunci dinamici se presenti.

Questo e il punto in cui i test automatici e quelli manuali devono lavorare insieme.

---

## 10. Accessibilita come parte dei test UI

L'accessibilita va trattata come parte della qualita dell'interfaccia, non come controllo isolato a fine progetto.

Strategie utili:
- usare Axe nelle review locali o CI;
- aggiungere controlli a11y ai test dei componenti principali;
- includere test tastiera nelle verifiche manuali;
- usare Lighthouse per audit periodici.

Se aspetti la fine del progetto, correggere i problemi costa di piu.

---

## 11. Errori comuni

Errori frequenti:
- fidarsi solo del punteggio Lighthouse;
- pensare che zero warning automatici significhi UI accessibile;
- non testare mai con tastiera;
- controllare solo pagine e non componenti riusabili;
- trascurare focus e comportamento dinamico;
- aggiungere ARIA senza verificare se viene annunciata correttamente.

Il problema non e solo "quale attributo manca", ma se l'interazione completa e davvero usabile.

---

## 12. Relazione con React

I test di accessibilita si collegano bene a:
- [[Programmazione/React/Pagine/WAI-ARIA]] per verificare ruoli, stati e naming;
- [[Programmazione/React/Pagine/Focus Management]] per tastiera e overlay;
- [[Programmazione/React/Pagine/Gestione Moduli]] per label, errori e submit;
- testing UI piu ampio con strumenti automatici e manuali.

In React il rischio principale e che stato, rendering dinamico e componenti custom introducano regressioni invisibili se non verificate esplicitamente.

---

## 13. Best Practices

1. **Combina sempre test automatici e manuali:** nessuno dei due basta da solo.
2. **Usa la tastiera come controllo minimo obbligatorio:** e il test manuale piu economico e piu utile.
3. **Usa Axe per intercettare problemi frequenti in modo ripetibile:** e molto utile per componenti React e regressioni.
4. **Usa Lighthouse per audit rapidi di pagina, ma non fermarti al punteggio:** il comportamento reale conta di piu.
5. **Dai priorita ai componenti interattivi complessi:** modal, menu, form e tab sono i punti piu a rischio.
6. **Tratta l'accessibilita come parte del testing continuo dell'interfaccia:** non come controllo finale opzionale.

---
