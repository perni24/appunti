---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
difficulty: intermedio
tags: [clean-code, solid, design]
aliases: [SOLID, Principi SOLID]
prerequisites: [Separazione delle responsabilita]
related: [Dependency Inversion Principle, Interface Segregation Principle, Coesione e accoppiamento]
---

# SOLID

## Sintesi

**SOLID** e un insieme di cinque principi di design orientati a rendere il codice piu comprensibile, estendibile e meno accoppiato.

Non e una checklist da applicare meccanicamente: e un linguaggio per ragionare su responsabilita, dipendenze e cambiamento.

## Problema che risolve

Sistemi con classi grandi, dipendenze rigide e interfacce confuse diventano difficili da evolvere.

SOLID aiuta a identificare dove il design rende costoso aggiungere o modificare comportamento.

## Concetto chiave

I cinque principi sono:

- **S**: Single Responsibility Principle;
- **O**: Open Closed Principle;
- **L**: Liskov Substitution Principle;
- **I**: Interface Segregation Principle;
- **D**: Dependency Inversion Principle.

Il tema comune e progettare componenti con responsabilita chiare e dipendenze controllate.

## Dettagli importanti

- SRP riguarda motivi di cambiamento, non numero di metodi.
- OCP suggerisce estensione senza modifiche continue al codice stabile.
- LSP protegge sostituibilita e correttezza delle astrazioni.
- ISP evita interfacce troppo grandi.
- DIP riduce dipendenza da dettagli concreti.

## Esempio

Violazione tipica:

```text
ReportService dipende direttamente da PdfExporter, EmailClient e Database.
```

Design piu flessibile:

```text
ReportService dipende da interfacce:
- ReportRepository
- ReportExporter
- NotificationSender
```

Il servizio conosce contratti, non dettagli specifici.

## Limiti

- SOLID nasce in contesto object-oriented, ma molte idee sono trasferibili.
- Applicarlo troppo presto puo generare astrazioni inutili.
- Non sostituisce modellazione del dominio.
- Non ogni classe deve essere progettata per estensione.

## Errori comuni

- Applicare SOLID come dogma.
- Creare interfacce per ogni classe senza motivo.
- Confondere SRP con funzioni minuscole.
- Usare DIP per nascondere dipendenze invece che controllarle.
- Cercare estendibilita dove serve solo semplicita.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Separazione delle responsabilita]]
- [[Dependency Inversion Principle]]
- [[Interface Segregation Principle]]
- [[Coesione e accoppiamento]]
- [[Code smells]]

## Fonti

- Robert C. Martin, *Agile Software Development, Principles, Patterns, and Practices*
- Robert C. Martin, *Clean Architecture*
