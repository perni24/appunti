**1. Creazione e attivazione dell'ambiente virtuale**

- Creare l'ambiente virtuale:

```bash
# da eseguire all'interno della cartella del progetto

#linux
python3 -m venv venv

#windows
python -m venv venv
```

Attivare l'ambiente virtuale:

```bash
# Linux/MacOS
source venv/bin/activate

# Windows cmd no powershell
venv\Scripts\activate
```

Quando attivato correttamente, vedrai il prefisso "(venv)" nel terminale.

**2. Gestione delle dipendenze**

- Per creare il file delle dipendenze (da eseguire dopo ogni nuova installazione):

```bash
pip freeze > requirements.txt
```

- Per installare le dipendenze in un altro ambiente:

```bash
pip install -r requirements.txt
```

**3. Operazioni comuni**

- Eseguire il programma: una volta attivato l'ambiente virtuale, puoi usare i comandi Python normalmente.
- Disattivare l'ambiente virtuale quando hai finito:

```bash
deactivate
```