---
date: 2026-11-28
title: "Verificare una pagina con browser e tecnologie assistive"
area: Programmazione
topic: HTML e CSS
type: operational-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [html, accessibilita, compatibilita, testing]
aliases: []
prerequisites:
  - "[[Programmazione/HTML e CSS/Pagine/Focus visibile e stati interattivi|Focus visibile e stati interattivi]]"
related:
  - "[[Programmazione/HTML e CSS/Pagine/Moduli HTML nativi|Moduli HTML nativi]]"
  - "[[Programmazione/React/Pagine/Test di accessibilita|Test di accessibilità in React]]"
---

# Verificare una pagina con browser e tecnologie assistive

## Obiettivo

Verifica un **compito**, non la somiglianza di due screenshot. In questo esempio la persona deve aprire le opzioni di lettura, selezionare una preferenza, richiudere il pannello e raggiungere le informazioni. Distingui due domande: *riesco a farlo senza mouse?* e *senza guardare lo schermo capisco dove sono e cosa è cambiato?* Un test da tastiera risponde solo alla prima.

## Pagina di prova

Apri questo documento HTML in una scheda nuova. Non richiede un server, non invia dati e non salva la preferenza. Il pannello parte chiuso e la casella non selezionata. Se ripeti il percorso, ripristina questi due stati: il browser può conservare lo stato dei controlli quando torni indietro.

```html
<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Preferenze di lettura</title>
</head>
<body>
  <main>
    <h1>Preferenze di lettura</h1>
    <details>
      <summary>Opzioni di lettura</summary>
      <input id="note" type="checkbox">
      <label for="note">Includi le note a margine</label>
    </details>
    <a href="#informazioni">Informazioni sulle preferenze</a>
    <h2 id="informazioni">Informazioni</h2>
    <p>La scelta vale solo per questa pagina di prova.</p>
  </main>
</body>
</html>
```

## Primo passaggio: confronta i browser senza mouse

Esegui il percorso sullo stesso documento e con il focus nella pagina, prima senza lettore di schermo. Per motivare il confronto scegli i browser usati dal tuo pubblico. Chrome e Firefox, per esempio, permettono di confrontare due motori diversi; Chrome ed Edge desktop ordinari no. Per un servizio destinato a iPhone, una finestra desktop ristretta o WebKit in Playwright non sostituiscono Safari sul dispositivo.

| Passo | Risultato da osservare |
| --- | --- |
| Premi `Tab` due volte dal principio. | Il focus visibile passa da «Opzioni di lettura» al link. Non entra nella casella del pannello chiuso. |
| Torna indietro con `Maiusc+Tab`, premi `Invio`, poi `Tab`. | Il pannello si apre. Il focus raggiunge la casella, riconoscibile dall'etichetta. |
| Premi `Spazio`, poi `Maiusc+Tab` e `Invio`. | La casella si seleziona; torni al comando di apertura e richiudi senza perdere il focus. |
| Premi `Tab` e `Invio`. | Raggiungi il link, non il controllo nascosto; la destinazione è `#informazioni`. |

Ripeti a zoom aumentato e controlla che l'indicatore del focus rimanga leggibile. Se il primo `Tab` salta un controllo, annota anche le impostazioni di navigazione da tastiera del sistema e del browser. Un indicatore disegnato diversamente non è da solo un difetto: un controllo irraggiungibile o un focus invisibile sì.

## Secondo passaggio: prova con un lettore di schermo

1. **Trova il punto di partenza senza usare la vista.** Con NVDA su Windows, parti dall'inizio del documento e in modalità navigazione usa `H` per le intestazioni. Con VoiceOver e Safari su macOS, cerca «Preferenze di lettura» nella categoria delle intestazioni del rotore. Poi raggiungi «Opzioni di lettura». I comandi per esplorare il documento non sono la stessa cosa di `Tab`, che sposta il focus.
2. **Verifica il cambiamento di stato.** Prima di attivare il comando, devi capire che il pannello è chiuso; dopo, che è aperto. Raggiungi la casella: riesci a riconoscere **nome, tipo di controllo e stato**? Attivala con il comando del lettore e controlla che il nuovo stato sia percepibile. In NVDA il tasto rapido `X` cerca una casella in modalità navigazione; non aspettarti che funzioni allo stesso modo in modalità focus.
3. **Verifica l'uscita.** Richiudi il pannello. Esplorando il contenuto non dovresti più incontrare la casella; dovresti poter trovare e seguire il link alle informazioni. Valuta il significato trasmesso e quando arriva: due lettori possono usare termini o un ordine di parole diversi senza impedire il compito.

**Controprova:** in una copia cambia `for="note"` in `for="inesistente"`, lasciando invariato l'`id`. La scritta resta visibile e `Spazio` continua a cambiare la spunta, ma il clic sulla scritta non attiva più la casella e il controllo perde il nome fornito dalla label. Il pannello Accessibilità del browser aiuta a localizzare la causa. Non dimostra quali parole il lettore abbia effettivamente pronunciato.

## Registrare un esito ripetibile

Per ogni combinazione registra sistema e versione, browser e versione, eventuale tecnologia assistiva e versione, modalità di navigazione, stato iniziale e passo provato. Usa **superato**, **fallito** o **non provato**. Esempio di scheda da compilare, non di risultati già ottenuti:

| Ambiente | Evidenza da registrare | Esito iniziale |
| --- | --- | --- |
| Browser A e B, tastiera, senza lettore (una riga per browser) | Ordine del focus, attivazione e destinazione raggiunta | Non provato |
| Windows, Firefox e NVDA | Nome e stato percepiti prima e dopo la selezione | Non provato |
| macOS, Safari e VoiceOver | Titolo trovato col rotore, apertura, selezione e uscita | Non provato |

Se un passo fallisce, riporta **atteso, osservato e come riprodurlo**. «Dopo aver aperto il pannello, la casella ha uno stato ma non un nome» è più utile di «non accessibile». Un controllo automatico su ruolo, nome e focus è ripetibile; non misura la voce, il braille o l'esperienza d'uso, e non certifica la conformità WCAG della pagina.

## Collegamenti

- [[Programmazione/HTML e CSS/Indice HTML e CSS|Indice HTML e CSS]]
- [[Programmazione/HTML e CSS/Pagine/Focus visibile e stati interattivi|Controllare l'indicatore del focus]]
- [[Programmazione/HTML e CSS/Pagine/Validare il markup HTML|Diagnosticare un riferimento for errato]]
- [[Programmazione/React/Pagine/Test di accessibilita|Automatizzare parte dei controlli in React]]

## Fonti

- [W3C WAI: primi controlli di accessibilità e limiti della verifica](https://www.w3.org/WAI/test-evaluate/easy-checks/)
- [NV Access: modalità navigazione e comandi a lettera singola](https://download.nvaccess.org/documentation/userGuide.html#SingleLetterNavigation)
- [Apple: categorie del rotore web di VoiceOver su Mac](https://support.apple.com/it-it/guide/voiceover/vo15219/mac)
- [Playwright: browser, motori e differenze rispetto ai prodotti distribuiti](https://playwright.dev/docs/browsers)
