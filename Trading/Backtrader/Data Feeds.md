# Data Feeds in Backtrader

I **Data Feeds** sono il punto di partenza di qualsiasi analisi in `backtrader`. Rappresentano la serie storica dei prezzi (o di altri dati) su cui la strategia opererà. Senza dati, Cerebro non ha nulla da elaborare.

Un data feed in `backtrader` è un oggetto iterabile che fornisce i dati "candela per candela" al motore di backtesting. Ogni elemento iterato contiene le informazioni classiche di una barra di prezzo:
-   **Open**
-   **High**
-   **Low**
-   **Close**
-   **Volume**
-   **Open Interest**
-   **Datetime**

`Backtrader` è estremamente flessibile e permette di caricare dati da una vasta gamma di fonti.

---

## Fonti di Dati Comuni

Le fonti di dati più utilizzate sono:

1.  **File CSV**: Il formato più comune e semplice. `Backtrader` offre un lettore generico (`GenericCSVData`) e lettori pre-configurati per formati specifici.
2.  **API di Broker Online**: È possibile collegarsi a broker come Interactive Brokers, OANDA, o Visual Chart per ottenere dati in tempo reale o storici.
3.  **Database**: Si possono caricare dati da database SQL.
4.  **Pandas DataFrame**: È possibile convertire un DataFrame di Pandas in un data feed compatibile con `backtrader`.
5.  **Servizi di Dati**: Come Yahoo Finance, Quandl, e altri.

---

## Lettori di Dati (Data Readers)

`Backtrader` gestisce le diverse fonti tramite classi specializzate. Ecco le più importanti.

### `bt.feeds.GenericCSVData`

È la classe più versatile per leggere file CSV con un formato personalizzato. Permette di specificare quali colonne corrispondono a Open, High, Low, Close, Volume, etc.

**Parametri Principali**:
-   `dataname`: Il percorso del file CSV.
-   `dtformat`: Il formato della data/ora (es. `%Y-%m-%d`).
-   `datetime`, `open`, `high`, `low`, `close`, `volume`, `openinterest`: Indici delle colonne (0-based) corrispondenti.
-   `headers`: `True` se il file ha una riga di intestazione.
-   `separator`: Il carattere separatore (es. `,` o `;`).

```python
data = bt.feeds.GenericCSVData(
    dataname='mydata.csv',
    dtformat=('%Y-%m-%d'),
    datetime=0,
    high=2,
    low=3,
    open=1,
    close=4,
    volume=5,
    openinterest=-1  # -1 significa che non è presente
)
```

### `bt.feeds.YahooFinanceCSVData`

Lettore pre-configurato per i file CSV scaricati da Yahoo Finance.

```python
data = bt.feeds.YahooFinanceCSVData(
    dataname='yahoo_finance_data.csv'
)
```

### `bt.feeds.PandasData`

Permette di usare un **Pandas DataFrame** come fonte di dati. Questo è estremamente utile se si eseguono pre-elaborazioni con Pandas.

**Parametri**:
-   `dataname`: Il DataFrame di Pandas.
-   Le colonne del DataFrame devono avere nomi specifici: `datetime`, `open`, `high`, `low`, `close`, `volume`. Se la colonna `datetime` è l'indice, `backtrader` la rileverà automaticamente.

```python
import pandas as pd

# 'mydf' è un DataFrame di Pandas
data = bt.feeds.PandasData(dataname=mydf)
```

### `bt.Store` e Broker Feeds

Per i dati da API (live o storici), si utilizza il concetto di `Store`. Ad esempio, con `ibstore` per Interactive Brokers.

```python
# Esempio concettuale per Interactive Brokers
store = bt.stores.IBStore(host='127.0.0.1', port=7496)

# Richiesta di dati storici
data = store.getdata(dataname='EUR.USD-CASH-IDEALPRO')
```

---

## Linee e Accesso ai Dati

Una volta caricato, un data feed è accessibile all'interno di una strategia come `self.data` o `self.datas[0]`.

Ogni "linea" (es. `self.data.close`, `self.data.open`) è una serie di punti. Per accedere al valore corrente, si usa l'indice `[0]`. Per il valore precedente, `[-1]`, e così via.

```python
class MyStrategy(bt.Strategy):
    def next(self):
        # Prezzo di chiusura corrente
        prezzo_attuale = self.data.close[0]
        
        # Prezzo di chiusura precedente
        prezzo_precedente = self.data.close[-1]

        if prezzo_attuale > prezzo_precedente:
            print("Il prezzo è salito!")
```

Questo meccanismo di indicizzazione è fondamentale e viene usato ovunque in `backtrader`, anche per gli indicatori.
