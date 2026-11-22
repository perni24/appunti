---
date: 2026-05-21
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - astrazione-e-generici
aliases:
  - GAT
  - Generic Associated Types
prerequisites:
  - "[[Programmazione/Rust/Pagine/Associated types]]"
  - "[[Programmazione/Rust/Pagine/Lifetime annotations]]"
  - "[[Programmazione/Rust/Pagine/Traits]]"
related:
  - "[[Programmazione/Rust/Pagine/Lifetimes nei trait]]"
  - "[[Programmazione/Rust/Pagine/Higher-Ranked Trait Bounds (HRTB)]]"
  - "[[Programmazione/Rust/Pagine/Iterator API]]"
title: Generic Associated Types (GAT)
---

# Generic Associated Types (GAT)

## Sintesi

Un **Generic Associated Type** e un tipo associato con propri parametri di lifetime, tipo o costante. L'implementazione sceglie una **famiglia di tipi**, non un unico tipo privo di parametri.

Il caso piu utile da riconoscere e un risultato il cui tipo dipende dal prestito ricevuto dalla singola chiamata: per esempio una finestra mutabile sui dati interni di un cursore. Il risultato puo prendere in prestito quei dati senza trasferirli o copiarli.

I GAT sono stabili da Rust **1.65**. Gli esempi di questa nota sono verificati con **Rust 1.99.1, edition 2024**: questo non certifica la loro compatibilita con la versione minima. Ogni blocco Rust e autonomo; quelli indicati come controesempi devono fallire in compilazione. [Annuncio di Rust 1.65](https://blog.rust-lang.org/2022/11/03/Rust-1.65.0/)

## Quando usarlo

- Per definire un trait che restituisce viste o guardie con una forma scelta dall'implementazione e parametrizzata dal prestito.
- Per cursori che riutilizzano un buffer interno: il chiamante deve smettere di usare la vista prima di richiedere dati che potrebbero sovrascriverla.
- Per associare a un'implementazione una famiglia di contenitori, parametrizzata da tipo o dimensione.

Non servono GAT per ogni riferimento restituito. Se tutte le implementazioni devono dare un semplice `&str`, basta `fn get(&self) -> &str`. Se cambia soltanto il tipo referenziato, un tipo associato ordinario e `fn get(&self) -> &Self::Target` possono bastare: vedi [[Programmazione/Rust/Pagine/Associated types|Associated types]].

Un GAT rende esprimibile un contratto piu generale; non garantisce automaticamente zero allocazioni, maggiore velocita o un'API piu facile.

## Come funziona

### Una famiglia, non un tipo che cambia a runtime

In `type Item<'a>`, `'a` e un parametro del tipo associato. In `fn next<'a>(&'a mut self) -> Option<Self::Item<'a>>`, il metodo usa la stessa lifetime per collegare il risultato al prestito del receiver.

Ogni chiamata puo usare un prestito diverso. Non viene fissata una sola lifetime per tutta l'esistenza dell'oggetto e non viene scelto un tipo arbitrario durante l'esecuzione.

Nell'impl `type Item<'a> = &'a mut [T]` la forma del risultato e sempre una slice mutabile; cambia il parametro di lifetime che descrive il prestito.

### Che cosa significa Self: 'a

`where Self: 'a` richiede che il tipo `Self` sia valido per la lifetime `'a`, inclusi gli eventuali riferimenti che contiene. Non obbliga il valore a vivere per sempre, non equivale a `'static` e non prolunga la durata dei dati.

Nel trait lending usato qui, il receiver `&'a mut self` implica quel requisito; Rust richiede che sia esplicitato anche sul GAT. L'impl puo cosi definire una vista che prende in prestito da `Self`.

Non e una clausola da aggiungere meccanicamente a ogni GAT: i bound richiesti dipendono dalle firme che lo usano. Un GAT con soli parametri di tipo e costante, come quello in Varianti, non richiede questo bound. [Rust Reference: required where clauses](https://doc.rust-lang.org/reference/items/associated-items.html#required-where-clauses-on-generic-associated-types)

### Il vincolo dipende anche dal receiver

- Con `&self` possono coesistere piu viste condivise.
- Con `&mut self` e un risultato che mantiene quel prestito esclusivo, non puoi chiamare nuovamente il metodo e poi continuare a usare il primo risultato.
- Il prestito puo terminare all'ultimo uso della vista, anche prima della fine del blocco. Non serve sempre un blocco aggiuntivo; negli esempi lo usiamo per rendere evidente il confine.

E il contratto completo di receiver e risultato a imporre queste regole, non la sola presenza della parola GAT.

## API / Sintassi

### Una vista parametrizzata dal prestito

```rust
trait Container {
    type Ref<'a>
    where
        Self: 'a;

    fn get<'a>(&'a self) -> Self::Ref<'a>;
}

struct Text(String);

impl Container for Text {
    type Ref<'a> = &'a str where Self: 'a;

    fn get<'a>(&'a self) -> Self::Ref<'a> {
        self.0.as_str()
    }
}

fn main() {
    let text = Text(String::from("appunti"));
    let first: <Text as Container>::Ref<'_> = text.get();
    let second = text.get();
    assert_eq!(first, second);
    assert_eq!(first, "appunti");
}
```

`<Text as Container>::Ref<'_>` e una proiezione del tipo associato: per questa implementazione risulta un `&str` con lifetime inferita. Due viste condivise possono coesistere.

Questo esempio illustra la sintassi, non una necessita: se `Text` fosse l'unico caso da supportare, un metodo che restituisce direttamente `&str` sarebbe piu semplice.

### Lo stesso contratto con risultato preso in prestito o posseduto

```rust
trait RowSource {
    type Row<'a>: AsRef<str>
    where
        Self: 'a;

    fn current<'a>(&'a self) -> Option<Self::Row<'a>>;
}

struct CsvRow {
    line: String,
}

impl RowSource for CsvRow {
    type Row<'a> = &'a str where Self: 'a;

    fn current<'a>(&'a self) -> Option<Self::Row<'a>> {
        Some(self.line.as_str())
    }
}

struct SnapshotRow {
    line: Option<String>,
}

impl RowSource for SnapshotRow {
    type Row<'a> = String where Self: 'a;

    fn current<'a>(&'a self) -> Option<Self::Row<'a>> {
        self.line.clone()
    }
}

fn current_byte_len<S: RowSource>(source: &S) -> Option<usize> {
    source.current().map(|row| row.as_ref().len())
}

fn main() {
    let borrowed = CsvRow {
        line: String::from("42,ok"),
    };
    assert_eq!(current_byte_len(&borrowed), Some(5));

    let source = SnapshotRow {
        line: Some(String::from("ready")),
    };
    let snapshot = source.current().unwrap();
    drop(source);
    assert_eq!(snapshot, "ready");

    let absent = SnapshotRow { line: None };
    let empty = CsvRow { line: String::new() };
    assert_eq!(current_byte_len(&absent), None);
    assert_eq!(current_byte_len(&empty), Some(0));
}
```

`CsvRow` espone soltanto una riga grezza: **non analizza CSV**, delimitatori o virgolette. `SnapshotRow` restituisce una copia posseduta, che sopravvive alla sorgente; la clonazione di una stringa non vuota comporta una nuova allocazione.

`Row<'a>: AsRef<str>` specifica un'operazione disponibile sul risultato, mentre `where Self: 'a` ne limita l'uso ai prestiti ammissibili. La funzione generica misura **byte UTF-8**, non caratteri.

Qui il GAT permette a una stessa API generica di accettare forme diverse di risultato. Se servisse solo una vista `&str`, non sarebbe necessario. Nella variante owned il parametro `'a` non viene usato nel tipo concreto: il GAT non obbliga ogni implementazione a restituire un prestito.

## Esempio pratico

### Finestre mutabili sovrapposte, una alla volta

La libreria standard offre `slice::windows` per viste condivise. Un normale `Iterator` puo lasciare vivi piu elementi gia restituiti: non puo esporre in questo modo slice mutabili **sovrapposte**. Con `chunks_mut` il problema non si presenta, perche le porzioni sono disgiunte. [Documentazione di slice::windows](https://doc.rust-lang.org/std/primitive.slice.html#method.windows)

Questo piccolo cursore lending permette invece di riutilizzare i dati solo dopo l'ultimo uso della finestra precedente:

```rust
trait LendingIterator {
    type Item<'a>
    where
        Self: 'a;

    fn next<'a>(&'a mut self) -> Option<Self::Item<'a>>;
}

struct WindowsMut<'s, T> {
    data: &'s mut [T],
    width: usize,
    position: usize,
}

impl<'s, T> WindowsMut<'s, T> {
    fn new(data: &'s mut [T], width: usize) -> Option<Self> {
        if width == 0 {
            return None;
        }
        Some(Self { data, width, position: 0 })
    }
}

impl<'s, T> LendingIterator for WindowsMut<'s, T> {
    type Item<'a> = &'a mut [T] where Self: 'a;

    fn next<'a>(&'a mut self) -> Option<Self::Item<'a>> {
        let start = self.position;
        let end = start.checked_add(self.width)?;
        if end > self.data.len() {
            return None;
        }
        self.position += 1;
        Some(&mut self.data[start..end])
    }
}

fn main() {
    let mut data = [1, 2, 3, 4];
    {
        let mut windows = WindowsMut::new(&mut data, 2).unwrap();
        {
            let first = windows.next().unwrap();
            first[1] = 20;
        }
        {
            let second = windows.next().unwrap();
            assert_eq!(second, &[20, 3]);
            second[1] = 30;
        }
        assert_eq!(windows.next().unwrap(), &[30, 4]);
        assert!(windows.next().is_none());
        assert!(windows.next().is_none());
    }
    assert_eq!(data, [1, 20, 30, 4]);
    assert!(WindowsMut::new(&mut data, 0).is_none());
}
```

Le due lifetime hanno ruoli diversi: `'s` riguarda la slice conservata dal cursore; `'a` riguarda il singolo prestito mutabile del cursore. La finestra non viene prestata per tutta `'s`: farlo permetterebbe di conservarla mentre si ottiene una seconda finestra sovrapposta.

Il codice usa soltanto safe Rust. Rifiuta larghezza zero; una slice vuota o una larghezza maggiore della slice produce subito `None`. `checked_add` evita overflow anche per larghezze estreme. L'incremento della posizione e sicuro: e eseguito solo con larghezza positiva ed estremo finale entro la slice.

Non copia gli elementi e non alloca le finestre. Non e pero un'implementazione di `std::iter::Iterator` o `IntoIterator`: il nome `next` non rende disponibili automaticamente `for`, `map` o `collect`. In particolare, non puoi raccogliere tutte queste viste mutabili sovrapposte in un vettore. Puoi consumarle una alla volta o copiarne esplicitamente il contenuto se ti servono snapshot indipendenti.

## Varianti

### Parametri di tipo e costante

Un GAT non deve per forza contenere una lifetime:

```rust
trait BatchFamily {
    type Batch<T, const N: usize>;

    fn pack<T, const N: usize>(items: [T; N]) -> Self::Batch<T, N>;
}

struct Inline;
struct Boxed;

impl BatchFamily for Inline {
    type Batch<T, const N: usize> = [T; N];

    fn pack<T, const N: usize>(items: [T; N]) -> Self::Batch<T, N> {
        items
    }
}

impl BatchFamily for Boxed {
    type Batch<T, const N: usize> = Box<[T; N]>;

    fn pack<T, const N: usize>(items: [T; N]) -> Self::Batch<T, N> {
        Box::new(items)
    }
}

fn main() {
    let inline = Inline::pack([String::from("a"), String::from("b")]);
    let boxed = Boxed::pack([10, 20, 30]);
    assert_eq!(inline[1], "b");
    assert_eq!(*boxed, [10, 20, 30]);
}
```

`Inline` conserva l'array nel valore restituito; `Boxed` usa un `Box`. Entrambe le funzioni trasferiscono gli elementi, senza richiedere `Clone` o `Copy`. E un esempio di scelta della rappresentazione tramite trait, non un sistema completo di gestione della memoria.

### Bound universali e compatibilita con dyn

`for<'a> I::Item<'a>: Debug` esprime un requisito universale sulla famiglia di risultati. Non significa prolungare un prestito o rendere i dati statici. Tuttavia alcune combinazioni di GAT e higher-ranked bounds incontrano limiti del compilatore: non correggere una richiesta inattesa di `'static` aggiungendo quel bound senza capire cosa esclude.

L'articolo di stabilizzazione del 2022 descrive questi limiti storici; non e, da solo, una garanzia del comportamento di qualsiasi versione successiva. Nei test di questa nota, su Rust 1.99.1, passare `WindowsMut` su un array locale a una funzione con `for<'a> I::Item<'a>: Debug` riproduce E0597 e una richiesta implicita di `'static`. E un risultato di quella sonda, non una regola generale dei GAT.

Per un errore concreto riduci il codice e verifica la toolchain del progetto. Se l'operazione serve a tutte le implementazioni, puo essere opportuno esprimerla direttamente sul GAT, come `AsRef<str>` in `RowSource`; questo cambia il contratto del trait, non e una sostituzione universale di ogni HRTB. [Limiti documentati alla stabilizzazione](https://blog.rust-lang.org/2022/10/28/gats-stabilization/)

I trait `Container`, `RowSource` e `LendingIterator` mostrati qui **non sono dyn-compatible**. Non puoi risolvere il problema scegliendo semplicemente `Item<'static>`: la famiglia generica resta parte dell'interfaccia. Usa generics/static dispatch oppure progetta un'interfaccia separata adatta a `dyn`. [Rust Reference: dyn compatibility](https://doc.rust-lang.org/reference/items/traits.html#dyn-compatibility)

## Errori comuni

### Omettere il bound richiesto dal receiver

Controesempio: deve fallire con la diagnosi `missing required bound on Item`.

```rust
trait LendingIterator {
    type Item<'a>;

    fn next<'a>(&'a mut self) -> Option<Self::Item<'a>>;
}

fn main() {}
```

In questa firma occorre `type Item<'a> where Self: 'a;`. Non va nascosto l'errore aggiungendo `'static` al trait: sarebbe un vincolo diverso e piu restrittivo.

### Usare la prima vista dopo un secondo prestito mutabile

Controesempio autonomo: deve fallire con **E0499**.

```rust
trait Lend {
    type View<'a>
    where
        Self: 'a;

    fn view<'a>(&'a mut self) -> Self::View<'a>;
}

struct Buffer([i32; 2]);

impl Lend for Buffer {
    type View<'a> = &'a mut [i32] where Self: 'a;

    fn view<'a>(&'a mut self) -> Self::View<'a> {
        &mut self.0
    }
}

