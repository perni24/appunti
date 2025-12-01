# Il Ruolo di Cerebro in Backtrader

**Cerebro** (cervello, in spagnolo) è il cuore pulsante di qualsiasi script Backtrader. È l'engine che si occupa di orchestrare tutti i componenti necessari per eseguire un backtest, un'ottimizzazione o una sessione di live trading.

Il suo compito è quello di:
1.  Ricevere i dati storici (data feeds).
2.  Prendere in carico una o più strategie.
3.  Collegare tutti gli altri componenti (Sizers, Analyzers, Observers).
4.  Eseguire il backtest, evento per evento.
5.  Fornire i risultati finali e permettere la visualizzazione grafica.

---

## Flusso di Lavoro Tipico con Cerebro

L'utilizzo di Cerebro segue quasi sempre una sequenza ben definita:

1.  **Creazione dell'istanza**: Si inizia creando un oggetto di tipo `Cerebro`.
2.  **Aggiunta dei Dati**: Si caricano uno o più feed di dati storici.
3.  **Aggiunta della Strategia**: Si aggiunge la classe che contiene la logica di trading.
4.  **Configurazione del Broker**: Si imposta il capitale iniziale e le commissioni.
5.  **(Opzionale) Aggiunta di Analizzatori**: Si aggiungono `Analyzers` per calcolare metriche di performance.
6.  **Esecuzione**: Si lancia il backtest con il metodo `run()`.
7.  **Analisi dei Risultati**: Si stampano i risultati e si visualizza il grafico.

---

## Funzioni Principali di `cerebro`

Ecco i metodi più comuni che vengono chiamati sull'istanza di Cerebro.

### `cerebro = bt.Cerebro()`

Crea l'istanza principale del motore di backtesting. Accetta alcuni argomenti per una configurazione avanzata, ma spesso viene inizializzato senza parametri.

```python
import backtrader as bt

# 1. Creazione dell'istanza di Cerebro
cerebro = bt.Cerebro()
```

### `cerebro.adddata(dataname)`

Aggiunge un "data feed" al sistema. `dataname` è un oggetto che rappresenta una serie storica (es. da un file CSV, da un database o da un'API). È possibile aggiungere più data feed, ad esempio per testare strategie su più asset contemporaneamente.

```python
# Esempio con un data feed da un file CSV
data = bt.feeds.GenericCSVData(
    dataname='dati_storici.csv',
    dtformat=('%Y-%m-%d'),
    # ... altre configurazioni per le colonne
)

# 2. Aggiunta dei dati a Cerebro
cerebro.adddata(data)
```

### `cerebro.addstrategy(strategy, ...)`

Aggiunge la classe della strategia che si vuole testare. È il componente che contiene la logica `buy`/`sell`. È possibile passare argomenti alla strategia direttamente da questo metodo.

```python
# 'MyStrategy' è una classe che eredita da bt.Strategy
# stiamo passando il parametro 'media_periodo' al suo __init__
cerebro.addstrategy(MyStrategy, media_periodo=21)
```

### `cerebro.resampledata(dataname, timeframe, compression)`

Aggiunge un data feed con un timeframe diverso rispetto a quello originale (es. da dati giornalieri a settimanali). Utile per testare strategie multi-timeframe.

```python
# Aggiunge una versione settimanale del data feed originale
cerebro.resampledata(data, timeframe=bt.TimeFrame.Weeks)
```

### `cerebro.broker.setcash(valore)`

Imposta il capitale iniziale per la simulazione. `cerebro.broker` è l'oggetto che simula l'intermediario.

```python
# Imposta un capitale iniziale di 10,000€
cerebro.broker.setcash(10000.0)
```

### `cerebro.broker.setcommission(commission)`

Imposta le commissioni di trading. Questo è fondamentale per ottenere un backtest realistico.

```python
# Imposta una commissione dello 0.1% per operazione
cerebro.broker.setcommission(commission=0.001)
```

### `cerebro.addanalyzer(analyzer, ...)`

Aggiunge un analizzatore per calcolare metriche specifiche sulla performance della strategia. Esempi comuni sono `bt.analyzers.SharpeRatio`, `bt.analyzers.DrawDown`, `bt.analyzers.TradeAnalyzer`.

```python
cerebro.addanalyzer(bt.analyzers.SharpeRatio, _name='sharpe')
```

### `cerebro.addsizer(sizer)`

Aggiunge un "sizer", ovvero un componente che gestisce la logica per determinare la size (quantità) di ogni operazione. L'impostazione di default è `FixedSize` con `stake=1`.

```python
# Ogni operazione userà il 20% del capitale disponibile
cerebro.addsizer(bt.sizers.PercentSizer, percents=20)
```

### `cerebro.run()`

Avvia il processo di backtesting. Cerebro inizia a ciclare sui dati storici, passando ogni "candela" alla strategia e agli altri componenti. **Questo è il metodo che esegue la simulazione.**

```python
# 6. Esecuzione del backtest
risultati = cerebro.run()
```
Il metodo restituisce una lista contenente le istanze delle strategie eseguite, complete dei risultati degli analizzatori.

### `cerebro.plot()`

Dopo l'esecuzione di `run()`, questo metodo genera un grafico interattivo che mostra l'andamento del prezzo, il valore del portafoglio, gli indicatori e le operazioni eseguite.

```python
# 7. Visualizzazione grafica dei risultati
cerebro.plot(style='candlestick')
```

### `cerebro.optstrategy(strategy, ...)`

Da usare al posto di `addstrategy` per eseguire un'ottimizzazione. Permette di testare una strategia su un range di parametri.

```python
# Esegue la strategia per ogni valore di 'media_periodo' da 10 a 30
cerebro.optstrategy(
    MyStrategy,
    media_periodo=range(10, 31)
)
```
