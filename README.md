# Appunti

Base di conoscenza in italiano per programmazione, stampa 3D e software open source. I file Markdown sono la fonte unica: si consultano nel vault Obsidian oppure si pubblicano con Quartz su GitHub Pages.

## Da Dove Partire

- [Home del vault](Home.md)
- [Programmazione](Programmazione/Indice%20Programmazione.md)
- [Stampante 3D](Stampante%203D/Indice%20Stampante%203D.md)
- [Programmi open source](Programmi%20open%20source/Indice%20Programmi%20Open%20Source.md)

I collegamenti interni degli appunti usano la sintassi Obsidian `[[percorso|titolo]]`. I percorsi sono completi per distinguere note omonime di linguaggi diversi. Un normale visualizzatore Markdown mostra il testo, ma potrebbe non rendere cliccabili i wikilink.

## Organizzazione

```text
Home.md
Programmazione/
  Indice Programmazione.md
  JavaScript/                 # stesso schema per gli altri linguaggi
    Indice JavaScript.md
    Pagine/                  # concetti, API e spiegazioni
    Promemoria/              # sintassi e snippet con rimandi alla teoria
  PostgreSQL/
  GitHub/
  Clean Code/
  Strutture di Progetto/     # architetture iniziali spiegate
  Promemoria/                # solo indice trasversale
Stampante 3D/
  Indice Stampante 3D.md
  Pagine/                    # fondamenti FDM
  Marlin/                    # guida fissata alla release 2.1.2.8
Programmi open source/
  Indice Programmi Open Source.md
  Pagine/                    # schede per utilizzo, limiti e riferimenti
_Template/                   # basi per nuove note
_Meta/                       # storico e controlli del vault
Raw/                         # inbox, esclusa dal sito
site/                        # subtree Quartz e script di pubblicazione
```

Gli indici ordinano le conoscenze per percorso o attivita. Le note teoriche spiegano il funzionamento; i promemoria restano brevi. Le schede software aiutano a capire quando uno strumento e pertinente, senza duplicare la sua documentazione.

Le altre aree tematiche sono state rimosse dalla versione corrente su richiesta. I contenuti gia committati restano recuperabili dalla cronologia Git, che non e stata riscritta.

## Modificare gli Appunti

Segui [AGENTS.md](AGENTS.md) e scegli un template in `_Template/`. Mantieni un solo titolo H1, una sintesi iniziale e collegamenti all'indice e alle note utili. Non lasciare sezioni vuote o esempi dichiarati completi quando richiedono altri file non forniti.

Ogni nota di contenuto ha metadati YAML. Il titolo YAML corrisponde all'H1; `status: non revisionato` indica che la nota attende il controllo dell'utente. Gli indici e `Home.md` non richiedono YAML.

Per spostare una nota, aggiorna i wikilink e la mappa `site/redirects.json`, che conserva i vecchi indirizzi del sito. Non modificare gli HTML generati.

## Pubblicazione

`site/publish.config.json` limita il sito alle tre aree. Le note con `publish: true` vengono incluse; `publish: false` o `draft: true` le escludono. Home e indici vengono inclusi automaticamente. Tutte le note attualmente mantenute sono pubblicabili.

Lo script prepara una copia temporanea, trasforma gli indici nelle pagine iniziali delle cartelle e adatta i link senza alterare i sorgenti. `Raw`, `_Meta`, `_Template` e le configurazioni non vengono pubblicati. Non conservare allegati privati nelle aree pubblicabili.

Gli HTML finiscono in `site/public/`, esclusa da Git. Anche `node_modules` e le cache restano locali. Il codice di Quartz, invece, fa parte del repository tramite subtree: conserva le licenze e non trattarlo come output eliminabile.

## Verifica Locale

Con Node.js 24 e npm installati, prepara le dipendenze dalla radice del repository:

```powershell
npm --prefix site ci
```

```powershell
npm --prefix site run install-plugins
```

Controlla la struttura e i test della trasformazione:

```powershell
npm --prefix site run content:check
```

```powershell
npm --prefix site run content:test
```

Genera il sito:

La build verifica anche che link, risorse e ancore degli HTML generati esistano, includendo i reindirizzamenti dai vecchi percorsi.

```powershell
npm --prefix site run site:build
```

Avvia l'anteprima, normalmente su `http://localhost:8080`:

```powershell
npm --prefix site run site:serve
```

Per una porta diversa:

```powershell
npm --prefix site run site:serve -- --port 8082
```

Apri il sito tramite il server, non facendo doppio clic su `index.html`. La copia temporanea viene preparata all'avvio: dopo modifiche ai Markdown sorgenti, riavvia il comando di anteprima per rigenerarla.

Per vedere una build gia generata, inclusi i reindirizzamenti, senza ricompilarla:

```powershell
npm --prefix site run site:preview -- --port 8082
```

Questa anteprima e accessibile soltanto dal computer locale e supporta anche il sottopercorso `/appunti/` di GitHub Pages.

Il controllo verifica metadati, link e raggiungibilita: non esegue gli esempi delle note e non certifica l'esattezza di tutti i contenuti. Per il dettaglio degli avvisi editoriali:

```powershell
npm --prefix site run content:check -- --report
```

## GitHub Pages

Il workflow `.github/workflows/deploy-pages.yml` esegue controlli, build e deploy a ogni push su `main`, oppure su avvio manuale. In GitHub, la sorgente in **Settings > Pages** deve essere **GitHub Actions**, non la pubblicazione da un branch.

La configurazione del sito resta in `site/quartz.config.yaml`; `baseUrl` deve corrispondere al dominio e all'eventuale sottopercorso di Pages.

Lo stile usa font locali con fallback di sistema, senza richiedere Google Fonts per leggere le pagine. Gli indici curati nascondono l'elenco automatico di cartella, evitando una seconda navigazione duplicata.
