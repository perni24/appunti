---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: base
tags: [github, account, profilo, sicurezza]
aliases: [Account GitHub, Profilo GitHub]
prerequisites: [GitHub]
related: [Sicurezza dei token GitHub, Accessi ruoli e permessi GitHub]
---

# Account GitHub e profilo sviluppatore

## Sintesi

L'account GitHub identifica una persona o un bot sulla piattaforma. Il profilo sviluppatore e la parte pubblica dell'account: repository, contributi, organizzazioni, README profilo, sponsor, stelle e attivita visibile.

Un account ben configurato non serve solo a presentarsi: riduce rischi di sicurezza, rende chiara l'identita nei commit e facilita collaborazione e review.

## Quando usarlo

Cura account e profilo quando:

- contribuisci a progetti pubblici;
- lavori in organizzazioni o team;
- vuoi separare identita personale e professionale;
- devi usare SSH, token o GitHub CLI;
- vuoi rendere comprensibili i tuoi repository a chi li visita.

## Come funziona

Un account GitHub contiene:

- username;
- email associate;
- chiavi SSH;
- token di accesso;
- membership in organizzazioni;
- impostazioni di sicurezza;
- notifiche;
- profilo pubblico.

Il profilo puo includere un repository speciale con lo stesso nome dello username. Il `README.md` di quel repository viene mostrato nella pagina profilo.

## API / Sintassi

Configurare autore Git locale:

```bash
git config --global user.name "Nome Cognome"
git config --global user.email "email@example.com"
```

Verificare configurazione:

```bash
git config --global --list
```

Autenticazione con GitHub CLI:

```bash
gh auth login
gh auth status
```

## Esempio pratico

Creare un profilo pubblico essenziale:

1. crea un repository chiamato come il tuo username;
2. aggiungi `README.md`;
3. descrivi competenze, progetti principali e contatti;
4. evita informazioni sensibili;
5. mantieni il contenuto aggiornato.

Esempio di sezione:

```md
## Cosa sto studiando

- Backend e database
- Automazione con GitHub Actions
- Knowledge base in Markdown
```

## Varianti

- **Account personale**: identita principale.
- **Organizzazione**: spazio condiviso per team o progetti.
- **Bot account**: account dedicato ad automazioni, da usare con attenzione.
- **Profilo pubblico minimale**: utile se vuoi ridurre esposizione.
- **Profilo portfolio**: utile se GitHub e parte della tua presentazione professionale.

## Errori comuni

- Usare email personale non desiderata nei commit pubblici.
- Non abilitare autenticazione a due fattori.
- Creare token troppo permissivi.
- Lasciare chiavi SSH vecchie o non usate.
- Riempire il profilo con badge inutili invece di informazioni chiare.
- Non distinguere account personale, organizzazioni e permessi dei repository.

## Checklist

- L'email dei commit e corretta?
- La 2FA e attiva?
- Le chiavi SSH sono ancora valide e riconoscibili?
- I token inutilizzati sono rimossi?
- Il profilo comunica cosa fai realmente?
- I repository pinned sono scelti con criterio?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[GitHub]]
- [[Git e GitHub]]
- [[Repository GitHub]]
