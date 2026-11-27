---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - github
  - repository
  - migrazione
  - manutenzione
aliases:
  - Migrazione repository GitHub
  - Migrare repository GitHub
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Repository GitHub]]"
  - "[[Programmazione/GitHub/Pagine/GitHub REST API]]"
related:
  - "[[Programmazione/GitHub/Pagine/Archiviazione repository GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Governance repository GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Repository settings]]"
title: Migrazione repository GitHub
---

# Migrazione repository GitHub

## Sintesi

**Trasferire** cambia il proprietario dello stesso repository GitHub. **Duplicare con Git** crea una copia di oggetti e riferimenti in un altro repository. Scegliere in base a ciò che deve sopravvivere, non soltanto al fatto che la cronologia del codice sia visibile alla fine.

## Quale strada scegliere

| Obiettivo | Strumento | Cosa non dare per scontato |
| --- | --- | --- |
| Passare da un account a un'organizzazione su GitHub | Trasferimento del repository | Restano associati elementi come issue, PR, wiki, stelle, webhook, secret e deploy key. Verificare permessi ereditati, integrazioni e policy del nuovo owner. |
| Copiare la cronologia Git su un'altra destinazione | Mirror Git | Non trasferisce issue, discussioni, metadati delle PR, asset delle release, permessi o binari LFS. La wiki è un repository Git separato. |
| Migrare da un'altra piattaforma con i relativi dati | Strumento di importazione compatibile con l'origine | Distinguere l'importazione della storia Git dalla migrazione dei metadati. Per Enterprise Importer verificare matrice di supporto, mapping degli utenti, esclusioni e log prima del passaggio definitivo. |

## Esempio: trasferimento a un'organizzazione

1. Verificare autorizzazioni di chi trasferisce e di chi riceve, disponibilità del nome e vincoli della rete di fork. Concordare una finestra e inventariare nomi e utilizzatori delle credenziali, **senza copiarne i valori**.
2. Eseguire il transfer dalle impostazioni GitHub e completare l'eventuale accettazione. Il vecchio URL del repository può reindirizzare al nuovo; **l'URL del sito Pages non viene reindirizzato dal transfer**. Non riutilizzare il vecchio nome: si perde il redirect.
3. Aggiornare i clone locali. Questo comando modifica soltanto `origin` nel clone corrente; **non trasferisce** alcun repository:

```bash
git remote set-url origin https://github.com/NEW_OWNER/REPOSITORY.git
```

4. Con un account dal ruolo rappresentativo, verificare lettura, accessi attesi, PR, tag, branch protetti, Actions, package e Pages, incluso il dominio personalizzato. Aggiornare badge e link esterni.

## Alternativa: controllare un mirror prima di scrivere

Per una copia **solo Git**, scegliere una destinazione nuova, vuota e dedicata. Sostituire i nomi di esempio. Il clone seguente scarica i riferimenti esposti dalla sorgente in una directory locale senza working tree:

```bash
git clone --mirror https://github.com/OLD_OWNER/REPOSITORY.git progetto.git
```

Simulare l'invio senza aggiornare i riferimenti sulla destinazione:

```bash
git -C progetto.git push --dry-run --mirror https://github.com/NEW_OWNER/REPOSITORY.git
```

`--mirror` non significa «aggiungi solo ciò che manca»: senza `--dry-run` può **forzare aggiornamenti ed eliminare riferimenti presenti solo a destinazione**. Fermarsi davanti a cancellazioni inattese. Alcuni riferimenti gestiti dall'host non sono scrivibili; un dry run non garantisce l'accettazione da parte del server reale. LFS richiede una procedura separata per gli oggetti.

## Criterio di completamento

Confrontare i commit di punta dei branch e i tag necessari. Aprire una PR storica, scaricare un asset atteso e provare gli URL usati dai consumatori **se erano nel perimetro concordato**. Finché i controlli non sono superati, conservare la sorgente e indicare al team quale copia usare per le nuove modifiche.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Repository GitHub|Repository GitHub]]
- [[Programmazione/GitHub/Pagine/Remote origin e upstream|Remote origin e upstream]]
- [[Programmazione/GitHub/Pagine/Repository settings|Repository settings]]
- [[Programmazione/GitHub/Pagine/Archiviazione repository GitHub|Archiviazione repository GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub REST API|GitHub REST API]]
- [[Programmazione/GitHub/Pagine/GitHub Actions|GitHub Actions]]

## Fonti

- [GitHub Docs: trasferire un repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/transferring-a-repository)
- [GitHub Docs: duplicare un repository, incluso LFS](https://docs.github.com/en/repositories/creating-and-managing-repositories/duplicating-a-repository)
- [GitHub Docs: pianificare una migrazione](https://docs.github.com/en/migrations/overview/planning-your-migration-to-github)
- [Git: semantica di push --mirror](https://git-scm.com/docs/git-push)
