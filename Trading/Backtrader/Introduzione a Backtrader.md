## Cos'è Backtrader?

**Backtrader** è una libreria open-source per Python progettata specificamente per il *backtesting* di strategie di trading. In parole semplici, permette di "simulare" l'esecuzione di una strategia di trading su dati storici per vedere come si sarebbe comportata in passato.

Oltre al backtesting, la libreria è ricca di funzionalità e può essere usata anche per l'ottimizzazione dei parametri e per il trading automatico in tempo reale (live trading).

## Perché si usa?

L'obiettivo principale di Backtrader è fornire ai trader e agli sviluppatori uno strumento robusto per:

1.  **Testare le Idee**: Verificare se un'idea di trading è potenzialmente profittevole prima di rischiare capitale reale.
2.  **Ottimizzare le Strategie**: Trovare i parametri migliori per una strategia (es. la lunghezza di una media mobile) per massimizzarne la performance.
3.  **Evitare Errori Comuni**: Il backtesting aiuta a identificare i punti deboli e i rischi di una strategia in diverse condizioni di mercato.
4.  **Automatizzare**: Una volta che una strategia è stata testata e validata, Backtrader può essere collegato a un broker per eseguirla automaticamente.

## I Concetti Chiave di Backtrader

L'ecosistema di Backtrader si basa su alcuni componenti fondamentali:

-   **[[Cerebro]]**: È il "cervello" del sistema. È l'engine che orchestra tutti gli altri componenti: carica i dati, esegue la strategia, calcola le statistiche e restituisce i risultati.
-   **Data Feeds**: Sono le fonti dei dati storici (es. Open, High, Low, Close, Volume) che vengono forniti a Cerebro. Backtrader può leggere dati da file CSV, database o direttamente da piattaforme di broker.
-   **[[Strategie|Strategy]]**: È la classe Python in cui si definisce la logica di trading. Qui si scrivono le regole per entrare e uscire dal mercato (es. "compra quando la media mobile a 20 periodi incrocia al rialzo quella a 50").
-   **[[Indicatori|Indicators]]**: Backtrader include una vasta libreria di indicatori tecnici già pronti (Medie Mobili, RSI, MACD, Bande di Bollinger, ecc.) che possono essere facilmente integrati nelle strategie.
-   **Broker**: Simula il comportamento di un intermediario finanziario. Gestisce gli ordini (buy/sell), il portafoglio, il capitale disponibile e calcola le commissioni.
-   **Analyzers**: Sono strumenti che permettono di analizzare le performance della strategia. Possono calcolare metriche come lo Sharpe Ratio, il drawdown massimo, il profitto totale e molto altro.

In sintesi, Backtrader fornisce un'infrastruttura completa che permette a chi sviluppa strategie di concentrarsi quasi esclusivamente sulla scrittura della logica di trading, astraendo tutta la complessità della simulazione e dell'analisi dei risultati.
