---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: operational-note
status: non revisionato
publish: true
tags:
  - programmazione
  - javascript
  - npm
  - sicurezza
aliases: []
prerequisites: []
related: []
title: Supply chain security npm
---

# Supply chain security npm

## Sintesi

La sicurezza della supply chain riguarda **quale codice esterno entra nel progetto e con quali privilegi viene eseguito**: dipendenze dirette e transitive, strumenti di build, script npm, registry e processo di pubblicazione.

Un lockfile aumenta la ripetibilita; un audit cerca vulnerabilita note; una firma verifica provenienza/integrita secondo il relativo meccanismo. **Nessuno di questi controlli dimostra, da solo, che un pacchetto sia innocuo.**

## Quando usarlo

- Prima di introdurre o aggiornare una dipendenza.
- Durante la revisione di package.json, lockfile e configurazione CI.
- Prima di eseguire strumenti ricevuti tramite npm exec o npx.
- Quando si pubblicano pacchetti o si gestiscono token e registry privati.

| Rischio | Esempio | Prima difesa |
| --- | --- | --- |
| Typosquatting | Nome quasi uguale a quello atteso | Verificare nome e scope dalla fonte ufficiale |
| Dependency confusion | Nome interno risolto dal registry sbagliato | Scope e registry espliciti, revisione delle URL risolte |
| Release compromessa | Account del maintainer o pipeline violati | Revisione degli aggiornamenti e privilegi minimi |
| Codice durante installazione/build | Lifecycle script, plugin o compilatori | Policy degli script, ambiente isolato senza segreti |
| Credenziali rubate | Token di pubblicazione esposto al codice di una PR | Separare CI non fidata e release autorizzate |

Le devDependencies non sono automaticamente poco rischiose: test runner, bundler e plugin lavorano spesso con accesso al repository e all'ambiente CI.

## Prerequisiti e limiti

Procedura verificata il **2026-10-08** con **Node.js 24.14.0 e npm 11.19.0**. Non indica che siano le ultime versioni disponibili. Usa una versione supportata dal progetto e documentala insieme alle opzioni d'installazione.

Controlla separatamente:

```sh
node --version
```

```sh
npm --version
```

I comandi vanno eseguiti nella directory che contiene package.json. Prima di intervenire su un progetto reale, conserva le modifiche correnti e lavora su un branch dedicato. Non usare privilegi amministrativi per compensare errori di permesso npm.

