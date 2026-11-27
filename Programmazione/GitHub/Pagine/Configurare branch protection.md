---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: operational-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - github
  - branch-protection
  - repository
  - procedura
aliases:
  - Configurare branch protection
  - Configurare protezione branch GitHub
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Branch protection rules]]"
  - "[[Programmazione/GitHub/Pagine/Required status checks]]"
related:
  - "[[Programmazione/GitHub/Pagine/Repository rulesets]]"
  - "[[Programmazione/GitHub/Pagine/CODEOWNERS]]"
  - "[[Programmazione/GitHub/Pagine/Configurare una pipeline CI con GitHub Actions]]"
title: Configurare branch protection
---

# Configurare branch protection

## Obiettivo

Far sì che una modifica a `main` richieda **una PR, il check corretto e, se il team lo prevede, un'approvazione**. La spunta verde di un deploy successivo al merge non può essere usata come prova prima del merge.

## Prerequisiti

Occorre il permesso di amministrare le regole; disponibilità e opzioni dipendono da piano e visibilità. Verificare il nome del branch predefinito. Usare un repository di prova per la prima configurazione: una regola sbagliata può bloccare tutte le PR.

## Procedura: protezione classica

1. **Preparare il check.** Su una PR verso `main`, far riuscire il job che dovrà diventare obbligatorio. Se si usa l'esempio in [[Programmazione/GitHub/Pagine/Pipeline CI GitHub Actions|Pipeline CI GitHub Actions]], il nome del job è `Validazione appunti`. Non selezionare `deploy` del workflow Pages, che nel vault non parte sulle PR.
2. **Scegliere la regola.** In *Settings → Branches* aggiungere una regola di protezione classica con pattern esatto `main`, oppure modificare quella già applicabile. I *ruleset* sono un'alternativa distinta: verificarne stato, target e bypass in *Settings → Rules → Rulesets*. Evitare regole sovrapposte senza sapere quali vincoli resteranno effettivi.
3. **Impostare il requisito di review.** Abilitare *Require a pull request before merging*. Se esiste un secondo revisore abilitato, richiedere per esempio un'approvazione. Chi apre una PR non può approvare la propria: per un progetto individuale si può richiedere la PR e la CI senza richiedere approvazioni. Per una review obbligatoria dei code owner serve anche l'apposita opzione, non basta avere `CODEOWNERS`.
4. **Richiedere il risultato giusto.** Attivare i required status checks, selezionare il nome esatto e, dove opportuno, la sorgente attesa. *Require branches to be up to date* è una scelta separata: riduce il rischio di incompatibilità con la base ma può richiedere aggiornamenti e nuove esecuzioni.
5. **Verificare le eccezioni prima di salvare.** Lasciare disabilitati force push ed eliminazione per il branch protetto. Decidere chi, se qualcuno, può fare bypass; una prova come amministratore può non riflettere i vincoli di un normale collaboratore.

## Prova di accettazione

Su una PR di prova, con un account soggetto alla regola, verificare **prima** che un check fallito blocchi il merge e **poi** che, corretto il problema, il nuovo commit riceva il proprio check. Se è richiesta anche una review, il solo check verde non deve sbloccare il merge. Basta osservare i requisiti nella PR: non serve fondere la modifica né tentare un force push su `main`.

## Debug rapido

| Sintomo | Cosa verificare |
| --- | --- |
| Il check non è selezionabile | Deve essere riuscito nel repository negli ultimi sette giorni. Controllare il nome del job, non solo il titolo del workflow, ed evitare nomi ambigui tra workflow. |
| Il check resta atteso | Verificare filtri di branch o percorsi: se saltano l'intero workflow, il check obbligatorio può restare in attesa. Con la merge queue prevedere anche `merge_group`. |
| Una PR sembra ignorare la regola | Verificare branch base, pattern, bypass e ruleset attivi. Se manca la review del code owner, controllare anche il file sul branch base e i permessi dei proprietari. |

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Branch protection rules|Branch protection rules]]
- [[Programmazione/GitHub/Pagine/Required status checks|Required status checks]]
- [[Programmazione/GitHub/Pagine/Repository rulesets|Repository rulesets]]
- [[Programmazione/GitHub/Pagine/CODEOWNERS|CODEOWNERS]]
- [[Programmazione/GitHub/Pagine/Repository settings|Repository settings]]
- [[Programmazione/GitHub/Pagine/Configurare una pipeline CI con GitHub Actions|Configurare una pipeline CI con GitHub Actions]]

## Fonti

- [GitHub Docs: gestire la protezione classica](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule)
- [GitHub Docs: diagnosi dei check obbligatori](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks)
- [GitHub Docs: regole disponibili nei ruleset](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)
