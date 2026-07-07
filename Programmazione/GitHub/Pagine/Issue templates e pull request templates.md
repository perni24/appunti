---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [github, issue-template, pull-request-template, collaborazione]
aliases: [Issue templates, Pull request templates, Template GitHub]
prerequisites: [Issues GitHub, Pull request]
related: [Issues GitHub, Pull request]
---

# Issue templates e pull request templates

## Sintesi

Gli **issue templates** e i **pull request templates** guidano chi apre issue o PR a fornire informazioni utili. Riducono richieste incomplete, review confuse e bug report non riproducibili.

Un template buono non deve essere lungo: deve chiedere le informazioni che servono davvero per decidere o verificare.

## Quando usarlo

Usali quando:

- ricevi issue vaghe;
- vuoi standardizzare bug report e feature request;
- vuoi ricordare test e checklist nelle pull request;
- lavori con contributor esterni;
- vuoi ridurre tempo di triage;
- vuoi rendere espliciti criteri di accettazione.

## Come funziona

GitHub legge template in percorsi convenzionali del repository, di solito sotto `.github/`.

Esempi comuni:

```text
.github/ISSUE_TEMPLATE/bug_report.md
.github/ISSUE_TEMPLATE/feature_request.md
.github/pull_request_template.md
```

Quando una persona apre una issue o PR, GitHub precompila il corpo con il template.

## API / Sintassi

Template bug report:

```md
## Descrizione

## Passi per riprodurre

1.
2.
3.

## Risultato attuale

## Risultato atteso

## Ambiente
```

Template PR:

```md
## Cosa cambia

## Perche

## Verifica

- [ ] Test eseguiti
- [ ] Lint eseguito
- [ ] Documentazione aggiornata
```

## Esempio pratico

Per un progetto web, una PR dovrebbe sempre chiarire:

- cosa cambia;
- perche cambia;
- come e stata verificata;
- se ci sono screenshot;
- se cambia API, schema dati o configurazione;
- quali issue chiude.

Questo evita che la review parta leggendo solo il diff.

## Varianti

- **Bug report template**: passi, ambiente, risultato atteso.
- **Feature request template**: problema, proposta, alternative.
- **Security report template**: meglio spesso usare canali privati o security policy.
- **Pull request template unico**: semplice e pratico.
- **Template multipli**: utili in progetti grandi.

## Errori comuni

- Template troppo lunghi che nessuno compila.
- Chiedere informazioni non usate.
- Non aggiornare template quando cambia il workflow.
- Usare checkbox generiche senza significato.
- Non distinguere bug, feature e supporto.
- Mettere istruzioni che duplicano documentazione altrove.

## Checklist

- Il template riduce domande ripetute?
- Le sezioni sono brevi?
- I campi richiesti sono davvero necessari?
- La PR template chiede verifica e impatto?
- I template sono versionati nel repository?
- I maintainer li usano durante triage e review?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Issues GitHub]]
- [[Pull request]]
- [[Review code su GitHub]]
- [[Markdown su GitHub]]

## Fonti

- [GitHub Docs - Configuring issue templates](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository)
- [GitHub Docs - Creating a pull request template](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/creating-a-pull-request-template-for-your-repository)
