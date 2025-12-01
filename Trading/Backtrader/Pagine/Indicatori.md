# Gli Indicatori in Backtrader

Un **Indicatore** in Backtrader è un calcolo matematico basato sui dati di prezzo (OHLC) o su altri indicatori. Sono fondamentali per l'analisi tecnica e per costruire la logica di una strategia di trading.

Backtrader include una vasta libreria di indicatori pre-costruiti e permette anche di creare indicatori personalizzati.

---

## Utilizzo degli Indicatori

Gli indicatori vengono quasi sempre definiti e istanziati nel metodo `__init__` della strategia. Questo perché devono essere calcolati una sola volta all'inizio del backtest.

```python
import backtrader as bt

class MiaStrategia(bt.Strategy):
    def __init__(self):
        # Accedi alla linea di prezzo di chiusura
        self.dataclose = self.datas[0].close

        # 1. Istanzia l'indicatore
        self.sma = bt.indicators.SimpleMovingAverage(
            self.datas[0], period=15)

        # Puoi anche passare solo la linea di prezzo
        self.rsi = bt.indicators.RSI(self.dataclose, period=14)

    def next(self):
        # 2. Accedi al valore dell'indicatore
        if self.rsi[0] < 30:
            # Logica di acquisto
            pass
```

### 1. Istanziare un Indicatore

Quando crei un'istanza di un indicatore, devi passare:
1.  **Il Data Feed**: `self.datas[0]` è il target principale su cui calcolare l'indicatore. Backtrader userà i prezzi OHLC da questo data feed.
2.  **Parametri specifici**: Ogni indicatore ha i suoi parametri (es. `period` per le medie mobili o l'RSI).

### 2. Accedere ai Valori

Come per i prezzi, il valore di un indicatore viene letto usando la notazione ad array:
-   `self.sma[0]`: Valore corrente della media mobile.
-   `self.sma[-1]`: Valore della barra precedente.
-   `self.sma[-2]`: Valore di due barre fa.

Questo permette di implementare facilmente logiche basate su cross o cambiamenti di stato.

```python
# Esempio di logica di cross in next()
if self.dataclose[0] > self.sma[0] and self.dataclose[-1] <= self.sma[-1]:
    print("Il prezzo ha incrociato la media mobile verso l'alto!")
```

---

## Indicatori Comuni

Backtrader offre decine di indicatori pronti all'uso. Ecco alcuni dei più comuni:

-   **`SimpleMovingAverage` (SMA)**: Media mobile semplice.
    ```python
    bt.indicators.SimpleMovingAverage(self.datas[0], period=20)
    ```
-   **`ExponentialMovingAverage` (EMA)**: Media mobile esponenziale, che dà più peso ai prezzi recenti.
    ```python
    bt.indicators.ExponentialMovingAverage(self.datas[0], period=20)
    ```
-   **`RSI` (Relative Strength Index)**: Oscillatore di momentum che misura la velocità e il cambiamento dei movimenti di prezzo.
    ```python
    bt.indicators.RSI(self.datas[0], period=14)
    ```
-   **`MACD` (Moving Average Convergence Divergence)**: Indicatore di trend che mostra la relazione tra due medie mobili esponenziali.
    ```python
    bt.indicators.MACD(self.datas[0])
    ```
-   **`BollingerBands`**: Bande di volatilità posizionate sopra e sotto una media mobile.
    ```python
    bt.indicators.BollingerBands(self.datas[0], period=20)
    ```

## Accedere alle Linee di un Indicatore

Alcuni indicatori, come il MACD o le Bande di Bollinger, hanno più "linee" di output.

Per esempio, il **MACD** ha 3 linee:
- `self.macd.macd`: La linea MACD principale.
- `self.macd.signal`: La linea del segnale.
- `self.macd.histo`: L'istogramma (differenza tra le due).

Si accede ad esse come attributi dell'oggetto indicatore:

```python
class MyStrategy(bt.Strategy):
    def __init__(self):
        self.macd = bt.indicators.MACD(self.datas[0])

    def next(self):
        # Verifica un cross tra la linea MACD e la linea del segnale
        if self.macd.macd[0] > self.macd.signal[0]:
            pass
```

Per le **Bande di Bollinger**, le linee sono:
- `self.bbands.mid`: La media mobile centrale.
- `self.bbands.top`: La banda superiore.
- `self.bbands.bot`: La banda inferiore.

---

## Creare un Indicatore Personalizzato

Se un indicatore non è disponibile, puoi crearlo definendo una nuova classe che eredita da `bt.Indicator`.

La struttura di base è la seguente:
-   `lines`: Una tupla che definisce i nomi delle linee di output dell'indicatore.
-   `params`: Parametri configurabili, come il periodo.
-   `__init__`: Dove si eseguono calcoli preliminari se necessario.
-   `next`: Il metodo dove viene calcolato il valore dell'indicatore per ogni barra.

```python
# Esempio: un semplice indicatore che calcola il prezzo medio (H+L)/2
class AveragePrice(bt.Indicator):
    lines = ('avgprice',) # La nostra linea di output
    params = (('period', 1),) # Non usato qui, ma per esempio

    def __init__(self):
        # Accede alle linee di prezzo high e low
        self.high = self.data.high
        self.low = self.data.low

    def next(self):
        # Calcola il valore per la barra corrente [0]
        self.lines.avgprice[0] = (self.high[0] + self.low[0]) / 2

# Come usarlo nella strategia:
# def __init__(self):
#     self.my_avg_price = AveragePrice(self.datas[0])
```