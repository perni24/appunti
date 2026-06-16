---
date: 2026-06-16
area: Programmi open source
topic: Sintesi vocale text-to-speech
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [open-source, ai, text-to-speech, audio, python]
aliases: [Kokoro, Kokoro-82M]
prerequisites: []
related: []
---

# Kokoro

## Sintesi

**Kokoro** e un modello/pacchetto open-weight per sintesi vocale text-to-speech. Il progetto principale e legato a **Kokoro-82M**, un modello TTS leggero da 82 milioni di parametri.

Serve per generare audio parlato partendo da testo, con un approccio piu leggero rispetto a modelli vocali molto grandi.

## Quando usarlo

- Generare voce sintetica da testo.
- Prototipare funzioni TTS in script Python.
- Creare demo vocali o workflow audio locali.
- Valutare un modello TTS leggero per progetti personali o sperimentali.
- Integrare sintesi vocale in strumenti AI o automazioni.

## Come funziona

Il pacchetto `kokoro` fornisce una pipeline di inferenza per trasformare testo in audio. L'utente configura lingua/voce, passa il testo alla pipeline e ottiene segmenti audio che possono essere riprodotti o salvati su file.

Per alcune lingue o fallback puo servire supporto aggiuntivo di librerie di fonemizzazione/G2P e dipendenze audio.

## Esempio d'uso

```python
from kokoro import KPipeline
import soundfile as sf

pipeline = KPipeline(lang_code="a")
generator = pipeline("Testo da sintetizzare.", voice="af_heart")

for i, (_, _, audio) in enumerate(generator):
    sf.write(f"output-{i}.wav", audio, 24000)
```

## Punti forti

- **Leggero**: modello da 82 milioni di parametri.
- **Orientato all'inferenza**: pensato per generare audio da testo.
- **Usabile da Python**: adatto a script e prototipi.
- **Open-weight**: i pesi sono pubblici e riutilizzabili secondo la licenza indicata dal progetto.

## Limiti

- La qualita varia in base a lingua, voce e testo.
- Richiede dipendenze audio e ambiente Python configurato correttamente.
- Non sostituisce sistemi TTS enterprise per casi con requisiti severi.
- Va verificata la licenza dei pesi e delle dipendenze prima dell'uso commerciale.

## Checklist

- Verificare lingua e voce supportate.
- Installare dipendenze audio richieste.
- Salvare output in un formato adatto al progetto.
- Testare pronuncia, accenti e testi lunghi.
- Controllare licenza di codice, pesi e voci prima della distribuzione.

## Collegamenti

- https://github.com/hexgrad/kokoro
