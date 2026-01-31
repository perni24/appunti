## Guida Tecnica di Base

### 1. Definizione
La Neuroevoluzione delle Strategie è un approccio che combina i modelli linguistici moderni (LLM) con gli algoritmi genetici. Invece di modificare i pesi del cervello dell'IA, evolviamo il modo in cui essa "ragiona" tramite istruzioni (prompt) e flussi di lavoro.

### 2. Architettura del Sistema
Il sistema si basa su una popolazione di agenti "congelati" che competono per risolvere un compito.
- **Nucleo:** Modello LLM piccolo (es. Llama 3.2 1B).
- **Genoma:** Il System Prompt + Parametri di generazione (Temperatura, Top-P).
- **Ambiente:** Un compilatore o un set di test automatizzati.

### 3. Workflow di Realizzazione
1. **Inizializzazione:** Creazione di 10 varianti diverse di prompt.
2. **Esecuzione:** Ogni prompt genera una soluzione al problema dato.
3. **Fitness:** Valutazione automatica (es. il codice compila? Supera gli unit test?).
4. **Evoluzione:** I prompt migliori vengono "incrociati" o "mutati" chiedendo a un LLM di generare varianti basate sui vincitori.

### 4. Vantaggi per Risorse Limitate
- **Leggerezza:** Non serve addestrare miliardi di parametri.
- **CPU-Centric:** Il ciclo evolutivo può girare interamente su CPU.
- **Scalabilità:** Puoi far evolvere l'agente su un semplice laptop.

---
