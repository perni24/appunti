---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - clean-code
  - refactoring
  - testing
aliases:
  - Refactoring sicuro
  - Safe refactoring
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Codice testabile]]"
  - "[[Programmazione/Clean Code/Pagine/Test unitari leggibili]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Legacy code]]"
  - "[[Programmazione/Clean Code/Pagine/Code smells]]"
  - "[[Programmazione/Clean Code/Pagine/Test di integrazione]]"
title: Refactoring sicuro
---

# Refactoring sicuro

## Sintesi

Un refactoring cambia **come** è organizzato il codice, non il comportamento sul quale conta il chiamante. Quel comportamento include i dati restituiti, ma anche il numero e l'ordine delle scritture e ciò che resta visibile se una scrittura fallisce.

## Esempio: estrarre il formato senza cambiare l'export

La versione di partenza è in [[Programmazione/Clean Code/Pagine/Legacy code|Legacy code]]. Scrive su un destinatario **sincrono** una riga per ogni codice non vuoto e restituisce il numero di righe. I codici sono stringhe senza separatori né terminatori di riga: questo formato storico non è un encoder CSV generico.

```js
function formatCodeRow(code) {
  return "C;" + code + "\r\n";
}

function exportCodes(codes, write) {
  let written = 0;
  for (const code of codes) {
    if (code === "") continue;
    write(formatCodeRow(code));
    written++;
  }
  return written;
}
```

Per `["", "007", "0"]` il destinatario riceve due chiamate: `"C;007\r\n"` e `"C;0\r\n"`. Non convertire i codici in numeri: gli zeri iniziali hanno significato. Con un input senza codici validi non viene chiamato affatto.

## Un controesempio utile

Accumulare tutte le righe e chiamare `write` una sola volta sembra equivalente quando si controlla **solo il testo finale**. Non lo è per un destinatario che fallisce alla seconda chiamata: prima poteva aver già accettato la prima riga; dopo la modifica potrebbe accettarle tutte. Anche sostituire `\r\n` con il terminatore di riga della macchina cambia il formato.

## Procedura di verifica

1. Registra l'output della versione attuale, comprese le chiamate effettuate prima di un errore; non dedurre il contratto dalla nuova implementazione.
2. Estrai solo `formatCodeRow` e semplifica il ramo vuoto senza spostare le scritture. Esegui gli stessi casi su entrambe le versioni.
3. Se serve supportare separatori nel codice o passare a un writer asincrono, apri una modifica funzionale separata con esempi nuovi.

I test riducono il rischio, ma non provano equivalenza universale: qui si coprono input del formato dichiarato e un destinatario sincrono.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Code smells|Code smells]]
- [[Programmazione/Clean Code/Pagine/Debito tecnico|Debito tecnico]]
- [[Programmazione/Clean Code/Pagine/Codice testabile|Codice testabile]]
- [[Programmazione/Clean Code/Pagine/Test unitari leggibili|Test unitari leggibili]]
- [[Programmazione/Clean Code/Pagine/Legacy code|Legacy code]]

## Fonti

- Martin Fowler, *Refactoring*
- Michael Feathers, *Working Effectively with Legacy Code*
- Kent Beck, *Test Driven Development*
- [Martin Fowler: definizione e pratica del refactoring](https://refactoring.com/)
