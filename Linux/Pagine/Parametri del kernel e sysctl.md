---
date: 2026-07-11
area: Linux
topic: Configurazione kernel runtime
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [linux, kernel, sysctl, procfs, parametri]
aliases: [sysctl, Kernel parameters]
prerequisites: [Processo di boot, Moduli del kernel]
related: [Bootloader GRUB e systemd-boot, Hardening del sistema]
---

# Parametri del kernel e sysctl

## Sintesi

I parametri della command line configurano kernel e componenti nelle prime fasi del boot. `sysctl` legge e modifica variabili runtime esposte principalmente sotto `/proc/sys`. I parametri dei moduli costituiscono un terzo meccanismo con ciclo di vita proprio.

Questi livelli non sono intercambiabili: una chiave sysctl non può essere aggiunta arbitrariamente alla command line, e un parametro necessario prima della root non può essere affidato soltanto a una configurazione caricata dopo il boot.

## Quando usarlo

- Ispezionare configurazione networking, memoria e sicurezza runtime.
- Provare temporaneamente un valore prima di renderlo persistente.
- Configurare parametri necessari al boot.
- Diagnosticare una chiave sconosciuta o non disponibile.
- Applicare file sysctl in modo controllato.

## Come funziona

Una chiave come `net.ipv4.ip_forward` corrisponde normalmente a `/proc/sys/net/ipv4/ip_forward`. Scrivere tramite `sysctl` modifica il kernel corrente e si perde al riavvio.

La persistenza usa file `sysctl.d` letti da strumenti della distribuzione, spesso `systemd-sysctl`. Directory come `/usr/lib/sysctl.d`, `/run/sysctl.d` e `/etc/sysctl.d` hanno precedenze definite; un file amministrativo in `/etc` deve avere nome esplicito.

La command line è visibile in `/proc/cmdline`. Parametri validi dipendono dalla configurazione del kernel e dal componente; alcuni parametri di moduli built-in richiedono il prefisso del modulo.

## API / Sintassi

Leggere una chiave sysctl:

```bash
sysctl net.ipv4.ip_forward
```

Scrivere temporaneamente una chiave:

```bash
sudo sysctl -w net.ipv4.ip_forward=1
```

Leggere direttamente il file corrispondente:

```bash
cat /proc/sys/net/ipv4/ip_forward
```

Mostrare tutte le chiavi accessibili:

```bash
sysctl -a
```

Applicare tutti i file sysctl secondo precedenza:

```bash
sudo sysctl --system
```

Leggere la command line corrente:

```bash
cat /proc/cmdline
```

Mostrare parametri di un modulo caricabile:

```bash
modinfo -p nome_modulo
```

## Esempio pratico

Creare un file amministrativo dedicato, per esempio `/etc/sysctl.d/90-router.conf`:

```sysctl
net.ipv4.ip_forward = 1
```

Applicare la configurazione:

```bash
sudo sysctl --system
```

Verificare il valore:

```bash
sysctl net.ipv4.ip_forward
```

Abilitare forwarding non configura route, NAT o firewall. Prima di rendere persistente una modifica, provarne l'effetto e valutarne l'impatto di sicurezza.

## Varianti

- `sysctl -p file` applica un file specifico.
- Parametri boot come `root=`, `rootwait` e `quiet` vengono gestiti prima dei normali sysctl.
- Parametri module possono essere passati via command line o `modprobe.d` secondo il tipo.
- Alcune chiavi appaiono soltanto quando un modulo o sottosistema è caricato.
- Namespace possono mostrare valori isolati per alcune categorie di sysctl.
- Strumenti di hardening forniscono baseline, ma devono essere adattati al ruolo del sistema.

## Errori comuni

- Copiare grandi liste di tuning senza misurazione o comprensione.
- Scrivere una chiave runtime e credere che sia persistente.
- Rendere persistente un valore prima di provarlo.
- Ignorare errori `cannot stat` dovuti a feature o moduli assenti.
- Confondere command line, sysctl e parametri modprobe.
- Abilitare forwarding senza policy firewall.
- Modificare file forniti dai pacchetti in `/usr/lib/sysctl.d` invece di sovrascriverli in `/etc`.

## Checklist

- Il parametro appartiene a command line, sysctl o modulo?
- La chiave esiste nel kernel corrente?
- Il valore è stato provato temporaneamente?
- Prestazioni e sicurezza sono state misurate?
- Il file persistente ha nome e precedenza corretti?
- `sysctl --system` termina senza errori inattesi?
- Esiste un percorso di rollback se il parametro influenza il boot o la rete?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Bootloader GRUB e systemd-boot|Bootloader GRUB e systemd-boot]]
- [[Linux/Pagine/Moduli del kernel|Moduli del kernel]]
- [[Linux/Pagine/Processo di boot|Processo di boot]]

## Fonti

- [Linux kernel parameters](https://docs.kernel.org/admin-guide/kernel-parameters.html)
- [sysctl(8)](https://man7.org/linux/man-pages/man8/sysctl.8.html)
- [sysctl.d(5)](https://www.freedesktop.org/software/systemd/man/latest/sysctl.d.html)
- [Linux kernel sysctl](https://docs.kernel.org/admin-guide/sysctl/)
