---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - programmazione
  - python
  - dati
  - pandas
aliases:
  - pandas
  - DataFrame
prerequisites: []
related: []
title: pandas
---

# pandas

## Sintesi

pandas manipola dati tabellari tramite `Series` (una dimensione) e `DataFrame` (due dimensioni). Ogni colonna ha un tipo; righe e colonne hanno etichette che partecipano alle operazioni, non sono solo decorazioni.

Baseline: CPython 3.12.10, **pandas 3.1.0** e NumPy **2.5.4**. Gli esempi assumono il comportamento pandas 3.x, incluso Copy-on-Write; non sono una guida compatibile senza modifiche con tutte le versioni precedenti.

## Quando usarlo

- Pulizia, aggregazione e confronto di tabelle che entrano ragionevolmente in memoria.
- CSV, JSON tabellari, Excel e Parquet, con i rispettivi parser e dipendenze.
- Analisi esplorativa in notebook e trasformazioni riusabili in moduli Python.

Per array numerici omogenei considera NumPy. Per join e aggregazioni su grandi dati gia nel database, valuta di eseguirli nel database prima di caricare il risultato.

## Come funziona

### Tipi, etichette e allineamento

`df.shape` descrive righe e colonne; `df.dtypes` i tipi. `head()` mostra un campione, `info()` riassume colonne e valori non nulli, `describe()` produce statistiche: nessuno dei tre certifica la qualita del dataset.

Le operazioni fra Series allineano **per etichetta**, non semplicemente per posizione.

### indexing_demo.py

```python
import pandas as pd

df = pd.DataFrame(
    {"region": ["Nord", "Sud"], "amount": [10, 20]},
    index=["a", "b"],
)
assert df.loc["a", "amount"] == 10
assert df.iloc[0, 1] == 10
assert len(df.loc["a":"b"]) == 2
assert len(df.iloc[0:1]) == 1

other = pd.Series([100, 200], index=["b", "a"])
assert (df["amount"] + other).to_dict() == {"a": 210, "b": 120}

mask = (df["amount"] >= 10) & (df["region"] == "Nord")
df.loc[mask, "amount"] = 15
assert df.loc["a", "amount"] == 15

selected = df["amount"]
selected.iloc[0] = 999
assert df.loc["a", "amount"] == 15
print(df)
```

`loc` usa etichette e include normalmente l'estremo finale dello slice; `iloc` usa posizioni e lo esclude. `df["amount"]` e una Series, `df[["amount"]]` un DataFrame. Un indice non e necessariamente unico.

Usa `&`, `|` e `~` per maschere, con parentesi attorno ai confronti; `and/or` richiedono un singolo valore booleano. Per applicare una maschera Series, anche il suo indice deve essere coerente con quello della tabella.

### Modifica e Copy-on-Write

In pandas 3.x un oggetto derivato si comporta come indipendente quando lo modifichi tramite le API pandas. La copia fisica puo essere differita. Per aggiornare `df`, scrivi `df.loc[mask, "colonna"] = value`: assegnazioni concatenate come `df["colonna"][mask] = value` non aggiornano correttamente l'originale.

Questo non trasforma alias Python in copie: `other = df` resta lo stesso oggetto. Anche `copy(deep=True)` non copia ricorsivamente liste o dizionari contenuti in celle object. `to_numpy()` puo condividere memoria ed essere read-only; per una copia numerica indipendente richiedi `copy=True`.

## API / Sintassi

In un ambiente virtuale:

```bash
python -m pip install "pandas==3.1.0" "numpy==2.5.4"
```

| Operazione                   | Cosa controllare                                              |
| ---------------------------- | ------------------------------------------------------------- |
| `read_csv`                   | Encoding, separatore, tipi, valori NA, righe e colonne attese |
| `isna()/notna()`             | Usa queste API, non uguaglianza con NaN o pd.NA               |
| `dropna(subset=[...])`       | Elimina righe: quantifica cosa stai scartando                 |
| `fillna(value)`              | Introduce un'ipotesi sui dati; un importo ignoto non e zero   |
| `groupby(..., dropna=False)` | Conserva anche il gruppo con chiave mancante                  |
| `sum(min_count=1)`           | Evita di chiamare zero la somma di soli valori mancanti       |
| `merge(..., validate=...)`   | Controlla la cardinalita attesa del join                      |
| `to_csv(..., index=False)`   | Non aggiunge l'indice come colonna del file                   |

