---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [github, security-advisories, vulnerability, security]
aliases: [Security advisories GitHub, GitHub Security Advisories]
prerequisites: [Repository GitHub]
related: [Dependabot, Code scanning, Secret scanning]
---

# Security advisories GitHub

## Sintesi

I **Security advisories** su GitHub servono a gestire vulnerabilita in modo coordinato. Permettono di documentare un problema, collaborare privatamente alla correzione e pubblicare un advisory quando la fix e pronta.

Sono utili soprattutto per librerie, progetti open source e repository usati da altri sistemi.

## Quando usarlo

Usali quando:

- scopri una vulnerabilita nel tuo progetto;
- vuoi ricevere segnalazioni private;
- devi coordinare una patch prima della disclosure;
- pubblichi pacchetti usati da altri;
- vuoi generare advisory tracciabili;
- vuoi informare utenti su versioni vulnerabili e corrette.

## Come funziona

Un advisory puo includere:

- descrizione della vulnerabilita;
- severita;
- versioni vulnerabili;
- versioni corrette;
- workaround;
- CVE, se richiesto e applicabile;
- collaboratori della correzione;
- timeline di disclosure.

GitHub distingue tra advisory del repository e GitHub Advisory Database globale.

## API / Sintassi

Schema informativo tipico:

```text
Affected versions: < 1.2.3
Patched versions: >= 1.2.3
Severity: high
Workaround: disabilitare feature X
```

Nel changelog o release:

```md
## Security

- Corregge validazione input in endpoint `/login`.
- Aggiornare almeno alla versione `1.2.3`.
```

## Esempio pratico

Per una libreria vulnerabile:

1. apri advisory privato;
2. invita maintainer necessari;
3. prepara patch in ramo privato o repository temporaneo;
4. pubblica nuova versione;
5. pubblica advisory con versioni corrette;
6. comunica mitigazioni agli utenti.

## Varianti

- **Private vulnerability reporting**: canale per segnalazioni private.
- **Repository advisory**: advisory legato al progetto.
- **Global advisory**: voce nel database GitHub.
- **CVE request**: richiesta identificatore, quando appropriato.
- **Coordinated disclosure**: pubblicazione dopo correzione.

## Errori comuni

- Discutere vulnerabilita pubblicamente prima della fix.
- Non indicare versioni affette.
- Non fornire workaround.
- Pubblicare advisory senza release corretta.
- Minimizzare severita senza analisi.
- Non collegare Dependabot o utenti alla versione patchata.

## Checklist

- La vulnerabilita e descritta chiaramente?
- Le versioni affette sono identificate?
- Esiste una versione corretta?
- Il workaround e documentato?
- La disclosure e coordinata?
- L'advisory e collegato a release o patch?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Dependabot]]
- [[Code scanning]]
- [[Secret scanning]]

## Fonti

- [GitHub Docs - Security advisories](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/fix-reported-vulnerabilities)
