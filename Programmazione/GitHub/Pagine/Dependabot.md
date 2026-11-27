---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - github
  - dependabot
  - security
  - dependencies
  - supply-chain
aliases:
  - Dependabot
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Dependency graph]]"
  - "[[Programmazione/GitHub/Pagine/Repository settings]]"
related:
  - "[[Programmazione/GitHub/Pagine/Dependency graph]]"
  - "[[Programmazione/GitHub/Pagine/Security advisories GitHub]]"
title: Dependabot
---

# Dependabot

## Sintesi

**Dependabot** risponde a tre domande diverse: una versione usata dal progetto è segnalata in un advisory? Esiste una correzione proponibile? Ci sono versioni più recenti anche senza segnalazioni di sicurezza? Un alert, una PR di sicurezza e una PR di manutenzione non sono la stessa cosa.

| Funzione | Da cosa parte | Che cosa produce |
| --- | --- | --- |
| **Dependabot alerts** | Il grafo delle dipendenze del branch predefinito viene confrontato con gli advisory supportati. | Un alert sul pacchetto e sull’intervallo di versioni interessato. Non modifica i file. |
| **Security updates** | Un alert per cui l’aggiornamento è abilitato e risolvibile. | Una PR che cerca la versione minima corretta; vincoli incompatibili o assenza di una patch possono impedirla. |
| **Version updates** | Un controllo programmato per ecosistema e directory. | PR di manutenzione anche per dipendenze senza advisory. Non sono una dichiarazione di vulnerabilità. |

## Esempio: controllare le dipendenze di Quartz

Configurazione **di esempio**, da collocare in `.github/dependabot.yml` sul branch predefinito per attivare i *version updates*. Nel vault il manifest npm è `site/package.json`; le action, invece, sono richiamate da `.github/workflows/`.

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/site"
    schedule:
      interval: "weekly"
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

La directory è relativa alla radice del **repository**, non al file YAML. Per `github-actions` si indica `/`, non `/.github/workflows`. Il calendario settimanale riguarda le **nuove versioni**: non significa che gli alert di sicurezza debbano aspettare una settimana. Alert e security updates si abilitano nelle impostazioni; le PR di sicurezza non richiedono necessariamente questo file.

## Come decidere su una PR

1. Identifica il motivo: manutenzione o advisory collegato? Per una dipendenza transitiva controlla anche quale pacchetto diretto la introduce: la PR può dover aggiornare quel pacchetto.
2. Leggi il diff di manifest e lockfile, le note di rilascio e le eventuali incompatibilità. Per Quartz prova la build e i test di trasformazione: la sola installazione riuscita non verifica l’HTML.
3. Se arriva un alert senza PR, verifica prima disponibilità della patch, supporto dell’ecosistema, vincoli del manifest e accesso al registro. Per un registro privato usa credenziali gestite per Dependabot, non valori nel file YAML.
4. Dopo il merge verifica sul branch predefinito la versione risolta e lo stato dell’alert. Una PR soltanto aperta, o un alert archiviato con motivazione, non ha aggiornato il software distribuito.

Per ridurre il numero di PR si possono raggruppare aggiornamenti affini, anche tra ecosistemi dove supportato. Mantieni separabili gli aggiornamenti difficili da verificare insieme. Le regole di triage aiutano a ordinare gli alert: non sostituiscono né il test né la correzione.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Dependency graph|Dependency graph]]
- [[Programmazione/GitHub/Pagine/Security advisories GitHub|Security advisories GitHub]]
- [[Programmazione/GitHub/Pagine/Required status checks|Required status checks]]

## Fonti

- [GitHub Docs: configurazione e ruolo del file dependabot.yml](https://docs.github.com/en/code-security/concepts/supply-chain-security/about-the-dependabot-yml-file)
- [GitHub Docs: security updates e risoluzione delle versioni](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-security-updates)
- [GitHub Docs: directory, calendari e gruppi per ecosistema](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference)
