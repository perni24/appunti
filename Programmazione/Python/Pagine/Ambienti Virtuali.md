---
date: 2026-04-14
tags:
  - programmazione
  - python
  - packaging
  - ambiente
type: #permanent-note
status: budding
---

# Ambienti Virtuali in Python

## 💡 Concetto Chiave
Un **ambiente virtuale** e un ambiente Python isolato che contiene un proprio interprete, i propri pacchetti installati e i propri script eseguibili. Serve a separare le dipendenze tra progetti diversi ed evitare conflitti di versione.

Senza ambienti virtuali, installare pacchetti globalmente porta rapidamente a problemi: progetti diversi richiedono versioni diverse della stessa libreria, e l'interprete di sistema finisce per diventare instabile o difficile da gestire.

> [!INFO] Obiettivo pratico
> Un progetto Python dovrebbe quasi sempre avere un ambiente virtuale dedicato. Questo rende installazioni, aggiornamenti, test e deploy molto piu prevedibili.

---

## 📝 Sintassi di base con `venv`

Il modulo standard piu comune per creare ambienti virtuali e `venv`, incluso nella Standard Library.

### Creazione dell'ambiente

```bash
python -m venv .venv
```

Questo comando crea una cartella `.venv` con:
- interprete Python isolato;
- script di attivazione;
- spazio dedicato per i pacchetti installati con `pip`.

### Attivazione su Windows

```bash
.venv\Scripts\activate
```

### Attivazione su macOS/Linux

```bash
source .venv/bin/activate
```

### Disattivazione

```bash
deactivate
```

---

## 💻 Esempi Pratici

### Creare un ambiente e installare dipendenze

```bash
python -m venv .venv
.venv\Scripts\activate
python -m pip install requests
```

Da questo momento, `requests` viene installato dentro l'ambiente virtuale del progetto e non nell'interprete globale.

### Salvare e ripristinare le dipendenze

```bash
python -m pip freeze > requirements.txt
python -m pip install -r requirements.txt
```

Questo permette di ricreare lo stesso ambiente su un'altra macchina o in CI.

### Verificare quale interprete stai usando

```bash
python --version
python -m pip --version
```

Questo controllo e utile quando sospetti di stare installando i pacchetti nell'ambiente sbagliato.

---

## ⚙️ Funzionamento Interno (Teoria)

### Cosa isola davvero un ambiente virtuale
Un virtual environment isola soprattutto:
- pacchetti installati;
- script CLI dei pacchetti;
- path dell'interprete Python usato dal progetto.

Non isola invece:
- il sistema operativo;
- le variabili d'ambiente di per se;
- i file del progetto;
- risorse esterne come database o servizi.

### Relazione con `pip`
Quando un ambiente virtuale e attivo, `python` e `pip` puntano alla copia locale dentro `.venv`. Quindi:

```bash
python -m pip install fastapi
```

installa `fastapi` nell'ambiente corrente, non nel Python di sistema.

Questo collega direttamente gli ambienti virtuali a [[Pip e PyPI]].

### Perche `python -m pip` e preferibile
In macchine con piu installazioni Python, il comando `pip` da solo puo puntare all'interprete sbagliato. `python -m pip` evita questa ambiguita, perche usa esplicitamente il `python` attivo.

---

## 🧠 Workflow tipico di progetto

Per un progetto Python standard, il flusso corretto e in genere questo:

1. creare l'ambiente virtuale;
2. attivarlo;
3. installare le dipendenze;
4. lavorare sempre con quell'interprete;
5. salvare le dipendenze in un file;
6. non committare l'ambiente virtuale nel repository.

Esempio:

```bash
python -m venv .venv
.venv\Scripts\activate
python -m pip install fastapi uvicorn
python -m pip freeze > requirements.txt
```

Conviene anche aggiungere `.venv/` o `.venv` al `.gitignore`.

---

## 📦 `venv` vs installazione globale

### Installazione globale
- tutti i progetti condividono lo stesso interprete;
- rischio elevato di conflitti;
- manutenzione piu fragile;
- sconsigliata per sviluppo normale.

### Ambiente virtuale
- isolamento per progetto;
- dipendenze piu controllate;
- setup piu riproducibile;
- minore rischio di rompere altri progetti.

> [!TIP] Regola pratica
> L'installazione globale ha senso solo per casi molto specifici, come tool di sistema o ambienti volutamente centralizzati. Per lo sviluppo ordinario, usa un ambiente virtuale per ogni progetto.

---

## ⚠️ Best Practices & "Gotchas"

- ✅ **Crea un ambiente virtuale per ogni progetto:** evita conflitti tra dipendenze.
- ✅ **Usa nomi convenzionali come `.venv`:** semplifica editor, tooling e `.gitignore`.
- ✅ **Usa sempre `python -m pip`:** riduce errori di interpreter mismatch.
- ✅ **Verifica l'ambiente attivo prima di installare pacchetti:** evita installazioni nel posto sbagliato.
- ✅ **Versiona `requirements.txt` o il file di dipendenze del progetto:** l'ambiente si ricrea, non si committa.
- ❌ **Non committare `.venv` nel repository:** appesantisce il repo e rompe la portabilita.
- ❌ **Non mescolare pacchetti globali e locali senza motivo:** complica debug e manutenzione.
- 💣 **Attenzione ai terminali multipli:** potresti avere shell con ambienti diversi attivi contemporaneamente.
- 💣 **Attenzione ai path hardcoded:** spostare il progetto o l'ambiente puo rompere script che assumono percorsi fissi.

---
