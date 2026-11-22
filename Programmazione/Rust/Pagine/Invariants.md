---
date: 2026-05-26
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - programmazione
  - rust
  - unsafe-rust-in-profondita
aliases:
  - Invarianti
  - Safety invariants
prerequisites:
  - "[[Programmazione/Rust/Pagine/Unsafe Rust]]"
  - "[[Programmazione/Rust/Pagine/Ownership]]"
  - "[[Programmazione/Rust/Pagine/Unsafe functions]]"
related:
  - "[[Programmazione/Rust/Pagine/Aliasing rules]]"
  - "[[Programmazione/Rust/Pagine/Unsafe abstractions sicure]]"
  - "[[Programmazione/Rust/Pagine/Undefined behavior]]"
  - "[[Programmazione/Rust/Pagine/Miri]]"
title: Invariants
---

# Invariants

## Sintesi

Un **invariante** è una proprietà su cui un'operazione può contare senza ricontrollarla ogni volta. «Questo vettore contiene almeno un elemento» è utile solo se sai rispondere a tre domande: **chi lo garantisce all'inizio, quali operazioni lo preservano e chi lo usa?**

Non tutti gli invarianti hanno lo stesso peso. Un valore numerico fuori dal dominio di una percentuale è un **errore logico**; un riferimento che non soddisfa i requisiti di validità di Rust è un problema di **sicurezza della memoria**. Un errore logico diventa rilevante per la sicurezza se un'operazione unsafe si affida a quella proprietà.

## Quando usarlo

- Quando progetti un tipo con meno stati ammessi rispetto ai suoi campi: per esempio una percentuale o una collezione non vuota.
- Quando conservi informazioni correlate, come puntatore e lunghezza, o lunghezza e numero di elementi inizializzati.
- Quando modifichi un metodo safe in un modulo che contiene codice unsafe: anche quel metodo può cambiare una condizione usata altrove.

## Come funziona

### Un vettore che non può perdere l'ultimo elemento

```rust
mod collections {
    pub struct NonEmptyVec<T> {
        // Invariante del modulo: inner.len() >= 1.
        inner: Vec<T>,
    }

    impl<T> NonEmptyVec<T> {
        pub fn new(inner: Vec<T>) -> Option<Self> {
            if inner.is_empty() { None } else { Some(Self { inner }) }
        }

        pub fn first(&self) -> &T {
            &self.inner[0]
        }

        pub fn pop_if_multiple(&mut self) -> Option<T> {
            if self.inner.len() > 1 { self.inner.pop() } else { None }
        }

        pub fn replace_first_with(&mut self, make: impl FnOnce(&T) -> T) -> T {
            let next = make(self.first());
            std::mem::replace(&mut self.inner[0], next)
        }
    }
}

use collections::NonEmptyVec;

fn main() {
    assert!(NonEmptyVec::<i32>::new(vec![]).is_none());
    let mut items = NonEmptyVec::new(vec![10, 20]).unwrap();
    assert_eq!(items.pop_if_multiple(), Some(20));
    assert_eq!(items.pop_if_multiple(), None);
    assert_eq!(items.replace_first_with(|n| n + 1), 10);
    assert_eq!(*items.first(), 11);
}
```

| Passaggio | Perché la proprietà regge |
| --- | --- |
| Costruzione | Il costruttore restituisce `Some` soltanto dopo aver escluso il vettore vuoto. Il campo privato impedisce ai chiamanti esterni al modulo di aggirare il controllo. |
| Rimozione | Con almeno due elementi, `pop` ne lascia almeno uno. Con un solo elemento, il metodo restituisce `None` senza modificarlo. Qui `None` significa «rimozione rifiutata», non «collezione vuota». |
| Sostituzione | La callback calcola il nuovo elemento **prima** della sostituzione. Anche se va in panic, il vettore non è mai stato svuotato. Non è una promessa di annullare eventuali effetti della callback. |
| Lettura | `first` usa un indice controllato. Se un futuro errore interno lasciasse il vettore vuoto, la lettura andrebbe in panic; con le sole operazioni mostrate non sarebbe comportamento indefinito. |

Il controllo nel costruttore **non basta** se domani aggiungi un metodo che espone `&mut Vec<T>`: un chiamante potrebbe usare `clear()`. Se deve solo modificare gli elementi, esponi `&mut [T]`, che non consente di cambiare la lunghezza. Anche aggiungere un'impl derivata di `Default` richiede una revisione: il valore predefinito di un `Vec` è vuoto.

## API / Sintassi

### Precondizione, invariante e postcondizione

Una **precondizione** riguarda l'ingresso di una singola operazione. Un **invariante del tipo** deve essere disponibile ogni volta che un metodo, un distruttore o un chiamante può farvi affidamento. Una **postcondizione** descrive l'esito, compreso ciò che resta vero dopo un errore.

```rust
struct Percent(u8);

impl Percent {
    fn new(value: u8) -> Option<Self> {
        match value {
            0..=100 => Some(Self(value)),
            _ => None,
        }
    }

    fn set(&mut self, value: u8) -> Result<(), u8> {
        let next = Self::new(value).ok_or(value)?;
        *self = next;
        Ok(())
    }

    fn get(&self) -> u8 { self.0 }
}

fn main() {
    let mut progress = Percent::new(0).unwrap();
    assert_eq!(progress.set(100), Ok(()));
    assert_eq!(progress.set(101), Err(101));
    assert_eq!(progress.get(), 100);
}
```

