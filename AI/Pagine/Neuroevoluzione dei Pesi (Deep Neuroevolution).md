## Guida Tecnica di Base

### 1. Definizione
La Neuroevoluzione dei Pesi consiste nell'applicare algoritmi evolutivi direttamente ai parametri numerici (pesi) di una rete neurale. Si scarta la matematica delle derivate (Backpropagation) in favore di un approccio basato su "tentativi, errori e sopravvivenza".

### 2. Concetti Chiave
- **DNA Digitale:** Il vettore che contiene tutti i pesi della rete.
- **Mutazione:** Modifica casuale di alcuni valori del vettore (es. aggiunta di rumore gaussiano).
- **Crossover:** Combinazione di due reti neurali "genitori" per crearne una "figlia".

### 3. Implementazione Pratica
1. **Definizione Rete:** Creazione di una rete neurale (es. tramite PyTorch o NumPy).
2. **Campionamento:** Generazione di una popolazione iniziale di modelli con pesi casuali.
3. **Valutazione:** Test in un ambiente di simulazione (es. un videogioco o un task robotico).
4. **Selezione:** Scelta dei modelli con le prestazioni più alte e generazione della discendenza.

### 4. Casi d'Uso Ideali
- **Robotica:** Ottimizzazione di sensori e movimenti.
- **Gaming:** Creazione di AI che imparano a giocare senza dati pre-esistenti.
- **Architetture Sparse:** Ricerca di reti neurali estremamente efficienti.

---
