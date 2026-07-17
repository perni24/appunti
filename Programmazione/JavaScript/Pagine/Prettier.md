---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: 
tags:
  - programmazione
  - javascript
  - tooling
  - formattazione
aliases: []
prerequisites: []
related: []
---

# Prettier

## Sintesi

**Prettier** e un formatter automatico. Riscrive il codice secondo regole coerenti, riducendo discussioni manuali su spazi, indentazione, virgole e wrapping.

## Quando usarlo

Usa Prettier quando vuoi una formattazione automatica, stabile e condivisa, senza discutere manualmente spazi, indentazione e layout del codice.

E utile in:

- repository con piu sviluppatori;
- progetti con CI;
- codice JavaScript, TypeScript, JSON, CSS, HTML e Markdown;
- codebase dove vuoi separare stile automatico da regole di qualita.

Non usarlo per imporre regole semantiche: quello e compito di ESLint.

## Come funziona

### Concetto chiave
Prettier non cerca di capire se il codice e corretto dal punto di vista logico. Il suo scopo e produrre formattazione consistente.

```powershell
npx prettier . --write
```
### Uso tipico
- Formattazione al salvataggio nell'editor.
- Check in CI.
- Hook pre-commit.
- Standard condiviso nel team.
### Rapporto con ESLint
[[Programmazione/JavaScript/Pagine/ESLint|ESLint]] segnala problemi di qualita e possibili bug. Prettier gestisce la forma del codice.

## API / Sintassi

### Esempio di configurazione
```json
{
  "semi": true,
  "singleQuote": false,
  "printWidth": 100
}
```

## Esempio pratico

Codice prima della formattazione:

```javascript
const user={name:"Luca",roles:["admin","editor"]};function hasRole(role){return user.roles.includes(role)}
```

Dopo Prettier:

```javascript
const user = { name: "Luca", roles: ["admin", "editor"] };

function hasRole(role) {
  return user.roles.includes(role);
}
```

Il vantaggio e che il formato non dipende dallo stile personale di chi modifica il file.

## Varianti

- **Format on save**: l'editor formatta automaticamente quando salvi.
- **CLI manuale**: utile per formattare tutto il progetto.
- **Check in CI**: verifica che i file siano gia formattati.
- **Pre-commit hook**: formatta solo i file modificati.
- **Configurazione condivisa**: opzioni comuni per tutti i membri del progetto.

## Errori comuni

- Usare ESLint e Prettier con regole di formattazione in conflitto.
- Cambiare impostazioni spesso, generando diff rumorosi.
- Applicarlo a file generati.

## Checklist

- Aggiungi una configurazione Prettier condivisa.
- Escludi file generati con `.prettierignore`.
- Integra format on save nell'editor.
- Esegui controllo formato in CI se serve.
- Coordina Prettier con ESLint.
- Evita opzioni personalizzate non necessarie.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/ESLint|ESLint]]
- [[Programmazione/JavaScript/Pagine/Testing|Testing]]
- [[Programmazione/JavaScript/Pagine/Node.js Basics|Node.js Basics]]
