# Le Strategie in Backtrader

La **Strategia** è il componente più importante del tuo sistema di trading. È una classe Python che contiene tutta la logica decisionale: quando entrare nel mercato, quando uscire, e come gestire le operazioni.

Ogni strategia in Backtrader è una classe che eredita da `bt.Strategy`.

---

## Struttura di Base di una Strategia

Una classe `Strategy` è composta da diverse parti, ognuna con un ruolo specifico.

```python
import backtrader as bt

# Definisci una classe che eredita da bt.Strategy
class MiaStrategia(bt.Strategy):
    # 1. (Opzionale) Definizione dei parametri
    params = (
        ('media_veloce', 10),
        ('media_lenta', 30),
    )

    # 2. Metodo di inizializzazione
    def __init__(self):
        # Inizializza indicatori, variabili, ecc.
        pass

    # 3. Metodo di notifica (per ordini e trade)
    def notify_order(self, order):
        # Gestisce le notifiche degli ordini
        pass

    def notify_trade(self, trade):
        # Gestisce le notifiche dei trade
        pass
        
    # 4. Metodo principale (chiamato ad ogni barra)
    def next(self):
        # Contiene la logica di trading principale
        pass
```

### 1. I Parametri (`params`)

I parametri consentono di rendere una strategia flessibile e facilmente ottimizzabile. Sono definiti come una tupla di tuple o un dizionario.

-   **Definizione**: Vengono definiti all'inizio della classe.
-   **Accesso**: All'interno della strategia, si accede ai parametri tramite `self.p` (es. `self.p.media_veloce`).
-   **Modifica**: Possono essere sovrascritti quando si aggiunge la strategia a Cerebro, permettendo di testare diverse configurazioni senza modificare il codice.

```python
# Esempio di passaggio dei parametri in Cerebro
cerebro.addstrategy(MiaStrategia, media_veloce=15, media_lenta=50)
```

### 2. Il Metodo `__init__(self)`

Questo metodo viene chiamato una sola volta quando la strategia viene caricata da Cerebro. È il posto ideale per:

-   **Creare gli indicatori**: Si definiscono qui tutti gli indicatori che verranno usati (es. Medie Mobili, RSI).
-   **Accedere ai dati**: Si crea un riferimento ai data feed (es. `self.dataclose = self.datas[0].close`).
-   **Inizializzare variabili**: Si impostano variabili che devono essere mantenute durante tutto il backtest.

```python
def __init__(self):
    # self.datas[0] è il primo (e spesso unico) data feed
    self.dataclose = self.datas[0].close

    # Crea gli indicatori usando i parametri
    self.sma_veloce = bt.indicators.SimpleMovingAverage(
        self.datas[0], period=self.p.media_veloce)
    
    self.sma_lenta = bt.indicators.SimpleMovingAverage(
        self.datas[0], period=self.p.media_lenta)
```

### 3. Il Metodo `next(self)`

Questo è il cuore della strategia. Viene chiamato per ogni "candela" (o barra) dei dati storici. Tutta la logica di acquisto e vendita viene scritta qui.

**Accesso a Prezzi e Indicatori:**
Backtrader funziona come un array. L'indice `[0]` si riferisce alla barra *corrente*, `[-1]` a quella *precedente*, `[-2]` a due barre fa, e così via.

```python
def next(self):
    # Stampa il prezzo di chiusura della candela corrente
    self.log(f'Close, {self.dataclose[0]}')

    # Esempio di logica: cross di medie mobili
    if self.sma_veloce[0] > self.sma_lenta[0]:
        # Logica di acquisto
        pass
```

### 4. Gestione delle Operazioni

Per entrare o uscire dal mercato si usano i metodi `self.buy()` e `self.sell()`.

**Verifica della Posizione:**
Prima di aprire un nuovo ordine, è buona norma controllare se si è già a mercato. Questo si fa con `self.position`.

```python
def next(self):
    # Se non siamo già a mercato
    if not self.position:
        # Condizione di acquisto: la media veloce incrocia da sotto a sopra quella lenta
        if self.sma_veloce[0] > self.sma_lenta[0] and self.sma_veloce[-1] <= self.sma_lenta[-1]:
            self.log(f'BUY CREATE, {self.dataclose[0]}')
            self.buy() # Esegui un ordine di acquisto

    # Se siamo già a mercato
    else:
        # Condizione di vendita: la media veloce incrocia da sopra a sotto quella lenta
        if self.sma_veloce[0] < self.sma_lenta[0]:
            self.log(f'SELL CREATE, {self.dataclose[0]}')
            self.sell() # Esegui un ordine di vendita (chiusura posizione long)
```

---

## Logging e Notifiche

Per tenere traccia di cosa sta succedendo durante il backtest, si usano le funzioni di notifica.

### `log(self, txt, dt=None)`

È una funzione helper (non standard di Backtrader, ma di uso comune) per stampare messaggi formattati con la data corrente.

```python
def log(self, txt, dt=None):
    dt = dt or self.datas[0].datetime.date(0)
    print(f'{dt.isoformat()}, {txt}')
```

### `notify_order(self, order)`

Viene chiamata ogni volta che c'è un aggiornamento sullo stato di un ordine. È fondamentale per sapere se un ordine è stato accettato, eseguito o rifiutato.

```python
def notify_order(self, order):
    if order.status in [order.Submitted, order.Accepted]:
        # L'ordine è stato inviato/accettato dal broker - non fare nulla
        return

    if order.status in [order.Completed]:
        if order.isbuy():
            self.log(f'BUY EXECUTED, Price: {order.executed.price:.2f}, Cost: {order.executed.value:.2f}, Comm: {order.executed.comm:.2f}')
        elif order.issell():
            self.log(f'SELL EXECUTED, Price: {order.executed.price:.2f}, Cost: {order.executed.value:.2f}, Comm: {order.executed.comm:.2f}')
    
    elif order.status in [order.Canceled, order.Margin, order.Rejected]:
        self.log('Order Canceled/Margin/Rejected')
```

### `notify_trade(self, trade)`

Viene chiamata alla chiusura di un trade (una coppia di acquisto e vendita). È utile per analizzare la performance di ogni singola operazione.

```python
def notify_trade(self, trade):
    if not trade.isclosed:
        return

    self.log(f'OPERATION PROFIT, GROSS {trade.pnl:.2f}, NET {trade.pnlcomm:.2f}')
```
