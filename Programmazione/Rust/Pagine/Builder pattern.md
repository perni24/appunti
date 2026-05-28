---
date: 2026-05-28
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags:
  - programmazione
  - rust
  - api-design-idiomatico
aliases:
  - "Builder pattern"
  - "Builder Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Structs]]"
  - "[[Programmazione/Rust/Pagine/Default]]"
  - "[[Programmazione/Rust/Pagine/Public API design]]"
related:
  - "[[Programmazione/Rust/Pagine/Newtype pattern]]"
  - "[[Programmazione/Rust/Pagine/Typestate pattern]]"
  - "[[Programmazione/Rust/Pagine/Configurazione applicativa]]"
---

# Builder pattern

## Sintesi

Il **builder pattern** costruisce valori complessi tramite una struct dedicata, con metodi fluenti per impostare opzioni e un metodo finale come `build()`. In Rust e utile quando un costruttore avrebbe troppi parametri, molti default o validazioni.

Un builder migliora leggibilita e compatibilita: aggiungere una nuova opzione opzionale al builder e spesso non breaking, mentre aggiungere un parametro a `new(...)` lo e.

## Quando usarlo

Usa un builder quando:

- una struct ha molte opzioni;
- molti campi hanno default;
- la costruzione puo fallire;
- vuoi evitare parametri booleani ambigui;
- vuoi rendere l'API estendibile;
- la configurazione deve essere leggibile nel call site.

Non usarlo per struct piccole con due o tre campi obbligatori: un costruttore semplice o literal struct possono bastare.

## Come funziona

Un builder contiene i valori parziali della configurazione. I metodi impostano campi e restituiscono `self` o `&mut self`. `build()` valida e produce il tipo finale.

Due stili comuni:

- **by value**: i metodi prendono `self` e restituiscono `Self`;
- **by mutable reference**: i metodi prendono `&mut self` e restituiscono `&mut Self`.

Lo stile by value e comodo per chaining. Lo stile `&mut self` e utile quando vuoi modificare lo stesso builder in piu passaggi.

## API / Sintassi

Builder by value:

```rust
#[derive(Debug)]
pub struct Client {
    timeout_ms: u64,
    user_agent: String,
}

#[derive(Debug)]
pub struct ClientBuilder {
    timeout_ms: u64,
    user_agent: String,
}

impl Client {
    pub fn builder() -> ClientBuilder {
        ClientBuilder {
            timeout_ms: 5000,
            user_agent: "my-client".to_string(),
        }
    }
}

impl ClientBuilder {
    pub fn timeout_ms(mut self, value: u64) -> Self {
        self.timeout_ms = value;
        self
    }

    pub fn user_agent(mut self, value: impl Into<String>) -> Self {
        self.user_agent = value.into();
        self
    }

    pub fn build(self) -> Result<Client, String> {
        if self.timeout_ms == 0 {
            return Err("timeout must be greater than zero".to_string());
        }

        Ok(Client {
            timeout_ms: self.timeout_ms,
            user_agent: self.user_agent,
        })
    }
}
```

## Esempio pratico

Uso dell'API:

```rust
let client = Client::builder()
    .timeout_ms(10_000)
    .user_agent("notes-sync/1.0")
    .build()?;

# #[derive(Debug)]
# pub struct Client {
#     timeout_ms: u64,
#     user_agent: String,
# }
# #[derive(Debug)]
# pub struct ClientBuilder {
#     timeout_ms: u64,
#     user_agent: String,
# }
# impl Client {
#     pub fn builder() -> ClientBuilder {
#         ClientBuilder { timeout_ms: 5000, user_agent: "my-client".to_string() }
#     }
# }
# impl ClientBuilder {
#     pub fn timeout_ms(mut self, value: u64) -> Self { self.timeout_ms = value; self }
#     pub fn user_agent(mut self, value: impl Into<String>) -> Self { self.user_agent = value.into(); self }
#     pub fn build(self) -> Result<Client, String> {
#         Ok(Client { timeout_ms: self.timeout_ms, user_agent: self.user_agent })
#     }
# }
# Ok::<(), String>(())
```

Il call site rende chiaro cosa viene configurato, senza dipendere dall'ordine dei parametri.

## Varianti

- **Builder con default**: opzioni facoltative.
- **Builder fallibile**: `build() -> Result<T, E>`.
- **Builder infallibile**: `build() -> T` se non ci sono invarianti fallibili.
- **Typestate builder**: garantisce campi obbligatori a compile time.
- **Builder borrowed**: usa riferimenti e lifetime.
- **Config builder**: costruisce configurazioni applicative.

## Errori comuni

- Usare builder per tipi troppo semplici.
- Non validare in `build()`.
- Rendere pubblici campi intermedi senza motivo.
- Usare bool setter ambigui come `enabled(true)` senza alternative chiare.
- Rompere chaining con firme incoerenti.
- Nascondere errori di configurazione dietro default pericolosi.
- Creare typestate builder troppo complessi per benefici piccoli.

## Checklist

- La costruzione ha abbastanza opzioni da giustificare un builder?
- I default sono sicuri?
- `build()` valida invarianti?
- Il call site e leggibile?
- Aggiungere opzioni future sara non breaking?
- Gli errori di build sono chiari?
- Un typestate builder sarebbe utile o e eccessivo?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Public API design]]
- [[Programmazione/Rust/Pagine/Newtype pattern]]
- [[Programmazione/Rust/Pagine/Typestate pattern]]
- [[Programmazione/Rust/Pagine/Configurazione applicativa]]
- [[Programmazione/Rust/Pagine/Default]]
- [[Programmazione/Rust/Pagine/Structs]]
