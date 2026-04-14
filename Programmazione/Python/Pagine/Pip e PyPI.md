---
date: 2026-04-14
tags:
  - programmazione
  - python
  - packaging
  - dipendenze
type: #permanent-note
status: budding
---

# Pip e PyPI

## 💡 Concetto Chiave
`pip` e il package manager standard piu usato nell'ecosistema Python. Serve per installare, aggiornare e rimuovere pacchetti.

**PyPI** (*Python Package Index*) e invece il repository pubblico principale dove i pacchetti Python vengono pubblicati e distribuiti.

In sintesi:
- **PyPI** = il catalogo dei pacchetti;
- **pip** = lo strumento che scarica e installa quei pacchetti.

> [!INFO] Distinzione essenziale
> Molti confondono `pip` con PyPI, ma non sono la stessa cosa. `pip` e il client; PyPI e il registry remoto da cui il client recupera i pacchetti.

---

## 📝 Sintassi di base

I comandi piu comuni sono:

```bash
python -m pip install requests
python -m pip uninstall requests
python -m pip list
python -m pip show requests
```

Usare `python -m pip` e in genere preferibile a `pip` puro, perche rende esplicito quale interprete Python sta eseguendo il comando.

### Aggiornare `pip`

```bash
python -m pip install --upgrade pip
```

### Installare una versione specifica

```bash
python -m pip install requests==2.32.0
```

### Installare con vincoli di versione

```bash
python -m pip install "django>=5.0,<6.0"
```

---

## 💻 Esempi Pratici

### Installare una libreria

```bash
python -m pip install httpx
```

Dopo l'installazione, il pacchetto puo essere importato nel codice:

```python
import httpx

response = httpx.get("https://example.com")
print(response.status_code)
```

### Salvare le dipendenze in un file

```bash
python -m pip freeze > requirements.txt
```

Questo produce un file con i pacchetti installati e le versioni correnti.

### Reinstallare le dipendenze da file

```bash
python -m pip install -r requirements.txt
```

Questo workflow e fondamentale per rendere un progetto replicabile su altre macchine o ambienti.

---

## ⚙️ Funzionamento Interno (Teoria)

### Cosa fa `pip`
Quando esegui `pip install`, lo strumento:

1. risolve le dipendenze richieste;
2. scarica i pacchetti dal registry configurato, spesso PyPI;
3. installa wheel o esegue build da sorgente se necessario;
4. registra il pacchetto nell'ambiente Python attivo.

### Pacchetti, distribuzioni e import
Un punto importante: il nome del pacchetto installato e il nome del modulo importato non coincidono sempre.

Esempio classico:

```bash
python -m pip install beautifulsoup4
```

```python
from bs4 import BeautifulSoup
```

Quindi:
- **nome su PyPI** = nome della distribuzione;
- **nome nel codice** = nome del package/modulo importabile.

### Dove viene installato un pacchetto
La destinazione dipende dall'ambiente attivo:
- interprete di sistema;
- virtual environment;
- ambiente del progetto;
- installazione utente (`--user`).

Per questo `pip` e strettamente collegato alla gestione degli ambienti Python.

---

## 🧠 Versionamento e dipendenze

Gestire correttamente le versioni e una parte centrale dell'uso di `pip`.

### Forme comuni
- `package==1.2.3`: versione esatta;
- `package>=1.2`: versione minima;
- `package<2.0`: limite superiore;
- `package>=1.2,<2.0`: range controllato.

### Perche fissare le versioni
Bloccare le versioni aiuta a:
- rendere riproducibili build e deploy;
- evitare regressioni dovute ad aggiornamenti involontari;
- allineare sviluppo, CI e produzione.

> [!TIP] Regola pratica
> Per librerie applicative e progetti condivisi, evitare versioni completamente libere e in genere una scelta migliore.

---

## 📦 `requirements.txt` e workflow tipico

Un flusso comune in molti progetti Python e questo:

1. creare o attivare un ambiente virtuale;
2. installare i pacchetti con `pip`;
3. salvare le dipendenze in `requirements.txt`;
4. reinstallarle con `pip install -r requirements.txt` negli altri ambienti.

Esempio:

```bash
python -m venv .venv
.venv\Scripts\activate
python -m pip install fastapi uvicorn
python -m pip freeze > requirements.txt
```

Questa nota si collega naturalmente al tema degli ambienti virtuali.

---

## 🔒 Sicurezza e affidabilita

Installare un pacchetto significa eseguire codice distribuito da terzi. Quindi:
- bisogna controllare l'affidabilita del pacchetto;
- conviene evitare dipendenze inutili;
- non e prudente installare pacchetti sconosciuti senza verificarne provenienza, manutenzione e reputazione.

### Rischi tipici
- typo-squatting: pacchetti con nomi simili a quelli reali;
- dipendenze malevole o abbandonate;
- aggiornamenti breaking non previsti;
- conflitti di dipendenze.

---

## ⚠️ Best Practices & "Gotchas"

- ✅ **Usa `python -m pip`:** evita ambiguita tra piu interpreti Python installati.
- ✅ **Lavora dentro ambienti virtuali:** riduce conflitti tra progetti.
- ✅ **Blocca le versioni quando serve riproducibilita:** soprattutto in produzione e CI.
- ✅ **Controlla il nome reale del package importabile:** installazione e import non coincidono sempre.
- ✅ **Aggiorna `pip` periodicamente:** migliora compatibilita e supporto ai formati moderni.
- ❌ **Non installare tutto nell'interprete globale di sistema:** aumenta conflitti e rende difficile la manutenzione.
- ❌ **Non usare `pip freeze` come unica strategia di design delle dipendenze:** e utile per snapshot, ma puo produrre file troppo rigidi o rumorosi.
- 💣 **Attenzione ai conflitti di versione:** due librerie possono richiedere dipendenze incompatibili.
- 💣 **Attenzione ai package name shadowing:** creare file locali come `requests.py` o `fastapi.py` puo rompere gli import.

---
