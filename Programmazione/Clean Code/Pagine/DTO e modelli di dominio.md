---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - clean-code
  - dto
  - dominio
aliases:
  - DTO e modelli di dominio
  - DTO vs domain models
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Modellazione del dominio]]"
  - "[[Programmazione/Clean Code/Pagine/Parsing e serializzazione]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Validazione input API]]"
  - "[[Programmazione/Clean Code/Pagine/Repository pattern]]"
  - "[[Programmazione/Clean Code/Pagine/Tipi significativi]]"
title: DTO e modelli di dominio
---

# DTO e modelli di dominio

## Sintesi

I **DTO** trasferiscono dati tra confini. I **modelli di dominio** rappresentano concetti, regole e invarianti del problema.

Confonderli porta a codice che espone dettagli interni o tratta regole di business come semplici campi.

## Problema che risolve

Usare lo stesso oggetto per API, database e dominio sembra comodo, ma crea accoppiamento:

- cambi una risposta API e rompi il dominio;
- cambi una tabella e rompi il contratto esterno;
- campi tecnici entrano nella logica di business;
- validazioni di trasporto vengono confuse con invarianti;
- dati esterni non affidabili arrivano troppo dentro il sistema.

## Concetto chiave

Un DTO descrive una forma di scambio. Un modello di dominio protegge comportamento e regole.

Il mapping tra i due e un costo esplicito che spesso compra chiarezza, stabilita e sicurezza.

## Dettagli importanti

- I DTO possono essere versionati in base alle API.
- I modelli di dominio dovrebbero mantenere invarianti.
- Un record database non e automaticamente un modello di dominio.
- Nei sistemi semplici la distinzione puo essere leggera.
- Nei sistemi complessi separare i modelli riduce accoppiamento.

## Esempio

DTO di input:

```js
{
  "email": "USER@EXAMPLE.COM",
  "displayName": "Luca"
}
```

Modello di dominio:

```js
const user = User.register({
  email: EmailAddress.parse(input.email),
  displayName: input.displayName,
});
```

Il DTO trasporta dati; il dominio valida e costruisce concetti significativi.

## Limiti

- Per CRUD molto semplici la separazione completa puo essere pesante.
- Troppi mapper possono diventare rumore.
- Se il dominio e povero, il modello separato non aggiunge valore.
- La duplicazione dei campi va gestita con test e convenzioni.

## Errori comuni

- Esporre direttamente entita database nelle API.
- Mettere metodi di business nei DTO.
- Usare DTO non validati come oggetti di dominio.
- Lasciare che il formato JSON determini il modello interno.
- Creare mapper opachi e non testati.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Modellazione del dominio|Modellazione del dominio]]
- [[Programmazione/Clean Code/Pagine/Parsing e serializzazione|Parsing e serializzazione]]
- [[Programmazione/Clean Code/Pagine/Validazione input API|Validazione input API]]
- [[Programmazione/Clean Code/Pagine/Tipi significativi|Tipi significativi]]
- [[Programmazione/Clean Code/Pagine/Repository pattern|Repository pattern]]

## Fonti

- Martin Fowler, *Data Transfer Object*
- Eric Evans, *Domain-Driven Design*
- Robert C. Martin, *Clean Architecture*
