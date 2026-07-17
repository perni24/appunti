---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [clean-code, oggetti, responsabilita]
aliases: [Oggetti con responsabilita chiara, Responsabilita degli oggetti]
prerequisites: [Clean Code]
related: [Data objects e behavior objects, Invarianti del dominio, Funzioni con responsabilita singola]
---

# Oggetti con responsabilita chiara

## Sintesi

Un **oggetto con responsabilita chiara** rappresenta un concetto preciso e contiene solo dati e comportamento coerenti con quel concetto.

La chiarezza della responsabilita riduce accoppiamento, duplicazione e confusione tra livelli applicativi.

## Problema che risolve

Oggetti con responsabilita confuse diventano contenitori generici: fanno validazione, accesso dati, calcolo, logging, mapping e comunicazione esterna.

Quando un oggetto fa troppe cose, ogni modifica rischia di avere effetti non previsti.

## Concetto chiave

Un oggetto dovrebbe avere una risposta chiara alla domanda:

```text
Di cosa e responsabile?
```

Una responsabilita chiara si vede da:

- nome dell'oggetto;
- metodi pubblici;
- dati interni;
- dipendenze;
- motivi per cambiare.

Se questi elementi puntano in direzioni diverse, l'oggetto e probabilmente confuso.

## Dettagli importanti

- Un oggetto di dominio non dovrebbe conoscere dettagli di framework.
- Un DTO non dovrebbe contenere regole complesse.
- Un service non dovrebbe diventare un deposito di logica casuale.
- Le responsabilita dovrebbero seguire il linguaggio del dominio.
- La coesione e piu importante della dimensione assoluta.

## Esempio

Responsabilita confuse:

```text
UserManager:
- valida input
- salva su database
- invia email
- calcola sconti
- genera report
```

Responsabilita separate:

```text
UserRegistration
UserRepository
WelcomeEmailSender
DiscountPolicy
UserReport
```

Ogni concetto ha un motivo piu chiaro per cambiare.

## Limiti

- Separare troppo puo creare molti oggetti piccoli ma poco utili.
- Alcuni oggetti orchestrano piu collaboratori ed e normale.
- Il confine corretto puo cambiare quando il dominio diventa piu chiaro.
- Una responsabilita non coincide sempre con una singola classe.

## Errori comuni

- Usare nomi come `Manager`, `Helper`, `Utils` per responsabilita non definite.
- Inserire logica di dominio nei controller.
- Mettere accesso database dentro oggetti di dominio.
- Rendere gli oggetti solo sacchi di getter e setter.
- Separare per tipo tecnico invece che per concetto.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Data objects e behavior objects]]
- [[Invarianti del dominio]]
- [[Funzioni con responsabilita singola]]
- [[Manutenibilita del codice]]

## Fonti

- Rebecca Wirfs-Brock, *Object Design*
- Eric Evans, *Domain-Driven Design*
