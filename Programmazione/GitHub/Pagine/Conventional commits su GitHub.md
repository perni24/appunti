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
  - git
  - conventional-commits
  - changelog
aliases:
  - Conventional commits su GitHub
  - Conventional Commits
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Commit e cronologia su GitHub]]"
related:
  - "[[Programmazione/GitHub/Pagine/Commit e cronologia su GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Pull request]]"
title: Conventional commits su GitHub
---

# Conventional commits su GitHub

## Sintesi

**Conventional Commits** descrive il significato di una modifica nel messaggio del commit. Non è un requisito di GitHub: è utile se un lettore, un generatore di changelog o uno strumento di release deve distinguere una correzione, una nuova funzionalità e un’incompatibilità.

## Come scegliere il messaggio

L’intestazione ha un tipo, uno scope facoltativo tra parentesi, un eventuale `!`, poi `: ` e una descrizione. Scegli il tipo in base **all’effetto della modifica**, non al nome della cartella.

| Modifica | Messaggio di esempio | Significato |
| --- | --- | --- |
| Ripristina il comportamento documentato | `fix(export): conserva l’intestazione nel CSV vuoto` | Correzione compatibile; corrisponde a PATCH nella mappatura SemVer. |
| Aggiunge un’opzione senza cambiare il default | `feat(export): permette di scegliere il separatore` | Nuova funzionalità compatibile; corrisponde a MINOR. |
| Migliora la guida | `docs(export): documenta il caso senza righe` | Tipo convenzionale aggiuntivo; da solo non impone un incremento SemVer. |

`refactor`, `test`, `build`, `ci`, `chore` e `style` sono altri tipi comunemente concordati dal team, non una lista chiusa imposta dalla specifica. Un’incompatibilità può accompagnare **qualsiasi** tipo: se usi SemVer per un’API stabile, corrisponde a MAJOR.

## Esempio: rendere esplicita una migrazione

Se il nome di una colonna è parte del contratto pubblico, rinominarla rompe i lettori che la cercano con il vecchio nome. Ecco il **messaggio completo** di un singolo commit:

```text
feat(export)!: rinomina la colonna name in displayName

Allinea le intestazioni CSV al contratto pubblico della nuova API.

BREAKING CHANGE: i lettori CSV devono usare displayName al posto di name.
```

Il `!` nell’intestazione **o** il footer `BREAKING CHANGE:` sono sufficienti a segnalare la rottura. Usarli entrambi permette di vederla nel log breve e spiegare la migrazione nel messaggio completo. Il footer è separato dal corpo con una riga vuota. Per leggere l’ultimo messaggio effettivamente registrato:

```bash
git log -1 --format=%B
```

## Che cosa arriva su main?

Con **Squash and merge** su GitHub entra un nuovo commit. Il messaggio proposto dipende dalle impostazioni del repository e può essere modificato: un titolo di PR convenzionale è utile, ma controlla anche il **messaggio finale**, soprattutto se la migrazione era descritta soltanto in un commit intermedio. Se il progetto analizza i commit di `main`, è quello il testo letto dall’automazione. La convenzione da sola non crea tag, non pubblica una release e non esegue controlli: queste operazioni richiedono strumenti configurati.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Commit e cronologia su GitHub|Commit e cronologia su GitHub]]
- [[Programmazione/GitHub/Pagine/Pull request|Pull request]]
- [[Programmazione/GitHub/Pagine/Merge squash e rebase su GitHub|Merge squash e rebase su GitHub]]

## Fonti

- [Conventional Commits - Specification](https://www.conventionalcommits.org/en/v1.0.0/)
- [GitHub Docs: configurare il messaggio di squash](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/configuring-commit-squashing-for-pull-requests)
