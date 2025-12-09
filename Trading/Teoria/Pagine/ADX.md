# Average Directional Index (ADX)

L'Average Directional Index (ADX) è un indicatore tecnico utilizzato nell'analisi tecnica per misurare la forza di un trend, sia esso rialzista o ribassista. L'ADX non indica la direzione del trend, ma piuttosto la sua intensità. Spesso è accompagnato da due altri indicatori, il Positive Directional Indicator (+DI) e il Negative Directional Indicator (-DI), che insieme formano il Directional Movement Index (DMI).

## Componenti del DMI (Directional Movement Index)

Prima di calcolare l'ADX, è necessario calcolare il +DI e il -DI. Questi due indicatori sono derivati dal "Directional Movement" (DM).

### Directional Movement (DM)

*   **+DM (Positive Directional Movement):** Rappresenta la porzione del range della candela attuale che è al di sopra della candela precedente. Se il massimo attuale è maggiore del massimo precedente e la differenza è maggiore del minimo precedente rispetto al minimo attuale, allora `+DM = Massimo Attuale - Massimo Precedente`. Altrimenti, `+DM = 0`.
*   **-DM (Negative Directional Movement):** Rappresenta la porzione del range della candela attuale che è al di sotto della candela precedente. Se il minimo attuale è minore del minimo precedente e la differenza è maggiore del massimo attuale rispetto al massimo precedente, allora `-DM = Minimo Precedente - Minimo Attuale`. Altrimenti, `-DM = 0`.
*   Quando c'è un +DM, il -DM è zero, e viceversa.

### True Range (TR)

Il True Range (TR) è il più grande dei seguenti:
1.  Massimo attuale - Minimo attuale
2.  Valore assoluto (Massimo attuale - Chiusura precedente)
3.  Valore assoluto (Minimo attuale - Chiusura precedente)

### Calcolo del +DI e -DI

Dopo aver calcolato i valori +DM, -DM e TR per ogni periodo, si calcolano le medie mobili esponenziali (o semplici, a seconda della preferenza) di questi valori su un periodo specifico (comunemente 14 periodi).

*   **+DI:** `(Media Mobile Esponenziale di +DM) / (Media Mobile Esponenziale di TR) * 100`
*   **-DI:** `(Media Mobile Esponenziale di -DM) / (Media Mobile Esponenziale di TR) * 100`

## Calcolo dell'ADX

L'ADX è calcolato in base al "Directional Movement Index" (DX).

### Directional Movement Index (DX)

Il DX misura la differenza tra +DI e -DI in termini percentuali:

$$
DX = \frac{\left| +DI - (-DI) \right|}{\left| +DI + (-DI) \right|} \times 100
$$ 

### Average Directional Index (ADX)

L'ADX è una media mobile esponenziale (o semplice) del DX, solitamente calcolata su un periodo di 14 periodi.

## Interpretazione e Utilizzo

L'ADX è interpretato nel seguente modo:

*   **ADX < 20-25:** Indica un mercato privo di trend (ranging market) o un trend debole.
*   **ADX > 25:** Suggerisce che un trend forte è in atto. Più alto è il valore dell'ADX, più forte è il trend.
*   **ADX in aumento:** Il trend attuale (sia esso rialzista o ribassista) sta guadagnando forza.
*   **ADX in diminuzione:** Il trend attuale sta perdendo forza e potrebbe invertirsi o entrare in una fase di consolidamento.

### Utilizzo combinato con +DI e -DI

*   **ADX forte e +DI sopra -DI:** Indica un forte trend rialzista.
*   **ADX forte e -DI sopra +DI:** Indica un forte trend ribassista.
*   **Crossover +DI e -DI:**
    *   Quando il +DI incrocia sopra il -DI, può generare un segnale di acquisto.
    *   Quando il -DI incrocia sopra il +DI, può generare un segnale di vendita.

## Vantaggi

*   **Misura la Forza del Trend:** A differenza di molti altri indicatori, l'ADX quantifica la forza del trend, permettendo ai trader di distinguere tra mercati in trend e mercati laterali.
*   **Indipendente dalla Direzione:** Non è un indicatore direzionale, il che lo rende utile in combinazione con altri indicatori per confermare i segnali.
*   **Versatilità:** Può essere utilizzato su qualsiasi time frame e su qualsiasi asset.

## Svantaggi

*   **Lagging Indicator:** Essendo basato su medie mobili, l'ADX è un indicatore ritardato e può dare segnali in ritardo rispetto all'inizio o alla fine di un trend.
*   **Non Indicatore di Direzione:** Non fornisce informazioni sulla direzione del trend, rendendo necessaria l'integrazione con +DI e -DI o altri indicatori direzionali.
*   **Falsi Segnali in Mercati Volatili:** In mercati estremamente volatili, può generare falsi segnali sulla forza del trend.

## Considerazioni Finali

L'ADX è uno strumento prezioso per i trader che cercano di valutare la forza del trend. Un ADX elevato suggerisce di utilizzare strategie di trading di tendenza, mentre un ADX basso suggerisce strategie di trading di range. È fondamentale utilizzarlo in combinazione con altri indicatori e con una buona gestione del rischio.
