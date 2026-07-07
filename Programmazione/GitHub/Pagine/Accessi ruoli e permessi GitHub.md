---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [github, permessi, accessi, ruoli, sicurezza]
aliases: [Accessi ruoli e permessi GitHub, Permessi GitHub]
prerequisites: [Repository GitHub]
related: [Organizzazioni e team GitHub, Repository settings]
---

# Accessi ruoli e permessi GitHub

## Sintesi

Accessi, ruoli e permessi GitHub determinano chi puo leggere, scrivere, amministrare, rivedere e configurare un repository. Sono una parte essenziale della sicurezza: un repository ben protetto con permessi troppo larghi resta comunque fragile.

Il principio guida e il **least privilege**: ogni persona o automazione dovrebbe avere solo i permessi necessari.

## Quando usarlo

Gestisci permessi con attenzione quando:

- aggiungi collaboratori;
- lavori in organizzazioni;
- assegni team a repository;
- configuri CI/CD;
- dai accesso a bot o integrazioni;
- lavori su repository privati o sensibili.

## Come funziona

I permessi possono essere assegnati a:

- utenti singoli;
- team;
- organizzazioni;
- GitHub Apps;
- deploy keys;
- token e automazioni.

In generale i livelli possono includere lettura, triage, scrittura, maintain e admin. Il significato preciso dipende dal contesto GitHub e dal tipo di repository.

## API / Sintassi

Esempio di matrice concettuale:

```text
Reader: legge codice e issue consentite
Triage: gestisce issue e PR senza push
Write: fa push e crea branch
Maintain: gestisce parte delle impostazioni
Admin: controlla settings e accessi
```

Controllare repository con CLI:

```bash
gh repo view
```

## Esempio pratico

Per un team applicativo:

- sviluppatori: write;
- reviewer senior: maintain solo se devono gestire impostazioni operative;
- release manager: permessi su release e tag;
- bot CI: token con permessi minimi;
- utenti esterni: accesso temporaneo o fork workflow.

Evita di dare admin solo per permettere operazioni quotidiane.

## Varianti

- **Collaboratore diretto**: accesso a singolo repository.
- **Team GitHub**: accesso gestito per gruppo.
- **Organizzazione**: governance centralizzata.
- **GitHub App**: integrazione con permessi dichiarati.
- **Deploy key**: accesso SSH a repository.
- **Token personale**: potente, da limitare e ruotare.

## Errori comuni

- Dare permessi admin per comodita.
- Non rimuovere accessi di persone non piu coinvolte.
- Usare token personali in automazioni condivise.
- Non distinguere permessi di repository e organizzazione.
- Dare write a contributor esterni quando basta fork e PR.
- Non controllare permessi delle GitHub Apps installate.

## Checklist

- Ogni accesso ha una motivazione?
- I permessi sono minimi?
- I team sono preferiti agli utenti singoli?
- Gli accessi inattivi sono rimossi?
- Bot e token hanno scope limitati?
- Gli admin sono pochi e consapevoli?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Repository GitHub]]
- [[Repository settings]]
- [[Organizzazioni e team GitHub]]
- [[Account GitHub e profilo sviluppatore]]

## Fonti

- [GitHub Docs - Repository roles for an organization](https://docs.github.com/en/organizations/managing-access-to-your-organizations-repositories/repository-roles-for-an-organization)