fn main() {
    let mut buffer = Buffer([1, 2]);
    let first = buffer.view();
    let second = buffer.view();
    first[0] = second[1];
}
```

Il problema non e assegnare un nome a due risultati: e mantenere utilizzabile il primo prestito mentre ne richiedi un altro incompatibile. Usare `first` completamente **prima** della seconda chiamata rende possibile il riutilizzo del buffer.

Altri errori da evitare:

- Confondere un GAT con un parametro del trait: il primo descrive una famiglia scelta dall'impl, non un insieme libero di implementazioni selezionate a ogni chiamata.
- Pensare che `Self: 'a` permetta di restituire un riferimento a una variabile locale distrutta all'uscita del metodo.
- Presentare una vista condivisa come prova della necessita dei GAT.
- Dare per scontato che qualsiasi adattatore lending sia semplice da implementare o che i combinatori di `Iterator` funzionino senza modifiche.

## Checklist

- [ ] Il risultato richiede davvero una famiglia di tipi, oppure basta un riferimento a un tipo associato ordinario?
- [ ] Le lifetime della sorgente e del singolo prestito hanno ruoli chiari?
- [ ] Ho esplicitato i bound richiesti sul GAT senza aggiungere `'static` per eliminare una diagnosi?
- [ ] E chiaro quali implementazioni prendono in prestito, copiano o allocano?
- [ ] Ho verificato ultimo uso delle viste, esaurimento e input limite?
- [ ] Il chiamante sa se puo usare `Iterator` e `dyn` oppure no?
- [ ] I limiti di compilazione sono verificati sulla toolchain del progetto?

