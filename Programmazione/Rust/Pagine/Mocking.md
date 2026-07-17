---
date: 2026-05-28
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - testing-qualita-e-sicurezza
aliases:
  - "Mocking"
  - "Mock Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Trait objects e dyn Trait]]"
related:
  - "[[Programmazione/Rust/Pagine/Unit test]]"
  - "[[Programmazione/Rust/Pagine/Integration test]]"
  - "[[Programmazione/Rust/Pagine/Trait objects e dyn Trait]]"
---

# Mocking

## Sintesi

Il **mocking** consiste nel sostituire una dipendenza reale con una finta durante un test. In Rust si fa spesso usando trait, generics, trait object o implementazioni fake scritte a mano.

Il mocking serve a isolare logica applicativa da rete, database, filesystem, clock o servizi esterni. Va usato con misura: troppi mock possono rendere i test scollegati dal comportamento reale.

## Quando usarlo

Usa mocking quando:

- una dipendenza e lenta o non deterministica;
- vuoi testare errori difficili da produrre con la dipendenza reale;
- devi evitare rete, database o filesystem in unit test;
- vuoi controllare clock o randomness;
- devi verificare logica di retry o fallback;
- vuoi testare un service senza avviare tutta l'applicazione.

Preferisci integration test reali quando il valore del test dipende proprio dall'integrazione.

## Come funziona

Il pattern piu idiomatico e definire un trait piccolo per la dipendenza necessaria:

- il codice di produzione riceve qualcosa che implementa il trait;
- il test passa una implementazione fake;
- il trait espone solo le operazioni richieste dal dominio;
- il fake restituisce risultati controllati.

In Rust spesso i fake manuali sono piu semplici e leggibili di un framework di mocking.

## API / Sintassi

Trait piccolo:

```rust
trait EmailSender {
    fn send(&self, to: &str, body: &str) -> Result<(), String>;
}

fn notify_user(sender: &impl EmailSender, email: &str) -> Result<(), String> {
    sender.send(email, "welcome")
}
```

Fake per test:

```rust
struct FakeEmailSender {
    should_fail: bool,
}

impl EmailSender for FakeEmailSender {
    fn send(&self, _to: &str, _body: &str) -> Result<(), String> {
        if self.should_fail {
            Err("send failed".to_string())
        } else {
            Ok(())
        }
    }
}
```

## Esempio pratico

Testare fallback:

```rust
trait Clock {
    fn now_seconds(&self) -> u64;
}

fn is_expired(clock: &impl Clock, deadline: u64) -> bool {
    clock.now_seconds() >= deadline
}

struct FixedClock {
    now: u64,
}

impl Clock for FixedClock {
    fn now_seconds(&self) -> u64 {
        self.now
    }
}

#[test]
fn detects_expired_deadline() {
    let clock = FixedClock { now: 100 };
    assert!(is_expired(&clock, 90));
}
```

Il test non dipende dall'orologio reale, quindi e deterministico.

## Varianti

- **Fake manuale**: implementazione semplice e leggibile.
- **Stub**: restituisce valori predefiniti.
- **Spy**: registra chiamate ricevute.
- **Mock con aspettative**: verifica chiamate e parametri.
- **Trait object**: dipendenza dinamica con `dyn Trait`.
- **Generic parameter**: dipendenza statica e spesso zero-cost.

## Errori comuni

- Mockare tutto e non testare mai integrazioni reali.
- Creare trait enormi solo per i test.
- Verificare dettagli di implementazione invece del comportamento.
- Usare mock per nascondere un design troppo accoppiato.
- Duplicare nel fake la stessa logica della dipendenza reale.
- Rendere i test fragili controllando ordine di chiamate non rilevante.
- Dimenticare test con errori reali di I/O o database.

## Checklist

- Il trait rappresenta una dipendenza piccola?
- Il test verifica comportamento, non implementazione?
- Il fake e piu semplice della dipendenza reale?
- Esistono anche integration test con dipendenze reali?
- Errori e timeout sono simulati?
- Il mock non nasconde problemi di design?
- Il test resta leggibile senza conoscere framework esterni?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Traits]]
- [[Programmazione/Rust/Pagine/Trait objects e dyn Trait]]
- [[Programmazione/Rust/Pagine/Unit test]]
- [[Programmazione/Rust/Pagine/Integration test]]
- [[Programmazione/Rust/Pagine/Error handling idiomatico]]