**Nota su npm 12:** cambia il comportamento predefinito degli script di installazione delle dipendenze verso approvazione esplicita tramite allowScripts, oltre ad altri cambiamenti di compatibilita. Non trasferire automaticamente i risultati della demo npm 11 a npm 12; controlla policy, avvisi e changelog della versione adottata. [Changelog npm 12](https://github.com/npm/cli/blob/v12.0.0/CHANGELOG.md).

## Procedura

### 1. Verificare identita e sorgente prima di installare

Parti dal sito/repository ufficiale del progetto, non soltanto dal nome trovato in una ricerca. Verifica scope, maintainer, release, dipendenze e necessita effettiva della libreria. Popolarita, stelle e numero di download non sono garanzie.

Registry predefinito:

```sh
npm config get registry
```

Per un pacchetto scoped puo valere una configurazione diversa. Esempio con scope fittizio da sostituire:

```sh
npm config get @azienda:registry
```

Consulta i metadati di una versione **esatta** prima di eseguirla. Qui nome-pacchetto e 1.2.3 sono segnaposto da sostituire:

```sh
npm view nome-pacchetto@1.2.3 name version repository.url scripts dependencies dist.integrity --json
```

Questa lettura interroga il registry; non installa il pacchetto. I metadati dichiarati dal publisher non sostituiscono il controllo del contenuto distribuito e del sorgente. Un repository collegato non prova che la tarball contenga proprio quel codice. [npm view](https://docs.npmjs.com/cli/v11/commands/npm-view/).

Rivedi anche .npmrc del progetto e gli override di ambiente/utente. Non eseguire npx o npm exec come "ispezione": possono scaricare ed eseguire codice. Una versione fissata riduce la variabilita, non rende fidato il programma. [npm exec](https://docs.npmjs.com/cli/v11/commands/npm-exec/).

### 2. Conservare e rivedere il lockfile

Versiona package.json e package-lock.json insieme per l'applicazione. Il lockfile descrive l'albero risolto, incluse le transitive, e puo contenere URL resolved e digest integrity. Controlla i cambiamenti, non soltanto il numero di righe.

```sh
git diff -- package.json package-lock.json .npmrc
```

Presta attenzione a nuovi script, origini Git/HTTP/file, dipendenze inattese e cambi di versione. Anche un digest corretto puo riferirsi a un pacchetto malevolo; un attaccante che modifica insieme tarball e lockfile non viene fermato dal solo hash.

Il lockfile di una libreria non impone automaticamente le stesse transitive a chi la installa come dipendenza. Inoltre stesso lockfile non significa build bit-per-bit identica su ogni OS/CPU, versione Node/npm o toolchain. [package-lock.json](https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json/).

Per installare l'albero approvato senza lifecycle script:

```sh
npm ci --ignore-scripts --no-audit --no-fund
```

**Effetto distruttivo locale:** ci rimuove il node_modules esistente prima di reinstallare. Richiede un lockfile coerente con package.json; in caso di disallineamento fallisce invece di aggiornarlo. Non e il comando per aggiungere una nuova dipendenza. Le opzioni che influenzano l'albero, per esempio legacy-peer-deps o install-links, devono essere coerenti con quelle usate per generare il lockfile.

`--no-audit` rinvia il controllo di vulnerabilita a uno step esplicito; non elimina le normali richieste necessarie a scaricare i pacchetti. `--no-fund` riduce soltanto l'output. [npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci/).

### 3. Decidere quali script possono essere eseguiti

In npm 11 gli script di installazione possono eseguire codice del progetto e delle dipendenze. `--ignore-scripts` ne sopprime l'esecuzione, ma **non e una sandbox** e non rende sicuri import, build o test successivi.

Se richiedi esplicitamente uno script, quello viene comunque eseguito; con ignore-scripts vengono saltati i relativi pre/post hook:

```sh
npm run build --ignore-scripts
```

Questo vale soltanto se il progetto definisce build. Il suo contenuto puo eseguire plugin, leggere segreti o lanciare altri processi: leggilo prima. La dimostrazione nella sezione Snippet rende visibile la differenza.

Pacchetti nativi o che scaricano binari possono risultare incompleti senza install script. Non riabilitare tutto automaticamente: verifica la necessita, il codice e la policy supportata dal package manager. Le opzioni allowScripts/strict-allow-scripts dipendono dalla versione; adottale come configurazione revisionata, non come elenco approvato alla cieca. [Lifecycle npm 11.19](https://github.com/npm/cli/blob/v11.19.0/docs/lib/content/using-npm/scripts.md).

### 4. Distinguere albero, aggiornamenti e vulnerabilita

Vedere l'albero installato, senza aggiornarlo:

```sh
npm ls --all
```

Capire perche un pacchetto e presente; sostituisci il nome con quello da indagare:

```sh
npm explain nome-pacchetto
```

Confrontare versioni installate, wanted compatibili con gli intervalli dichiarati e latest indicate dal registry:

```sh
npm outdated
```

Outdated non e un bollettino di sicurezza e latest non significa "aggiornamento compatibile". [npm outdated](https://docs.npmjs.com/cli/v11/commands/npm-outdated/).

Cercare vulnerabilita note senza applicare correzioni:

```sh
npm audit
```

In CI puoi scegliere una soglia di fallimento:

```sh
npm audit --audit-level=high
```

La soglia cambia l'exit code, **non filtra via** le segnalazioni meno gravi dal report. Un errore di rete o del registry non equivale a "nessuna vulnerabilita". Un risultato pulito non rileva necessariamente malware, zero-day o ogni percorso sfruttabile.

L'audit invia metadati delle dipendenze al registry configurato: normalmente nomi/versioni, con un eventuale fallback piu dettagliato. Valuta la policy aziendale per nomi di pacchetti privati; non e una scansione interamente locale. [npm audit](https://docs.npmjs.com/cli/v11/commands/npm-audit/).

Dopo l'installazione, con un registry compatibile, verifica firme e attestazioni disponibili:

```sh
npm audit signatures
```

E un controllo distinto dagli advisory. Una firma valida non equivale a codice sicuro; una provenance collega l'artefatto a sorgente e processo di build, non ne certifica la correttezza. Non tutti i pacchetti o tipi di sorgente hanno la stessa copertura: leggi anche omissioni, errori e riepilogo. [Provenance npm](https://docs.npmjs.com/generating-provenance-statements/).

### 5. Correggere con una modifica verificabile

1. Identifica il pacchetto e la catena che lo introduce.
2. Leggi advisory, versione corretta e changelog; valuta runtime, build e strumenti di sviluppo.
3. Aggiorna il componente diretto responsabile o applica una mitigazione documentata.
4. Rivedi manifest e lockfile; ricrea l'installazione e riesegui test/build.
5. Registra eventuali eccezioni con motivo, responsabile e scadenza.

Non usare `npm audit fix --force` come prima risposta: fix esegue un'installazione e puo cambiare l'albero; force puo introdurre aggiornamenti fuori dagli intervalli dichiarati, anche incompatibili. Un override transitivo va collaudato: non garantisce compatibilita con chi lo consuma.

Dependabot puo aprire proposte, non approvarle al posto tuo. Evita anche il blocco indefinito degli aggiornamenti: lasciare una versione vulnerabile congelata non e una strategia di sicurezza.

## Snippet

### Prova locale di ignore-scripts

Crea una directory dimostrativa vuota, separata dal progetto e senza credenziali. Inserisci questo package.json completo: non scarica dipendenze e gli script stampano soltanto messaggi.

```json
{
  "name": "npm-scripts-demo",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "postinstall": "node -e \"console.log('INSTALL')\"",
    "prebuild": "node -e \"console.log('PRE')\"",
    "build": "node -e \"console.log('BUILD')\"",
    "postbuild": "node -e \"console.log('POST')\""
  }
}
```

Genera soltanto il lockfile, disabilitando script e audit automatico:

```sh
npm install --package-lock-only --ignore-scripts --no-audit --no-fund
```

Applica il comando ci della procedura: non deve comparire il messaggio INSTALL. Poi esegui `npm run build --ignore-scripts`: deve stampare BUILD, non PRE o POST. Senza ignore-scripts:

```sh
npm run build
```

In questa demo stampa PRE, BUILD e POST in sequenza. Il test dimostra la differenza tra lifecycle automatico e comando esplicito, non l'isolamento da codice malevolo. La stessa distinzione vale per un build che esegue migliaia di righe di dipendenze.

### Controllare i file destinati alla pubblicazione

Per il proprio pacchetto, dopo avere revisionato e prodotto gli artefatti necessari:

```sh
npm pack --dry-run --ignore-scripts --json
```

Mostra i file che npm includerebbe, senza produrre la tarball. Non pubblica nulla. ignore-scripts evita gli hook di packaging: se la build normalmente avviene in prepare, l'elenco puo essere incompleto finche non la esegui esplicitamente.

Controlla files, .npmignore, file generati e assenza di segreti; .gitignore da solo non e una garanzia per il pacchetto distribuito. [npm pack](https://docs.npmjs.com/cli/v11/commands/npm-pack/).

## Adattamenti comuni

### Registry privati

Esempio di .npmrc, da adattare al registry reale. Non incollare il token nel file:

```ini
@azienda:registry=https://registry.example.com/
//registry.example.com/:_authToken=${NPM_TOKEN}
```

La credenziale e limitata all'host indicato; se il registry usa un percorso, configura anche quel percorso correttamente. NPM_TOKEN arriva dall'ambiente protetto, non dal repository. Il mapping dello scope non protegge nomi interni non scoped: rivedi anche la risoluzione effettuata dal proxy/registry. Non disabilitare TLS per superare un errore. [Configurazione npmrc](https://docs.npmjs.com/cli/v11/configuring-npm/npmrc/).

### CI e pubblicazione

Esegui codice di PR non fidate in job senza segreti e con permessi minimi; non combinare checkout di codice esterno con un contesto privilegiato come pull_request_target. Rivedi script, action e cache come parti della supply chain; per le action di terze parti usa commit SHA completi verificati. Separa test e pubblicazione, proteggi branch/tag e richiedi approvazioni quando necessario. [Sicurezza GitHub Actions](https://docs.github.com/en/actions/reference/security/secure-use).

Per pubblicare su npm, preferisci trusted publishing OIDC dove supportato. La configurazione deve corrispondere al repository/workflow autorizzato; in GitHub Actions serve id-token: write nel job appropriato. OIDC riduce i token persistenti, ma non rende affidabile un workflow compromesso. Non sostituisce le credenziali di lettura eventualmente necessarie per installare dipendenze private.

La provenance automatica ha requisiti specifici di provider e visibilita: non darla per presente in ogni pubblicazione. Verifica le condizioni correnti nella [guida trusted publishing](https://docs.npmjs.com/trusted-publishers/). Dove servono token, usa credenziali granulari, scadenza e permessi minimi; proteggi l'account con 2FA. Per la sola installazione privata basta il permesso di lettura, non quello di pubblicazione.

### Dipendenze di produzione

`--omit=dev` evita l'installazione fisica delle devDependencies, ma non le elimina dal lockfile e non dimostra che la build sia stata sicura. Una build frontend spesso richiede strumenti di sviluppo prima di produrre gli asset finali. Non usare un audit limitato alla produzione come unico controllo dell'intera pipeline.

## Debug rapido

| Sintomo | Controllo |
| --- | --- |
| ci fallisce per lockfile incoerente | Allineare manifest/lock in una modifica revisionata; non cancellare il lock per nascondere il problema |
| Manca un binario dopo installazione | Verificare se dipende da uno script saltato e dalla piattaforma |
| Audit esce con codice non zero | Distinguere vulnerabilita, soglia, autenticazione e indisponibilita del registry |
| Un pacchetto compare piu volte | Usare npm explain: possono servire versioni diverse a consumatori diversi |
| Il registry risulta inatteso | Controllare scope, .npmrc, variabili ambiente e URL nel lockfile |
| Sospetto di pacchetto compromesso | Fermare pipeline/esecuzione, conservare evidenze, revocare credenziali esposte da un ambiente fidato e ricostruire da sorgenti verificate |

Se codice sospetto e gia stato eseguito, disinstallare il pacchetto non annulla eventuali effetti o furti di credenziali.

## Checklist finale

- Nome, scope, versione e registry verificati.
- Dipendenza necessaria; albero e modifiche al lockfile compresi.
- Versione Node/npm e policy degli script dichiarate.
- Installazione/test/build con soli privilegi necessari.
- Advisory valutati, non soltanto conteggiati.
- Firme/provenance interpretate nei loro limiti.
- Token, OIDC, action e processo di release protetti.
- Comandi e test rieseguiti dopo l'aggiornamento.
- Nessun segreto incluso nei file da pubblicare.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Node.js Basics|Node.js Basics]]
- [[Programmazione/JavaScript/Pagine/Sicurezza|Sicurezza]]
- [[Programmazione/JavaScript/Pagine/ESLint|ESLint]]
- [[Programmazione/GitHub/Pagine/Dependabot|Dependabot]]
- [[Programmazione/GitHub/Pagine/OIDC GitHub Actions|OIDC GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Permissions GitHub Actions|Permissions GitHub Actions]]

## Fonti

- [npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci/) e [lockfile](https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json/).
- [npm audit](https://docs.npmjs.com/cli/v11/commands/npm-audit/) e [npm explain](https://docs.npmjs.com/cli/v11/commands/npm-explain/).
- [Lifecycle nella versione 11.19.0](https://github.com/npm/cli/blob/v11.19.0/docs/lib/content/using-npm/scripts.md).
- [Changelog npm 12.0.0](https://github.com/npm/cli/blob/v12.0.0/CHANGELOG.md): differenze di comportamento, non collaudate dalla demo npm 11.
- [Token npm](https://docs.npmjs.com/about-access-tokens/), [trusted publishing](https://docs.npmjs.com/trusted-publishers/) e [provenance](https://docs.npmjs.com/generating-provenance-statements/).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