## Collegamenti

- [[Programmazione/Rust/Pagine/Associated types|Associated types]]
- [[Programmazione/Rust/Pagine/Lifetime annotations|Lifetime annotations]]
- [[Programmazione/Rust/Pagine/Lifetimes nei trait|Lifetimes nei trait]]
- [[Programmazione/Rust/Pagine/Higher-Ranked Trait Bounds (HRTB)|Higher-Ranked Trait Bounds (HRTB)]]
- [[Programmazione/Rust/Pagine/Iterator API|Iterator API]]
- [[Programmazione/Rust/Pagine/Trait objects e dyn Trait|Trait objects e dyn Trait]]

## Fonti

- [Rust 1.65: stabilizzazione dei GAT](https://blog.rust-lang.org/2022/11/03/Rust-1.65.0/).
- [Rust Reference: associated types e bound richiesti](https://doc.rust-lang.org/reference/items/associated-items.html#associated-types).
- [Standard library: slice::windows e assenza di windows_mut come Iterator](https://doc.rust-lang.org/std/primitive.slice.html#method.windows).
- [Rust Reference: dyn compatibility](https://doc.rust-lang.org/reference/items/traits.html#dyn-compatibility).
- [Rust Blog: limiti alla stabilizzazione, contesto storico del 2022](https://blog.rust-lang.org/2022/10/28/gats-stabilization/).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