I dtype nullable `Int64`, `Float64`, `boolean` e `string` supportano `pd.NA`. `Int64` non e il dtype NumPy `int64`. La gestione dei mancanti dipende dal tipo: `bool(pd.NA)` e ambiguo, mentre `isna()` fornisce una maschera utilizzabile.

In lettura CSV, token come `NA` possono essere interpretati come mancanti per default. Se sono codici validi, specifica la policy invece di correggere i dati dopo. CSV non conserva uno schema di tipi come un formato tabellare tipizzato.

## Esempio pratico

### sales_report.py

Report con contratti espliciti: una riga per ordine, ID univoco, importi in **centesimi interi non negativi**, campo vuoto = sconosciuto. Il totale e chiamato `known_amount_cents` perche somma solo la parte nota; il report espone anche quanti importi mancano.

Il demo usa dati sintetici in memoria ed esporta soltanto in una directory temporanea. La funzione `read_sales` accetta anche il percorso di un CSV conforme.

```python
from io import StringIO
from pathlib import Path
from tempfile import TemporaryDirectory
import pandas as pd

DEMO_CSV = """order_id,region,amount_cents
o1,Nord,1250
o2,Nord,
o3,Sud,500
o4,,200
o5,Est,
"""


def read_sales(source) -> pd.DataFrame:
    df = pd.read_csv(
        source,
        dtype="string",
        keep_default_na=False,
        skip_blank_lines=False,
        encoding="utf-8",
    )
    required = {"order_id", "region", "amount_cents"}
    if set(df.columns) != required:
        raise ValueError("Colonne inattese o mancanti")
    for name in required:
        df[name] = df[name].str.strip()

    valid_id = df["order_id"].str.fullmatch(r"[A-Za-z0-9_-]{1,32}", na=False)
    if not valid_id.all() or df["order_id"].duplicated().any():
        raise ValueError("ID ordine non valido o duplicato")

    raw_amount = df["amount_cents"]
    valid_amount = raw_amount.eq("") | raw_amount.str.fullmatch(r"[0-9]{1,9}")
    if not valid_amount.fillna(False).all():
        raise ValueError("Importo non valido: attese fino a 9 cifre o campo vuoto")
    df["amount_cents"] = raw_amount.mask(raw_amount.eq(""), pd.NA).astype("Int64")
    df["region"] = df["region"].mask(df["region"].eq(""), pd.NA)
    return df


def summarize_sales(df: pd.DataFrame) -> pd.DataFrame:
    grouped = df.groupby("region", dropna=False, sort=True)["amount_cents"]
    report = grouped.agg(orders="size", known_orders="count")
    report["known_amount_cents"] = grouped.sum(min_count=1)
    report["missing_amounts"] = report["orders"] - report["known_orders"]
    return report.reset_index().sort_values(
        "known_amount_cents", ascending=False, na_position="last"
    ).reset_index(drop=True)


def main():
    sales = read_sales(StringIO(DEMO_CSV))
    report = summarize_sales(sales)
    north = report.loc[report["region"].eq("Nord").fillna(False)].iloc[0]
    assert north["known_amount_cents"] == 1250
    assert north["missing_amounts"] == 1
    assert report["orders"].sum() == len(sales)
    assert report["known_amount_cents"].sum() == 1950

    with TemporaryDirectory() as directory:
        output = Path(directory) / "sales_by_region.csv"
        report.to_csv(output, index=False, encoding="utf-8", na_rep="")
        assert output.read_text(encoding="utf-8").startswith("region,")
    print(report.to_string(index=False))


if __name__ == "__main__":
    main()
```

```bash
python sales_report.py
```

`size` conta tutte le righe, `count` esclude gli importi mancanti. Est rimane nel report con importo sconosciuto, Nord con un totale parziale, e la regione assente non sparisce. `summarize_sales` presume un DataFrame gia validato da `read_sales`.

