# Average True Range (ATR)

L'Average True Range (ATR) è un indicatore tecnico di volatilità utilizzato nell'analisi tecnica. Fu introdotto da J. Welles Wilder Jr. nel suo libro "New Concepts in Technical Trading Systems" del 1978. L'ATR non fornisce indicazioni sulla direzione del trend, ma misura la volatilità del mercato. Un ATR elevato indica una maggiore volatilità, mentre un ATR basso indica una minore volatilità.

## Calcolo

L'ATR si basa sul concetto di "True Range" (TR), che rappresenta il range di trading "reale" di un asset. Il TR è il più grande dei seguenti valori:
1.  Massimo attuale - Minimo attuale
2.  Valore assoluto (Massimo attuale - Chiusura precedente)
3.  Valore assoluto (Minimo attuale - Chiusura precedente)

L'ATR è una media mobile (solitamente esponenziale) del True Range su un determinato periodo di tempo, comunemente 14 periodi.

La formula per calcolare l'ATR è:

$$
ATR = \frac{ATR_{precedente} \times (n-1) + TR_{attuale}}{n}
$$ 

Dove:
-   `n` è il numero di periodi (es. 14)
-   `TR` è il True Range
-   Per il primo ATR, si calcola la media aritmetica dei primi 14 TR.

## Interpretazione e Utilizzo

L'ATR è utilizzato principalmente per:

1.  **Valutare la Volatilità:**
    *   Un ATR in aumento indica che la volatilità del mercato sta crescendo.
    *   Un ATR in diminuzione indica che la volatilità del mercato sta diminuendo.

2.  **Impostare Stop-Loss:** L'ATR è uno strumento molto popolare per determinare la distanza appropriata per uno stop-loss. Un metodo comune è impostare lo stop-loss a una distanza pari a un multiplo dell'ATR (es. 2x o 3x ATR) dal prezzo di ingresso. Questo permette di adattare lo stop-loss alla volatilità corrente del mercato, evitando stop-loss troppo stretti in mercati volatili o troppo larghi in mercati poco volatili.

3.  **Dimensionamento della Posizione (Position Sizing):** Poiché l'ATR fornisce una misura della volatilità, può essere utilizzato per calcolare la dimensione della posizione in base al rischio che si è disposti ad assumere per ogni trade. Ad esempio, si può decidere di rischiare una certa percentuale del capitale e utilizzare l'ATR per determinare il numero di azioni o contratti da acquistare o vendere.

4.  **Identificare Potenziali Breakout:** Un ATR molto basso per un periodo prolungato può indicare una fase di consolidamento del mercato. Questo può essere seguito da un aumento della volatilità e da un potenziale breakout.

## Vantaggi

*   **Adattabilità:** Si adatta alla volatilità del mercato, fornendo una misura più realistica del rischio rispetto a un valore fisso.
*   **Oggettività:** Fornisce un metodo oggettivo per impostare stop-loss e dimensionare le posizioni.
*   **Versatilità:** Può essere applicato a qualsiasi mercato e a qualsiasi time frame.

## Svantaggi

*   **Non Indicatore di Direzione:** L'ATR non fornisce alcuna informazione sulla direzione del trend, quindi deve essere utilizzato in combinazione con altri indicatori direzionali.
*   **Soggettività nella Scelta del Periodo:** L'efficacia dell'ATR dipende dalla scelta del periodo. Un periodo più breve lo rende più sensibile, ma anche più "rumoroso", mentre un periodo più lungo lo rende più "liscio", ma anche più lento a reagire.
*   **Interpretazione Relativa:** L'ATR è un valore assoluto e non normalizzato, quindi non è facile confrontare l'ATR di diversi strumenti finanziari.

## Considerazioni Finali

L'ATR è un indicatore essenziale per la gestione del rischio. Aiuta i trader a comprendere la volatilità del mercato e a prendere decisioni più informate su stop-loss e dimensionamento della posizione. Tuttavia, non dovrebbe essere usato da solo per generare segnali di trading, ma piuttosto come uno strumento complementare all'interno di una strategia di trading più ampia.
