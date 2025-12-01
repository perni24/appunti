# Broker

In Backtrader, il "broker" è l'entità che simula l'interazione con un vero broker finanziario. È responsabile della gestione del capitale, dell'esecuzione degli ordini e del calcolo di commissioni e slippage.

## Funzioni Principali del Broker

- **Gestione del Capitale e del Portafoglio**: Tiene traccia della liquidità disponibile e del valore delle posizioni in portafoglio.
- **Esecuzione degli Ordini**: Simula o esegue ordini di acquisto/vendita (Market, Limit, Stop, ecc.).
- **Commissioni e Slippage**: Applica commissioni alle operazioni e simula lo slippage (la differenza tra il prezzo atteso e quello di esecuzione).
- **Gestione delle Posizioni**: Traccia le posizioni long e short correnti per ogni asset.

## Configurazione del Broker

Quando si crea un'istanza di `cerebro`, viene automaticamente creato un broker di default. È possibile configurarlo tramite l'oggetto `cerebro.broker`.

### Impostare il Capitale Iniziale

```python
import backtrader as bt

cerebro = bt.Cerebro()
cerebro.broker.set_cash(100000.0)  # Imposta il capitale iniziale a 100,000
```

### Impostare le Commissioni

È fondamentale per un backtesting realistico.

```python
# Imposta una commissione dello 0.1%
cerebro.broker.setcommission(commission=0.001)
```

### Configurare lo Slippage

```python
# Imposta uno slippage dello 0.05%
cerebro.broker.set_slippage_perc(perc=0.0005)
```

## Funzioni del Broker in una Strategia

All'interno di una strategia (`bt.Strategy`), si può accedere al broker tramite `self.broker`.

### Ottenere la Liquidità Corrente

`get_cash()` restituisce il saldo di cassa corrente.

```python
current_cash = self.broker.get_cash()
self.log(f'Liquidità corrente: {current_cash:.2f}')
```

### Ottenere il Valore del Portafoglio

`get_value()` restituisce il valore totale del portafoglio (liquidità + valore di mercato delle posizioni).

```python
portfolio_value = self.broker.get_value()
self.log(f'Valore del portafoglio: {portfolio_value:.2f}')
```

### Controllare gli Ordini Aperti

`get_orders_open()` può essere usato per vedere se ci sono ordini in sospeso.

```python
open_orders = self.broker.get_orders_open()
if open_orders:
    self.log(f'Ci sono {len(open_orders)} ordini aperti.')
```

## Trading Live

Backtrader permette di passare dal backtesting al trading live cambiando il broker. Ad esempio, per Interactive Brokers si userebbe `bt.brokers.IBBroker`.

```python
# Esempio per Interactive Brokers
# cerebro.broker = bt.brokers.IBBroker(host='127.0.0.1', port=7497, clientId=1)
# cerebro.adddata(bt.feeds.IBData(dataname='AAPL-STK-SMART-USD'))
```