Il controllo degli ID e un vincolo del demo: non deduplicare ciecamente dati reali, dove due righe possono rappresentare eventi diversi. La regola sulle nove cifre e la mancata gestione di rimborsi/valute sono scelte esplicite, non regole universali di contabilita.

### merge_demo.py

Una tabella di riferimento non dovrebbe moltiplicare le righe del report. Controlla sia la cardinalita sia le chiavi non trovate.

```python
import pandas as pd

orders = pd.DataFrame({"order_id": ["o1", "o2"], "region": ["Nord", "Sud"]})
regions = pd.DataFrame({"region": ["Nord", "Sud"], "manager": ["Anna", "Luca"]})
merged = orders.merge(
    regions, on="region", how="left", validate="many_to_one", indicator=True
)
assert len(merged) == len(orders)
if not merged["_merge"].eq("both").all():
    raise ValueError("Regione senza corrispondenza")
print(merged.drop(columns="_merge"))
```

```bash
python merge_demo.py
```

A differenza dei join SQL usuali, chiavi null in entrambi i lati possono corrispondere in pandas. Decidi esplicitamente se escluderle o trattarle come un gruppo. `validate` non sostituisce il controllo delle chiavi mancanti; `many_to_many` non impedisce esplosioni combinatorie.

## Varianti

- `concat` accoda tabelle; ripeterlo in un loop puo causare molte copie. Raccogli i pezzi e concatena una volta, quando la memoria lo consente.
- `pivot` richiede combinazioni indice/colonna non duplicate; `pivot_table` aggrega. Specifica `aggfunc` per non trasformare inconsapevolmente duplicati in medie.
- Per serie temporali, converti con `to_datetime` usando formato/errori/fuso espliciti; `resample` richiede un asse temporale adatto. UTC e ora locale non sono intercambiabili.
- `read_csv(chunksize=...)` legge a blocchi, ma ordinamenti, join e deduplicazione globale richiedono ancora una strategia. Non e calcolo distribuito automatico.
- Excel e Parquet richiedono engine opzionali, per esempio openpyxl o pyarrow. Non sono installati o verificati dal demo.
- Operazioni vettoriali riducono spesso l'overhead Python; `apply` con una funzione Python non garantisce velocita. Misura tempo e memoria.

## Errori comuni

- Sostituire tutti i mancanti con zero o scartare righe senza contarle.
- Perdere gruppi con chiavi NA usando i default di groupby.
- Assegnare una Series aspettandosi corrispondenza per posizione.
- Fare merge senza controllare duplicati e moltiplicazione delle righe.
- Usare assegnazioni concatenate o presumere una copia profonda degli oggetti.
- Aprire CSV non fidati in un foglio di calcolo senza considerare formule/iniezioni: un CSV valido non e una sanificazione per Excel.
- Caricare pickle non fidati: possono eseguire codice.

## Checklist

- Schema, ID, dtype e policy NA sono espliciti?
- Il report distingue zero, mancante e totale parziale?
- Conteggio righe e totali sono riconciliati dopo join/filtri?
- Memoria e dimensione degli intermedi sono accettabili?
- Le funzioni sono testabili fuori dal notebook?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/NumPy|NumPy]]
- [[Programmazione/Python/Pagine/Jupyter|Jupyter]]
- [[Programmazione/Python/Pagine/Gestione File|Gestione File]]
- [[Programmazione/Python/Pagine/Profiling|Profiling]]

## Fonti

- [pandas: indicizzazione e allineamento](https://pandas.pydata.org/docs/user_guide/indexing.html).
- [Copy-on-Write e migrazione a pandas 3](https://pandas.pydata.org/docs/user_guide/migration.html).
- [Valori mancanti](https://pandas.pydata.org/docs/user_guide/missing_data.html).
- [read_csv e policy di importazione](https://pandas.pydata.org/docs/reference/api/pandas.read_csv.html).
- [GroupBy](https://pandas.pydata.org/docs/user_guide/groupby.html).
- [Merge, join e concatenazione](https://pandas.pydata.org/docs/user_guide/merging.html).
- [merge: chiavi null e validate](https://pandas.pydata.org/docs/reference/api/pandas.merge.html).
