---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: operational-note
status: "non revisionato"
difficulty: base
tags: [github, pull-request, checklist, review]
aliases: [Checklist pull request GitHub, Checklist PR GitHub]
prerequisites: [Pull request, Aprire una pull request corretta]
related: [Review code su GitHub, Required status checks, CODEOWNERS]
---

# Checklist pull request GitHub

## Obiettivo

Controllare che una pull request sia pronta per la review o per il merge, riducendo ambiguita, regressioni e lavoro inutile per chi revisiona.

Una PR pronta deve spiegare cosa cambia, perche cambia, come e stata verificata e quali rischi porta.

## Quando usarlo

- Prima di chiedere review.
- Prima di fare merge.
- Quando una PR resta bloccata.
- Quando una PR e troppo grande o poco chiara.
- Quando devi standardizzare il processo di review del team.

## Procedura

1. Controlla titolo e descrizione.
2. Verifica dimensione e coerenza della modifica.
3. Controlla issue collegate.
4. Verifica test, lint e build.
5. Controlla file modificati uno per uno.
6. Risolvi commenti e conversazioni.
7. Verifica branch aggiornato e conflitti.
8. Controlla metodo di merge previsto.

## Snippet

Checklist per descrizione PR:

```md
## Cosa cambia
- [ ] Modifica descritta in modo chiaro

## Perche
- [ ] Motivazione o issue collegata

## Verifica
- [ ] Test locali
- [ ] CI passata
- [ ] Caso manuale verificato se serve

## Rischi
- [ ] Breaking change indicate
- [ ] Migrazioni documentate
```

## Adattamenti comuni

- **PR piccola**: descrizione breve ma test chiari.
- **PR grande**: spiega strategia, file principali e ordine di review.
- **PR draft**: indica cosa manca prima della review finale.
- **PR di fix urgente**: documenta rischio e piano di rollback.
- **PR da fork**: controlla permessi, secret e workflow eseguiti.

## Debug rapido

- Se i reviewer non capiscono la PR, aggiungi contesto e screenshot/log se utili.
- Se la CI fallisce, non chiedere merge senza spiegazione.
- Se ci sono troppi file, valuta split in PR piu piccole.
- Se la PR e bloccata da review, controlla CODEOWNERS e reviewer richiesti.
- Se ci sono conflitti, aggiorna il branch prima della review finale.

## Checklist finale

- Titolo chiaro.
- Descrizione completa.
- Issue collegata se esiste.
- Diff controllato.
- Test e CI verificati.
- Review richieste assegnate.
- Conversazioni risolte.
- Nessun file accidentale.
- Merge strategy coerente.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Pull request]]
- [[Aprire una pull request corretta]]
- [[Review code su GitHub]]
- [[Required status checks]]
- [[CODEOWNERS]]
- [[Merge squash e rebase su GitHub]]

## Fonti

- [GitHub Docs - Creating a pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request)
