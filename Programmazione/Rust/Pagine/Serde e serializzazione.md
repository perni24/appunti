---
date: 2026-05-27
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - backend-networking-e-database
aliases:
  - Serde e serializzazione
  - Serde
  - serializzazione Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Structs|Structs]]"
  - "[[Programmazione/Rust/Pagine/Enums|Enums]]"
  - "[[Programmazione/Rust/Pagine/Derive traits|Derive traits]]"
related:
  - "[[Programmazione/Rust/Pagine/Networking con reqwest|Networking con reqwest]]"
  - "[[Programmazione/Rust/Pagine/Web backend con axum|Web backend con axum]]"
  - "[[Programmazione/Rust/Pagine/Configurazione applicativa|Configurazione applicativa]]"
title: Serde e serializzazione
---

# Serde e serializzazione

## Sintesi

**Serde descrive come rappresentare un tipo Rust; non è il parser JSON.** Con `Serialize` il tipo espone i suoi dati a un serializzatore; con `Deserialize` si costruisce a partire da un deserializzatore. La crate di formato, qui `serde_json`, legge o scrive i byte. Lo stesso modello si può usare con una crate per TOML, YAML o MessagePack se il formato supporta quella rappresentazione.

Una richiesta attraversa tre controlli distinti: **è JSON valido?** → **corrisponde al DTO** (tipo che descrive i dati scambiati)? → **rispetta le regole dell'applicazione?** Per esempio, `{"title":"  "}` supera i primi due controlli: solo il dominio sa che una issue deve avere un titolo non vuoto. La separazione vale sia per l'handler di [[Programmazione/Rust/Pagine/Web backend con axum|axum]] sia per il client [[Programmazione/Rust/Pagine/Networking con reqwest|reqwest]].

## Come leggere un contratto JSON

| Campo Rust nella richiesta | Se la chiave manca | Se il valore è `null` | Se il valore ha il tipo sbagliato |
| --- | --- | --- | --- |
| `title: String` | Errore: richiesto | Errore | Errore: un numero non diventa una stringa |
| `#[serde(default)] labels: Vec<String>` | Lista vuota (`Vec::default()`) | Errore: `null` non è una lista | Errore anche se un solo elemento non è una stringa |
| `assignee: Option<String>` | `None` | `None` | Errore: “opzionale” non significa “qualsiasi valore” |

`default` interviene **quando manca la chiave**, non dopo un errore di conversione. `skip_serializing_if` agisce invece **in scrittura**: con `"Option::is_none"` omette la chiave; senza quell'attributo un campo `Option` pari a `None` viene normalmente scritto in JSON come `null`.

## Esempio pratico

Usiamo una issue con tre rappresentazioni: la richiesta accettata dall'API, il record interno e la risposta pubblica. Puoi provare il contratto senza HTTP né database.

```sh
cargo new --lib --edition 2024 issue-wire
```

```sh
cd issue-wire
```

In `Cargo.toml`, sotto `[dependencies]`, aggiungi:

```toml
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

I quattro blocchi Rust seguenti compongono, nell'ordine, un unico `src/lib.rs`.

### 1. Accettare il vecchio nome, scrivere solo il nuovo

`title` è il nome pubblico attuale. `alias = "summary"` consente di leggere il vecchio nome; non lo emette nella risposta. Se il client invia entrambi i nomi, il derive segnala un campo duplicato: non sceglie silenziosamente l'ultimo. Usiamo `deny_unknown_fields` sull'input di creazione per segnalare i refusi; la decisione è specifica di questo endpoint.

```rust
use serde::{Deserialize, Deserializer, Serialize};

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CreateIssue {
    #[serde(alias = "summary")]
    title: String,
    #[serde(default)]
    labels: Vec<String>,
    assignee: Option<String>,
}

pub struct Issue {
    id: u64,
    title: String,
    labels: Vec<String>,
    assignee: Option<String>,
    pub internal_note: String,
}

impl Issue {
    pub fn create(id: u64, input: CreateIssue) -> Result<Self, &'static str> {
        let title = input.title.trim();
        if title.is_empty() {
            return Err("empty_title");
        }
        Ok(Self {
            id,
            title: title.to_owned(),
            labels: input.labels,
            assignee: input.assignee,
            internal_note: String::new(),
        })
    }
}

#[derive(Serialize)]
pub struct IssueResponse<'a> {
    id: u64,
    title: &'a str,
    labels: &'a [String],
    #[serde(skip_serializing_if = "Option::is_none")]
    assignee: Option<&'a str>,
}

impl<'a> From<&'a Issue> for IssueResponse<'a> {
    fn from(issue: &'a Issue) -> Self {
        Self {
            id: issue.id,
            title: &issue.title,
            labels: &issue.labels,
            assignee: issue.assignee.as_deref(),
        }
    }
}
```

Il record interno **non** implementa `Serialize`; è la lista dei campi di `IssueResponse` a determinare cosa esce. La visibilità Rust (`pub` o privato) non seleziona i campi per il derive. Aggiungere in futuro una nota riservata, o un hash di password a un modello utente, non deve cambiare automaticamente il JSON pubblico. Il DTO di uscita prende in prestito i dati per evitare di clonare titolo ed etichette.

### 2. Aggiornare: lasciare invariato, cancellare o sostituire

Per creare una issue ci basta che assenza e `null` significhino entrambi “nessun assegnatario”. Per un aggiornamento parziale sono **due comandi diversi**. La funzione personalizzata viene chiamata solo quando la chiave è presente; quando manca, `default` assegna `None` all'opzione esterna.

```rust
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PatchIssue {
    #[serde(default, deserialize_with = "present")]
    assignee: Option<Option<String>>,
}

