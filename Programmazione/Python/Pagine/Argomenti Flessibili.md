---
date: 2026-03-19
tags:
  - programmazione
  - python
  - teoria
type: #permanent-note
status: in_elaborazione
---

# Argomenti Flessibili (*args e **kwargs)

## 💡 Concetto Chiave
Python permette di definire funzioni che accettano un numero variabile di argomenti. Questo è estremamente utile quando non si sa in anticipo quanti dati verranno passati alla funzione.
- `*args`: Raccoglie gli argomenti posizionali extra in una **tupla**.
- `**kwargs`: Raccoglie gli argomenti nominali (keyword arguments) extra in un **dizionario**.

---

## 📝 Sintassi

```python
def funzione_flessibile(*args, **kwargs):
    print(f"Args (tupla): {args}")
    print(f"Kwargs (dizionario): {kwargs}")

funzione_flessibile(1, 2, nome="Luca", età=25)
# Output:
# Args (tupla): (1, 2)
# Kwargs (dizionario): {'nome': 'Luca', 'età': 25}
```

### Ordine dei Parametri
L'ordine dei parametri in una funzione deve seguire questa gerarchia:
1. Parametri standard (posizionali)
2. `*args`
3. Parametri con valore di default
4. `**kwargs`

---

## 💻 Esempi Pratici

### Somma di N numeri (*args)
```python
def somma_tutto(*numeri):
    return sum(numeri)

print(somma_tutto(10, 20, 30, 40)) # Output: 100
```

### Configurazione Dinamica (**kwargs)
```python
def crea_profilo(nome, cognome, **info_extra):
    profilo = {"nome": nome, "cognome": cognome}
    profilo.update(info_extra)
    return profilo

utente = crea_profilo("Mario", "Rossi", città="Roma", professione="Sviluppatore")
```

### Unpacking (Scompattamento)
È possibile usare `*` e `**` anche durante la *chiamata* di una funzione per passare elementi di una lista o un dizionario come argomenti separati.

```python
numeri = [1, 5, 10]
def moltiplica(a, b, c):
    return a * b * c

print(moltiplica(*numeri)) # Scompatta la lista in 3 argomenti
```

---

## ⚙️ Funzionamento Interno (Teoria)
- **Impacchettamento:** Quando Python vede `*` o `**` nella firma della funzione, intercetta gli argomenti rimanenti e li inserisce in una nuova struttura dati (Tupla per `*`, Dizionario per `**`).
- **Flessibilità:** Permette di creare API molto potenti (come quelle dei framework web o librerie di data science) che possono accettare decine di parametri opzionali senza doverli definire tutti esplicitamente.

---

## ⚠️ Best Practices & "Gotchas"
- ✅ **Convenzione:** Usa sempre i nomi `args` e `kwargs`. Sebbene qualsiasi nome funzioni (es. `*numeri`), `args` e `kwargs` sono lo standard de facto.
- ❌ **Abuso:** Non usare `*args` o `**kwargs` se conosci esattamente quali parametri la funzione deve ricevere. Rendono il codice meno esplicito e più difficile da documentare.
- 💣 **Keyword-only arguments:** Puoi usare `*` da solo per forzare l'utente a passare tutti i parametri successivi come keyword arguments: `def f(a, *, b):` (qui `b` deve essere specificato per nome).

---