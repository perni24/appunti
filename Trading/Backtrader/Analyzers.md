# Analyzers in Backtrader

Gli Analyzers in `backtrader` sono classi speciali che possono essere aggiunte a `cerebro` per analizzare le performance di una strategia di trading. Forniscono metriche dettagliate che vanno oltre il semplice profitto o perdita finale.

## Tipi Comuni di Analyzers

- **SharpeRatio**: Calcola lo Sharpe Ratio della strategia.
- **TradeAnalyzer**: Analizza le singole operazioni (trade), fornendo statistiche come il numero di trade vincenti/perdenti, il profitto medio per trade, ecc.
- **DrawDown**: Misura il drawdown massimo della strategia.
- **Returns**: Calcola i ritorni totali e annualizzati.
- **PyFolio**: Si integra con la libreria `pyfolio` per creare un'analisi completa delle performance.

## Come Aggiungere un Analyzer

Gli analyzers vengono aggiunti a un'istanza di `cerebro` prima di eseguire il backtest, utilizzando il metodo `addanalyzer`.

```python
import backtrader as bt

# ... (definizione della strategia) ...

cerebro = bt.Cerebro()

# Aggiungi la strategia
cerebro.addstrategy(MyStrategy)

# Aggiungi i dati
# ...

# Aggiungi gli analyzers
cerebro.addanalyzer(bt.analyzers.SharpeRatio, _name='mysharpe')
cerebro.addanalyzer(bt.analyzers.TradeAnalyzer, _name='mytrade')
cerebro.addanalyzer(bt.analyzers.DrawDown, _name='mydrawdown')

# Esegui il backtest
results = cerebro.run()

# Ottieni i risultati dagli analyzers
strat = results[0]
print('Sharpe Ratio:', strat.analyzers.mysharpe.get_analysis())
print('Trade Analysis:', strat.analyzers.mytrade.get_analysis())
print('Drawdown:', strat.analyzers.mydrawdown.get_analysis())

```

## Analisi dei Risultati

Dopo l'esecuzione (`cerebro.run()`), i risultati degli analyzers sono disponibili attraverso l'oggetto strategia restituito. Ogni analyzer ha un metodo `get_analysis()` che restituisce un dizionario o un oggetto con i dati calcolati.
