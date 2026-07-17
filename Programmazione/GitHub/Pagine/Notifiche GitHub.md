---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [github, notifiche, collaborazione, workflow]
aliases: [Notifiche GitHub, GitHub notifications]
prerequisites: [GitHub]
related: [Issues GitHub, Pull request]
---

# Notifiche GitHub

## Sintesi

Le **notifiche GitHub** segnalano attivita su repository, issue, pull request, review, discussioni e team. Sono essenziali per collaborare, ma se non vengono gestite diventano rumore.

Padroneggiarle significa ricevere segnali utili senza perdere lavoro importante in mezzo a notifiche irrilevanti.

## Quando usarlo

Configura le notifiche quando:

- lavori in piu repository;
- sei reviewer o maintainer;
- partecipi a progetti open source;
- vuoi seguire issue specifiche;
- vuoi evitare email inutili;
- devi rispondere rapidamente a review o incidenti.

## Come funziona

GitHub invia notifiche in base a:

- repository watched;
- mention dirette;
- assegnazioni;
- review request;
- team mention;
- commenti su thread a cui partecipi;
- subscription manuali.

Puoi gestire notifiche da interfaccia web, email, mobile e impostazioni account.

## API / Sintassi

Filtri utili nella pagina notifiche:

```text
reason:assign
reason:mention
reason:review-requested
repo:owner/repository
is:unread
```

GitHub CLI:

```bash
gh issue list --assignee @me
gh pr list --review-requested @me
```

## Esempio pratico

Routine giornaliera:

1. apri notifiche non lette;
2. filtra review request;
3. rispondi a mention dirette;
4. assegna o aggiorna issue bloccanti;
5. marca come lette notifiche informative;
6. disiscriviti da thread non piu rilevanti.

Questa routine mantiene il lavoro collaborativo sotto controllo.

## Varianti

- **Watch repository**: ricevi notifiche ampie.
- **Participating**: ricevi notifiche dove sei coinvolto.
- **Mention**: notifiche dirette.
- **Review request**: richiesta esplicita di review.
- **Custom watch**: scelta per issue, PR, release o security alerts.
- **Unsubscribe**: riduce rumore su thread non piu utili.

## Errori comuni

- Guardare tutti i repository con `watch` completo.
- Ignorare review request.
- Usare notifiche come lista task senza priorita.
- Non disiscriversi da thread rumorosi.
- Affidarsi solo alle email e non alla pagina notifiche.
- Non distinguere mention dirette da aggiornamenti informativi.

## Checklist

- Stai guardando solo repository rilevanti?
- Le review request sono controllate regolarmente?
- Le mention dirette hanno priorita?
- Hai ridotto notifiche rumorose?
- Hai filtri salvati o routine chiara?
- Le notifiche critiche arrivano sul canale giusto?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[GitHub]]
- [[Issues GitHub]]
- [[Pull request]]
- [[Review code su GitHub]]

## Fonti

- [GitHub Docs - About notifications](https://docs.github.com/en/account-and-profile/managing-subscriptions-and-notifications-on-github/setting-up-notifications/about-notifications)
