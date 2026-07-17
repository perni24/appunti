---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [github, dependabot, security, dependencies, supply-chain]
aliases: [Dependabot]
prerequisites: [Dependency graph, Repository settings]
related: [Dependency graph, Security advisories GitHub]
---

# Dependabot

## Sintesi

**Dependabot** e l'insieme di funzionalita GitHub per monitorare e aggiornare dipendenze. Aiuta a rilevare vulnerabilita, aprire pull request di aggiornamento e mantenere aggiornati package manager, container e GitHub Actions.

Non sostituisce una revisione tecnica: una PR di Dependabot va letta, testata e valutata come qualsiasi modifica a dipendenze.

## Quando usarlo

Usa Dependabot quando:

- il repository usa package manager come npm, pip, Maven, Cargo o simili;
- vuoi ricevere alert su vulnerabilita note;
- vuoi automatizzare aggiornamenti di sicurezza;
- vuoi aggiornare versioni in modo ricorrente;
- vuoi ridurre il rischio di supply chain obsoleta;
- vuoi tracciare aggiornamenti tramite pull request.

## Come funziona

Dependabot si appoggia al dependency graph e agli advisory di sicurezza. Le aree principali sono:

- **Dependabot alerts**: segnalano dipendenze vulnerabili;
- **security updates**: aprono PR per correggere vulnerabilita;
- **version updates**: aprono PR periodiche per aggiornare dipendenze;
- **dependabot.yml**: configura ecosistemi, directory e frequenza;
- **auto-triage rules**: aiutano a gestire alert ricorrenti.

## API / Sintassi

Esempio `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

## Esempio pratico

Per un progetto Node.js con workflow GitHub Actions:

1. abilita dependency graph;
2. abilita Dependabot alerts;
3. configura `dependabot.yml`;
4. aggiorna anche `github-actions`;
5. richiedi CI verde sulle PR;
6. fai merge solo dopo test e review.

## Varianti

- **Security updates**: correzioni per vulnerabilita note.
- **Version updates**: aggiornamenti periodici non necessariamente di sicurezza.
- **Multi-ecosystem updates**: raggruppa aggiornamenti collegati.
- **Private registries**: richiede configurazione credenziali.
- **Grouped updates**: riduce rumore accorpando PR compatibili.

## Errori comuni

- Attivare Dependabot senza CI affidabile.
- Fare merge automatico di major update senza review.
- Ignorare gli aggiornamenti GitHub Actions.
- Non configurare registry privati.
- Lasciare decine di PR aperte senza triage.
- Considerare un alert risolto solo perche e stato nascosto.

## Checklist

- Dependency graph e attivo?
- Dependabot alerts sono monitorati?
- `dependabot.yml` copre tutti gli ecosistemi rilevanti?
- Le PR di Dependabot eseguono test e lint?
- Gli update major sono revisionati con attenzione?
- Gli alert dismiss sono motivati?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Dependency graph]]
- [[Security advisories GitHub]]
- [[Required status checks]]

## Fonti

- [GitHub Docs - Secure your supply chain](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain)