`set` accetta **qualsiasi** `u8`: il chiamante non deve promettere che sia minore o uguale a 100. L'intervallo `0..=100` è invece l'invariante di ogni `Percent` esposto dall'API. La postcondizione su `Err` è più forte: non solo la percentuale è ancora valida, ma conserva il **valore precedente**. Un `u8` pari a 101 è perfettamente valido per Rust; non è valido per questo dominio.

## Esempio pratico

### Una vista: far coincidere dati e durata nel tipo

Una coppia `ptr: *const T`, `len: usize` dentro `RawSlice<T>` non dice da quale allocazione provenga né quanto duri il prestito. Conservare un puntatore non equivale a dereferenziarlo, ma scrivere «l'allocazione vive più di Self» in un commento non rende sicuro un metodo che in seguito ne ricavi una slice.

Se i dati arrivano già come `&[T]`, conserva direttamente la slice. Questo cursore memorizza soltanto la parte ancora da leggere: non usa né un indice separato da tenere entro la lunghezza, né un puntatore da ricostruire.

```rust
struct SliceCursor<'a, T> {
    remaining: &'a [T],
}

impl<'a, T> SliceCursor<'a, T> {
    fn new(data: &'a [T]) -> Self { Self { remaining: data } }

    fn take_first(&mut self) -> Option<&'a T> {
        let (first, tail) = self.remaining.split_first()?;
        self.remaining = tail;
        Some(first)
    }
}

fn main() {
    let data = [10, 20];
    let mut cursor = SliceCursor::new(&data);
    let a = cursor.take_first().unwrap();
    let b = cursor.take_first().unwrap();
    assert_eq!((*a, *b), (10, 20));
    assert_eq!(cursor.take_first(), None);
}
```

`split_first` restituisce due prestiti degli stessi dati: il primo elemento e la coda. Avanzare cambia solo la vista conservata dal cursore, non gli elementi; per questo `a` resta utilizzabile dopo aver ottenuto `b`. Nessuno dei due riferimenti può sopravvivere a `data`.

Se invece l'ingresso arriva dalla FFI come parti grezze, l'obbligo non sparisce: prima di creare una slice con `from_raw_parts` servono, tra l'altro, puntatore non nullo e allineato anche a lunghezza zero, intervallo di elementi inizializzati in una singola allocazione per i dati non vuoti, durata e accessi compatibili con il prestito. Vedi [[Programmazione/Rust/Pagine/Unsafe functions|Unsafe functions]] per il contratto completo dell'esempio su byte e la scelta fra prestito e copia.

## Errori comuni

- **Confondere campo privato e prova di correttezza.** La privacy restringe il codice da controllare; il codice nello stesso modulo può ancora violare la promessa.
- **Pensare soltanto al percorso di successo.** Considera `Err`, i ritorni anticipati e il panic di una callback. La sicurezza durante l'unwinding non richiede il rollback di tutto, ma nessun distruttore deve trovare uno stato non sicuro su cui farà affidamento.
- **Usare un test come garanzia permanente.** Testa i confini e le sequenze di operazioni; per ogni uso unsafe documenta comunque quale proprietà serve e perché continua a valere. Un `debug_assert!` può sparire in release.

## Checklist

1. La proprietà riguarda il dominio applicativo, la validità di un valore Rust o la sicurezza di una specifica operazione?
2. Ogni via di costruzione o modifica, comprese conversioni, impl derivate e riferimenti mutabili esposti, la preserva?
3. Se un'operazione fallisce o si interrompe, il valore è ancora utilizzabile e distruggibile come promesso?
4. Posso eliminare una condizione manuale scegliendo una rappresentazione diversa, come una slice al posto di puntatore e lunghezza?

## Collegamenti

- [[Programmazione/Rust/Pagine/Unsafe Rust|Unsafe Rust]]
- [[Programmazione/Rust/Pagine/Unsafe traits|Unsafe traits]]
- [[Programmazione/Rust/Pagine/Aliasing rules|Aliasing rules]]
- [[Programmazione/Rust/Pagine/Undefined behavior|Undefined behavior]]
- [[Programmazione/Rust/Pagine/Unsafe abstractions sicure|Unsafe abstractions sicure]]
- [[Programmazione/Rust/Pagine/Miri|Miri]]

## Fonti

- [Rustonomicon: confini del modulo e codice unsafe](https://doc.rust-lang.org/nomicon/working-with-unsafe.html)
- [Rustonomicon: exception safety](https://doc.rust-lang.org/nomicon/exception-safety.html)
- [Rust Reference: comportamento indefinito e valori non validi](https://doc.rust-lang.org/reference/behavior-considered-undefined.html)
- [Standard library: split_first](https://doc.rust-lang.org/std/primitive.slice.html#method.split_first) e [requisiti di from_raw_parts](https://doc.rust-lang.org/std/slice/fn.from_raw_parts.html)

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
