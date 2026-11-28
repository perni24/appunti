---
date: 2026-11-27
title: "Analizzare i fogli CSS con Stylelint"
area: Programmazione
topic: HTML e CSS
type: operational-note
status: "non revisionato"
publish: true
difficulty: base
tags: [css, stylelint, linting]
aliases: []
prerequisites:
  - "[[Programmazione/HTML e CSS/Pagine/Selettori, cascata ed ereditarietà|Selettori, cascata ed ereditarietà]]"
related:
  - "[[Programmazione/HTML e CSS/Pagine/Validare il markup HTML|Validare il markup HTML]]"
  - "[[Programmazione/JavaScript/Pagine/Prettier|Prettier]]"
---

# Analizzare i fogli CSS con Stylelint

## Obiettivo

Controllare i fogli CSS prima di integrarli in un progetto. **Stylelint verifica le regole configurate, non la resa della pagina.** Per esempio, `!important` è CSS valido: il linter può segnalarlo perché il progetto richiede di risolvere prima i conflitti di cascata. Prettier, invece, si occupa della formattazione; nessuno dei due dimostra che il testo abbia contrasto sufficiente.

## Configurare un progetto di prova

Lavora in una directory di prova, non nella cartella generata da Quartz. Servono npm e Node compatibile con i pacchetti; gli esempi sono stati provati con Node `24.14.0`. Se la directory è nuova e non contiene un `package.json`, inizializzala:

```sh
npm init -y
```

Installa il linter e il preset come dipendenze di sviluppo. Le versioni sono esplicite per rendere ripetibile il confronto; conserva anche `package-lock.json`.

```sh
npm install --save-dev --save-exact stylelint@17.16.0 stylelint-config-standard@40.0.0
```

Nella radice del progetto, `stylelint.config.mjs`:

```js
export default {
  extends: ["stylelint-config-standard"],
  rules: {
    "declaration-no-important": true,
  },
  reportNeedlessDisables: true,
};
```

`extends` carica il preset, che fra le altre cose preferisce i colori esadecimali brevi quando equivalenti. `rules` aggiunge la scelta del progetto su `!important`. L'ultima opzione segnala un commento di disattivazione che non serve più.

Aggiungi `lint:css` all'oggetto `scripts` del `package.json` **senza sostituire gli altri script**. Le virgolette intorno al glob fanno arrivare il pattern a Stylelint anche quando si cambia shell.

```json
{
  "scripts": {
    "lint:css": "stylelint \"src/**/*.css\""
  }
}
```

## Leggere e correggere due segnalazioni

Crea `src/scheda.css` con questo contenuto. Entrambe le scelte sono accettate dal browser; non entrambe richiedono lo stesso tipo di correzione.

```css
.scheda {
  background-color: #aabbcc !important;
}
```

Esegui il controllo dalla radice del progetto:

```sh
npm run lint:css
```

Leggi **il nome della regola** accanto alla posizione nel file. `color-hex-length` chiede `#abc`: le tre coppie ripetute rappresentano gli stessi canali di `#aabbcc`. `declaration-no-important` segnala la priorità forzata; non dice quale altra dichiarazione vincerebbe togliendola.

Per verificare la differenza, prova l'autocorrezione **solo sul file di esempio**. Questo comando scrive sul file:

```sh
npx stylelint src/scheda.css --fix
```

Il risultato è `background-color: #abc !important;`. Il comando continua a segnalare `declaration-no-important`: un file modificato non equivale a un controllo superato. Nel nostro esempio non c'è una dichiarazione concorrente, quindi puoi togliere `!important`. Il file finale è:

```css
.scheda {
  background-color: #abc;
}
```

Ripeti `npm run lint:css`: con il solo file corretto l'esito atteso è `0`, contro `2` per le precedenti violazioni. In un progetto reale, prima di togliere la priorità controlla negli strumenti di sviluppo **quale regola vince sull'elemento interessato**.

## Limitare un'eccezione a una dichiarazione

Supponi che un widget non modificabile scriva un'ombra nello stile inline, **senza** `!important`. A schermo vuoi mantenerla; in stampa vuoi toglierla. Una normale dichiarazione del foglio non scavalca quello stile inline. Qui l'eccezione ha un motivo preciso:

```css
@media print {
  .ricevuta-widget {
    /* stylelint-disable-next-line declaration-no-important -- In stampa annulla l'ombra inline del widget esterno. */
    box-shadow: none !important;
  }
}
```

Puoi aggiungere il blocco a `src/scheda.css`: il controllo passa. Il commento cambia **solo il lint**, non la cascata; esenta una regola sulla sola riga successiva. Un altro `!important` non commentato resta segnalato. Se il widget smette di scrivere l'ombra inline, togli la priorità e ripeti il lint: `reportNeedlessDisables` ti ricorda di rimuovere anche il commento ormai inutile.

## Debug rapido

- **Nessun file trovato:** verifica che `src/scheda.css` esista e che il comando parta dal progetto giusto. Allarga il glob solo ai sorgenti che mantieni, non a `dist/` o agli HTML di Quartz.
- **Una regola scatta solo su alcuni file:** dalla radice, `npx stylelint src/scheda.css --print-config` mostra la configurazione effettiva per quel file. Un foglio SCSS o uno stile dentro un componente non è automaticamente coperto dal glob `*.css` né dalla configurazione per CSS puro.
- **Integrazione continua:** dopo `npm ci` esegui `npm run lint:css` senza `--fix`. Così la CI verifica lo stesso script usato in locale e non riscrive i sorgenti; verifica a parte la resa a schermo e in stampa.

## Collegamenti

- [[Programmazione/HTML e CSS/Indice HTML e CSS|Indice HTML e CSS]]
- [[Programmazione/HTML e CSS/Pagine/Selettori, cascata ed ereditarietà|Capire quale dichiarazione vince]]
- [[Programmazione/HTML e CSS/Pagine/Validare il markup HTML|Validare il documento HTML]]
- [[Programmazione/JavaScript/Pagine/ESLint|ESLint per il codice JavaScript]]
- [[Programmazione/JavaScript/Pagine/Prettier|Prettier e la formattazione]]

## Fonti

- [Stylelint: configurazione iniziale per CSS](https://stylelint.io/user-guide/get-started/)
- [Stylelint: regola color-hex-length](https://stylelint.io/user-guide/rules/color-hex-length/)
- [Stylelint: CLI, autocorrezione e codici di uscita](https://stylelint.io/user-guide/cli/)
- [Stylelint: disattivazioni limitate a una riga](https://stylelint.io/user-guide/ignore-code/)
