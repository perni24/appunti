---
date: 2026-05-28
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - testing-qualita-e-sicurezza
aliases:
  - Mocking
  - Mock Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Traits|Traits]]"
  - "[[Programmazione/Rust/Pagine/Trait objects e dyn Trait|Trait objects e dyn Trait]]"
related:
  - "[[Programmazione/Rust/Pagine/Unit test|Unit test]]"
  - "[[Programmazione/Rust/Pagine/Integration test|Integration test]]"
  - "[[Programmazione/Rust/Pagine/Trait objects e dyn Trait|Trait objects e dyn Trait]]"
title: Mocking
---

# Mocking

## Sintesi

Un servizio di promemoria deve lasciare in pace il destinatario **prima** della scadenza e inviare un solo messaggio **quando la scadenza è raggiunta**. Per provarlo non servono né un minuto di attesa né una casella di posta: al posto dell'orologio puoi fornire un'ora fissa, al posto del mittente puoi verificare a chi il servizio chiede di scrivere.

Entrambe le sostituzioni sono *test double*, ma solo la seconda ha bisogno di aspettative sulle chiamate. Se il mittente restituisse sempre `Ok(())`, il test potrebbe passare anche inviando il promemoria alla persona sbagliata.

## Quando usarlo

Sostituisci una dipendenza quando non controlli un input (ora, casualità), un effetto sarebbe costoso o indesiderato (rete, scrittura su disco), oppure vuoi riprodurre un errore preciso. Se invece vuoi sapere se il server accetta il messaggio, la domanda riguarda l'adattatore reale: serve un [[Programmazione/Rust/Pagine/Integration test|test di integrazione]], non un mock che risponde come gli hai detto tu.

## Come funziona

Scegli il sostituto in base a **ciò che vuoi osservare**. I termini descrivono il ruolo assunto nel test, non una gerarchia di tipi di Rust.

| Tipo | Che cosa offre al test | Esempio |
| --- | --- | --- |
| Stub | Una risposta prestabilita. | Un orologio che restituisce sempre `100`. |
| Fake | Un'implementazione semplificata ma funzionante: verifichi lo stato che produce. | Una casella in memoria dove depositare e poi leggere i messaggi. Non prova la consegna via rete. |
| Spy | Registra ciò che è avvenuto; il test ispeziona i dati **dopo** l'azione. | Una lista degli invii, sulla quale controlli destinatario e numero di messaggi. |
| Mock | Prima dell'azione dichiari le chiamate attese; verifichi anche che siano avvenute. | Un mittente che accetta un solo invio a un certo indirizzo e rifiuta gli altri. |

Se il risultato della funzione o lo stato del fake bastano a rilevare l'errore, puoi fermarti lì. Per il promemoria, invece, *a chi* viene spedita la mail e *quante* mail partono sono effetti visibili all'utente.

## Esempio pratico

### 1. Separare l'orologio dal mittente

Da una directory di lavoro, crea una libreria senza dipendenze esterne:

```sh
cargo new --lib --vcs none reminder_notes
```

Sostituisci `reminder_notes/src/lib.rs` con questo codice. Il valore di ritorno distingue «non ancora dovuto» da «inviato»; se il mittente fallisce, il chiamante riceve un errore. La regola vale **per una singola invocazione**: non c'è un archivio che impedisca invii successivi per la stessa scadenza.

```rust
pub trait Clock {
    fn now_seconds(&self) -> u64;
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SendError;

pub trait EmailSender {
    fn send(&mut self, to: &str, body: &str) -> Result<(), SendError>;
}

#[derive(Debug, PartialEq, Eq)]
pub enum Notice {
    NotDue,
    Sent,
}

pub fn notify_if_due(
    clock: &impl Clock,
    sender: &mut impl EmailSender,
    deadline: u64,
    to: &str,
) -> Result<Notice, SendError> {
    if clock.now_seconds() < deadline {
        return Ok(Notice::NotDue);
    }
    sender.send(to, "Reminder")?;
    Ok(Notice::Sent)
}

#[cfg(test)]
mod tests;
```

### 2. Dichiarare l'interazione attesa

Crea `reminder_notes/src/tests.rs`. L'orologio è uno stub. Il mittente è un mock manuale: `Some((to, body))` significa «attendo esattamente questo invio»; `None` significa «non deve partire nulla». La risposta è configurabile anche per il caso di errore.

```rust
use super::*;

struct FixedClock(u64);

impl Clock for FixedClock {
    fn now_seconds(&self) -> u64 { self.0 }
}

struct ExpectedMail {
    expected: Option<(&'static str, &'static str)>,
    reply: Result<(), SendError>,
}

impl EmailSender for ExpectedMail {
    fn send(&mut self, to: &str, body: &str) -> Result<(), SendError> {
        let expected = self.expected.take().expect("unexpected send");
        assert_eq!((to, body), expected, "wrong message");
        self.reply
    }
}

impl ExpectedMail {
    fn verify(self) {
        assert!(self.expected.is_none(), "missing send");
    }
}
```