fn present<'de, D>(input: D) -> Result<Option<Option<String>>, D::Error>
where
    D: Deserializer<'de>,
{
    Option::<String>::deserialize(input).map(Some)
}

impl Issue {
    pub fn apply(&mut self, patch: PatchIssue) {
        if let Some(value) = patch.assignee {
            self.assignee = value;
        }
    }
}
```

| JSON di aggiornamento | Valore di `patch.assignee` | Effetto se prima era `"Ada"` |
| --- | --- | --- |
| `{}` | `None` | Rimane `"Ada"` |
| `{"assignee":null}` | `Some(None)` | Viene rimosso |
| `{"assignee":"Lia"}` | `Some(Some("Lia".into()))` | Diventa `"Lia"` |
| `{"assignee":12}` | Errore di deserializzazione | Nessuna patch da applicare |

**Il solo tipo `Option<Option<String>>` non basta:** con il derive standard sia la chiave mancante sia il `null` esplicito diventerebbero `None` esterno. Qui `present` conserva la distinzione senza leggere prima tutto il documento in un `serde_json::Value`.

### 3. Dare un nome stabile alle varianti

```rust
#[derive(Debug, PartialEq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum IssueEvent {
    IssueOpened { id: u64 },
    AssigneeChanged { id: u64, assignee: Option<String> },
}
```

`IssueEvent::IssueOpened { id: 7 }` viene scritto come `{"type":"issue_opened","id":7}`. Qui il tag è **interno**: discriminante e campi stanno nello stesso oggetto. Cambiare il nome del tag o della variante rompe anche gli eventi già salvati, non solo i client. Un tag sconosciuto viene rifiutato da questo enum. Con `untagged` non si legge un discriminante: Serde prova le varianti nell'ordine dichiarato e usa la prima compatibile. È quindi una scelta fragile quando due forme si sovrappongono.

### 4. Provare il contratto, non l'ordine delle chiavi

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::{from_str, json, to_value};

    #[test]
    fn dal_vecchio_input_alla_risposta_pubblica() -> serde_json::Result<()> {
        let input = from_str(r#"{"summary":"  Prima nota  ","assignee":null}"#)?;
        let mut issue = Issue::create(7, input).expect("titolo valido nella fixture");
        issue.internal_note = "Solo per gli operatori".into();

        let response = to_value(IssueResponse::from(&issue))?;
        assert_eq!(response, json!({"id":7,"title":"Prima nota","labels":[]}));
        Ok(())
    }
}
```

```sh
cargo test --lib
```

L'asserzione confronta **l'intero oggetto JSON**: fallisce se compare un campo interno o se viene riemesso il nome storico. Non impone spaziatura né ordine delle chiavi. Un semplice round trip tra due tipi identici non basta: serializer e deserializer potrebbero concordare sullo stesso formato sbagliato per il client.

## Scelte al confine dell'API

- **Compatibilità in lettura e scrittura.** `rename` cambia il nome usato dal derive; `alias` aggiunge un nome accettato **solo in ingresso**. Il fatto che il nuovo server legga il vecchio formato non dimostra che un vecchio client sappia leggere la nuova risposta. Prova entrambe le direzioni che intendi supportare.
- **Campi sconosciuti.** Per una struct derivata da un oggetto JSON, di norma vengono ignorati; `deny_unknown_fields` cambia la politica. Ha senso per comandi o [[Programmazione/Rust/Pagine/Configurazione applicativa|configurazioni]] dove un refuso sarebbe silenzioso. Su un client che legge risposte di terzi rischia invece di rompere l'integrazione quando il produttore aggiunge un campo innocuo.
- **Errori.** `serde_json::Error::classify()` distingue `Syntax` (sintassi), `Eof` (input finito troppo presto), `Data` (errore nel deserializzare il tipo) e `Io` (lettore o scrittore). Un titolo vuoto dopo il trim non è nessuno di questi: è l'errore di `Issue::create`. Su input esterno restituisci o gestisci l'errore, senza `unwrap()` né log del payload integrale.
- **Testo, byte o stream.** Usa `from_str` per testo già disponibile e `from_slice` per byte, per esempio il corpo letto da reqwest. Entrambi possono prestare dati dal buffer se il tipo e la rappresentazione lo permettono; una stringa JSON con escape può richiedere una copia. `from_reader` richiede `DeserializeOwned`: il risultato non può prendere in prestito i byte transitori del lettore. In uscita `to_string` crea una stringa; `to_writer` scrive su una destinazione senza costruire tutta la stringa finale in memoria.

## Fonti ufficiali

- [Serde: modello dei dati e ruolo dei formati](https://serde.rs/data-model.html)
- [Attributi sui campi: rename, alias, default e deserialize_with](https://serde.rs/field-attrs.html)
- [Attributi sul contenitore: deny_unknown_fields e rename_all](https://serde.rs/container-attrs.html)
- [Rappresentazioni degli enum e vincoli](https://serde.rs/enum-representations.html)
- [Lifetime del deserializzatore e DeserializeOwned](https://serde.rs/lifetimes.html)
- [serde_json: categorie degli errori](https://docs.rs/serde_json/1/serde_json/error/enum.Category.html)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Structs|Structs]]
- [[Programmazione/Rust/Pagine/Enums|Enums]]
- [[Programmazione/Rust/Pagine/Derive traits|Derive traits]]
- [[Programmazione/Rust/Pagine/Networking con reqwest|Networking con reqwest]]
- [[Programmazione/Rust/Pagine/Web backend con axum|Web backend con axum]]
- [[Programmazione/Rust/Pagine/Configurazione applicativa|Configurazione applicativa]]
