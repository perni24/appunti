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
  - branch-protection
  - repository
  - sicurezza
aliases:
  - Branch protection rules
  - Protezione branch GitHub
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Branch su GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Pull request]]"
related:
  - "[[Programmazione/GitHub/Pagine/Required status checks]]"
  - "[[Programmazione/GitHub/Pagine/Repository rulesets]]"
title: Branch protection rules
---

# Branch protection rules

## Sintesi

Una **branch protection rule** classica stabilisce a quali condizioni GitHub accetta un aggiornamento di un branch. Proteggere `main` non significa rendere il clone di sola lettura: puoi creare un branch e fare commit in locale. La protezione interviene sul repository remoto. **Richiedere una PR**, **richiedere un’approvazione** e **richiedere un check** sono tre scelte distinte.

## Esempio: una correzione alla guida

Vuoi che una modifica a `main` passi da una PR, che un collega la approvi e che la documentazione venga verificata. Per configurare la regola servono i permessi di amministrazione del repository o un ruolo autorizzato a modificarne le regole. La disponibilità dipende dal piano e dalla visibilità del repository.

| Risultato voluto | Che cosa configurare | Che cosa verificare |
| --- | --- | --- |
| Nessuna modifica ordinaria direttamente su `main` | In **Settings → Branches** crea una regola classica per il nome esatto `main` e richiedi una PR. | La PR deve avere `main` come **base**; il nome del branch di lavoro è irrilevante. |
| Un’altra persona ha letto il diff | Richiedi un’approvazione. Per file con owner, richiedi anche la review dei code owner se è parte della policy. | Un commento o una richiesta di review non sono un’approvazione. In un progetto individuale serve un altro revisore idoneo per soddisfare questa regola. |
| La versione proposta supera un test | Rendilo un **required status check** dopo averlo visto eseguito su una PR. | Un test verde su un commit precedente o un deploy dopo il merge non verificano la modifica corrente. |
| La storia condivisa non viene riscritta o cancellata | Mantieni disabilitati force push e cancellazione sul branch protetto. | L’eliminazione del branch di lavoro dopo il merge è un’altra impostazione: non elimina `main`. |

Se vuoi che i vincoli valgano anche per gli amministratori, controlla l’opzione che applica le regole senza eccezione a quei ruoli. Se le approvazioni devono riferirsi al codice appena cambiato, scegli consapevolmente fra annullare le approvazioni diventate obsolete e richiedere l’approvazione dell’ultimo push da parte di un’altra persona.

## Quale regola si applica?

Tra regole **classiche** se ne applica una sola per branch: il nome esatto ha precedenza sul pattern; a parità di nome esatto prevale la regola creata prima. Le regole con caratteri jolly sono valutate secondo l’ordine di creazione. `release/*` copre `release/1.x` ma non `release/mobile/1.x`, perché `*` non attraversa `/`. Non dare per scontato che due regole classiche sommino le proprie condizioni. I **ruleset**, invece, possono aggiungere ulteriori vincoli alla protezione classica.

## Come controllare senza cambiare impostazioni

Nel browser apri le impostazioni del repository e confronta il branch base con la regola; `gh repo view --web` apre il **repository**, non la schermata delle protezioni. Nella PR leggi separatamente i motivi del blocco: approvazioni, conversazioni, check e aggiornamento rispetto alla base. Un requisito non soddisfatto resta tale anche se tutti gli altri sono verdi.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Branch su GitHub|Branch su GitHub]]
- [[Programmazione/GitHub/Pagine/Pull request|Pull request]]
- [[Programmazione/GitHub/Pagine/Review code su GitHub|Review code su GitHub]]
- [[Programmazione/GitHub/Pagine/Required status checks|Required status checks]]
- [[Programmazione/GitHub/Pagine/Repository rulesets|Repository rulesets]]

## Fonti

- [GitHub Docs: protezioni dei branch e opzioni di review](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Docs: precedenza delle regole e pattern](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule)
- [GitHub CLI: cosa apre gh repo view](https://cli.github.com/manual/gh_repo_view)
