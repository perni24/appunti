---
date: 2026-07-11
area: Linux
topic: GNU Privacy Guard
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [linux, sicurezza, gpg, openpgp, firme]
aliases: [GnuPG, OpenPGP con GPG]
prerequisites: [Principio del minimo privilegio]
related: [Aggiornamenti di sicurezza, Crittografia con LUKS]
---

# GPG

## Sintesi

GnuPG implementa OpenPGP per firme digitali, cifratura e gestione di chiavi. Una firma verifica integrità e controllo della chiave privata associata; la cifratura protegge il contenuto per i destinatari selezionati. Nessuna delle due proprietà identifica una persona senza verifica affidabile del fingerprint e del contesto.

La chiave privata e la procedura di revoca sono asset critici. Perdita della chiave impedisce decifratura; compromissione richiede revoca e distribuzione dell'informazione.

## Quando usarlo

- Verificare release e checksum firmati.
- Firmare file o messaggi.
- Cifrare dati per uno o più destinatari.
- Gestire identità OpenPGP e subkey.
- Esportare chiavi pubbliche senza distribuire materiale privato.

## Come funziona

Una primary key certifica identità e subkey. Subkey separate possono firmare, cifrare o autenticare e semplificano rotazione e protezione della primary key.

Il fingerprint completo identifica una chiave meglio del key ID breve. Il trust owner valuta quanto ci si fida del proprietario nel certificare altre chiavi; la validità indica invece quanto il software considera verificata l'associazione tra chiave e user ID. Sono concetti distinti.

`gpg-agent` gestisce operazioni con chiavi private e cache della passphrase. Una passphrase protegge la copia della private key, ma un host compromesso può intercettare uso e dati in chiaro.

## API / Sintassi

Generare una chiave tramite procedura interattiva:

```bash
gpg --full-generate-key
```

Elencare chiavi pubbliche con fingerprint:

```bash
gpg --list-keys --fingerprint
```

Elencare chiavi private disponibili:

```bash
gpg --list-secret-keys --keyid-format long
```

Esportare una chiave pubblica ASCII:

```bash
gpg --armor --export FINGERPRINT
```

Importare una chiave pubblica:

```bash
gpg --import chiave-pubblica.asc
```

Creare una firma detached ASCII:

```bash
gpg --armor --detach-sign archivio.tar.xz
```

Verificare firma e file:

```bash
gpg --verify archivio.tar.xz.asc archivio.tar.xz
```

Cifrare per un destinatario verificato:

```bash
gpg --encrypt --recipient FINGERPRINT documento.txt
```

## Esempio pratico

Importare la chiave del maintainer:

```bash
gpg --import maintainer.asc
```

Mostrare il fingerprint completo:

```bash
gpg --fingerprint FINGERPRINT
```

Confrontarlo tramite un canale indipendente, quindi verificare la release:

```bash
gpg --verify progetto.tar.xz.asc progetto.tar.xz
```

Una firma “good” indica coerenza crittografica con quella chiave; la decisione di fidarsi dipende dalla verifica del fingerprint e dalla provenienza attesa.

## Varianti

- Firma clearsign mantiene testo leggibile con firma incorporata.
- Cifratura simmetrica usa una passphrase senza chiavi pubbliche, con distribuzione del segreto separata.
- Smart card e token hardware limitano l'esportazione delle subkey private.
- WKD distribuisce chiavi per domini che lo supportano.
- SSH può usare chiavi OpenPGP tramite agenti, ma aumenta complessità operativa.
- `gpgv` verifica firme con un keyring controllato ed è adatto a flussi automatizzati specifici.

## Errori comuni

- Fidarsi di una chiave soltanto perché scaricata dallo stesso sito del file.
- Verificare una firma senza confrontare il fingerprint.
- Pubblicare o copiare una private key invece della pubblica.
- Non creare e conservare un certificato di revoca.
- Usare key ID breve soggetto a collisioni e ambiguità.
- Cifrare senza includere la propria chiave quando serve poter rileggere il file.
- Considerare la cifratura una cancellazione sicura delle copie in chiaro.

## Checklist

- Il fingerprint completo è stato verificato tramite un canale indipendente?
- Primary key, subkey e capacità hanno ruoli appropriati?
- Private key e passphrase sono protette e sottoposte a backup sicuro?
- Esiste un certificato di revoca conservato offline?
- Scadenza e rotazione sono pianificate?
- Firma valida e fiducia nell'identità sono state distinte?
- I destinatari della cifratura includono tutte le chiavi necessarie?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Crittografia con LUKS|Crittografia con LUKS]]
- [[Linux/Pagine/Aggiornamenti di sicurezza|Aggiornamenti di sicurezza]]
- [[Linux/Pagine/Principio del minimo privilegio|Principio del minimo privilegio]]

## Fonti

- [GnuPG Manual](https://www.gnupg.org/documentation/manuals/gnupg/)
- [GnuPG documentation](https://www.gnupg.org/documentation/)
- [OpenPGP](https://www.openpgp.org/)