`take()` consuma l'aspettativa: un secondo invio è un errore. Ma se il servizio **non chiama mai** il mittente, nessuna asserzione dentro `send` può scoprirlo. È per questo che ogni test termina con `verify()`.

### 3. Provare il confine e l'errore

Aggiungi questi tre test in fondo allo stesso `src/tests.rs`. Il secondo usa proprio `100`, non `101`: solo il valore di confine distingue «alla scadenza» da «dopo la scadenza».

```rust
const TO: &str = "reader@example.org";

#[test]
fn skips_before_deadline() {
    let mut mail = ExpectedMail { expected: None, reply: Ok(()) };
    assert_eq!(notify_if_due(&FixedClock(99), &mut mail, 100, TO), Ok(Notice::NotDue));
    mail.verify();
}

#[test]
fn sends_at_deadline() {
    let mut mail = ExpectedMail { expected: Some((TO, "Reminder")), reply: Ok(()) };
    assert_eq!(notify_if_due(&FixedClock(100), &mut mail, 100, TO), Ok(Notice::Sent));
    mail.verify();
}

#[test]
fn propagates_sender_error() {
    let mut mail = ExpectedMail { expected: Some((TO, "Reminder")), reply: Err(SendError) };
    assert_eq!(notify_if_due(&FixedClock(101), &mut mail, 100, TO), Err(SendError));
    mail.verify();
}
```

Dalla directory in cui hai creato la libreria, esegui:

```sh
cargo test --manifest-path reminder_notes/Cargo.toml --lib
```

Devono passare **tre test**, senza usare rete o orologio di sistema. **Controprova:** nel servizio elimina la sola riga `sender.send(to, "Reminder")?;` e riesegui il comando. Il test al confine riceve ancora `Sent`, ma fallisce con `missing send`; il test sull'errore riceve `Ok(Sent)` invece di `Err(SendError)`. Ripristina la riga dopo la prova.

## Varianti e limiti

- **Passare un valore anziché un trait.** Se la funzione deve solo confrontare due istanti, passale direttamente `now` e `deadline`. Qui il trait serve perché è il servizio a leggere l'ora.
- **Scegliere il dispatch.** Un parametro `&impl Clock` è generico: il tipo concreto è noto a compilazione. Usa `&dyn Clock` se devi scegliere fra orologi di tipi diversi a runtime. Non è necessario il dispatch dinamico per usare un mock.
- **Registrare una chiamata attraverso `&self`.** Qui `send` accetta `&mut self`, quindi basta modificare il campo direttamente. Se l'interfaccia reale richiede `&self`, uno spy locale può usare [[Programmazione/Rust/Pagine/RefCell T|RefCell]] per aggiornare il registro. Non cambiare il contratto di produzione solo per comodità del test.
- **Retry e fallback.** Per provare un retry configura due risposte in sequenza (errore, poi successo) e verifica il risultato; per un fallback verifica che la seconda dipendenza intervenga solo dopo il fallimento della prima. Il servizio mostrato **propaga** l'errore: non implementa nessuno dei due.

## Errori comuni

- Verificare quante volte si legge l'ora senza che il requisito lo imponga. Un refactoring innocuo romperebbe il test; qui conta il numero di mail, non il numero di letture.
- Copiare nel mock la condizione `now >= deadline`: se servizio e mock condividono lo stesso errore, il test rischia di confermarlo. Specifica le aspettative con esempi concreti.
- Considerare `Sent` una prova di consegna reale. Nei test indica soltanto che il servizio ha ottenuto un esito positivo dal mittente sostitutivo.

## Checklist

- Il caso di confine sarebbe ancora verde se cambiassi `<` in `<=`? In questo esempio deve diventare rosso.
- Il test fallisce sia per un invio mancante sia per uno inatteso o con destinatario errato?
- Il chiamante vede la differenza tra «non dovuto» ed «errore di invio»?
- Il comportamento del vero adattatore è verificato separatamente quando serve?

## Fonti

- [Martin Fowler: Test Double e distinzione tra stub, fake, spy e mock](https://martinfowler.com/bliki/TestDouble.html)
- [The Rust Programming Language: test double e mutabilità interna](https://doc.rust-lang.org/book/ch15-05-interior-mutability.html)
- [The Rust Reference: impl Trait nei parametri](https://doc.rust-lang.org/reference/types/impl-trait.html)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Trait objects e dyn Trait|Trait objects e dyn Trait]]
- [[Programmazione/Rust/Pagine/RefCell T|RefCell<T> e mutabilità interna]]
- [[Programmazione/Rust/Pagine/Unit test|Unit test]]
- [[Programmazione/Rust/Pagine/Integration test|Integration test]]
- [[Programmazione/Rust/Pagine/Error handling idiomatico|Error handling idiomatico]]
