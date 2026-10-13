---
date: 2026-07-28
area: Programmazione
topic: Strutture di Progetto
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - php
  - web
  - struttura-progetto
  - composer
  - architettura-a-livelli
aliases:
  - Struttura applicazione PHP
  - PHP web application structure
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Separazione delle responsabilita]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Organizzazione dei file]]"
  - "[[Programmazione/Clean Code/Pagine/Dipendenze esplicite]]"
  - "[[Programmazione/Clean Code/Pagine/Controller sottili]]"
  - "[[Programmazione/Clean Code/Pagine/Service layer]]"
  - "[[Programmazione/Clean Code/Pagine/Repository pattern]]"
  - "[[Programmazione/Clean Code/Pagine/Configurazione applicativa]]"
  - "[[Programmazione/Clean Code/Pagine/Test unitari leggibili]]"
title: PHP - Applicazione web tradizionale
---

# PHP - Applicazione web tradizionale

## Sintesi

Questa struttura e adatta a un'applicazione PHP server-rendered piccola o media, sviluppata senza un framework completo ma con Composer, namespace PSR-4 e una separazione esplicita tra:

- ingresso HTTP;
- inizializzazione dell'applicazione;
- routing;
- controller;
- casi d'uso;
- accesso ai dati e servizi esterni;
- validazione;
- template;
- configurazione;
- dati generati a runtime;
- test.

L'obiettivo non e riprodurre internamente un framework, ma evitare script PHP indipendenti che mescolano routing, query SQL, HTML e regole applicative nello stesso file.

## Quando usarla

- Sito dinamico con pagine renderizzate dal server.
- Pannello amministrativo interno.
- Applicazione CRUD di dimensioni contenute.
- Progetto didattico che deve mostrare chiaramente il flusso HTTP.
- Applicazione con poche integrazioni e un dominio non ancora complesso.
- Prototipo destinato a crescere oltre pochi script PHP.

Non e la scelta ideale quando servono gia:

- autenticazione e autorizzazione complesse;
- molte API e middleware;
- code, eventi e processi asincroni;
- migrazioni e ORM avanzati;
- decine di moduli applicativi;
- convenzioni condivise da un team numeroso.

In questi casi un framework consolidato puo ridurre codice infrastrutturale e decisioni ripetitive.

## Struttura delle directory

```text
nome-app/
├── public/
│   ├── index.php
│   └── assets/
│       ├── css/
│       ├── js/
│       └── images/
│
├── bootstrap/
│   └── app.php
│
├── routes/
│   ├── web.php
│   └── api.php
│
├── templates/
│   ├── pages/
│   │   ├── home.php
│   │   ├── about.php
│   │   └── contact.php
│   ├── components/
│   │   ├── header.php
│   │   ├── footer.php
│   │   └── form.php
│   └── errors/
│       └── 404.php
│
├── src/
│   ├── Http/
│   │   ├── Controllers/
│   │   ├── Middleware/
│   │   ├── Request.php
│   │   └── Response.php
│   ├── Services/
│   ├── Repositories/
│   ├── Integrations/
│   ├── Validation/
│   └── Support/
│
├── config/
│   ├── app.php
│   └── database.php
│
├── storage/
│   ├── logs/
│   └── cache/
│
├── tests/
│   ├── Unit/
│   ├── Integration/
│   └── Feature/
│
├── vendor/
├── composer.json
├── composer.lock
├── phpunit.xml
├── .env.example
├── .gitignore
└── README.md
```

## Flusso dell'applicazione

```text
browser
  -> public/index.php
  -> bootstrap/app.php
  -> router
  -> middleware
  -> controller
  -> service
  -> repository o integrazione
  -> controller
  -> template oppure risposta JSON
  -> browser
```

Ogni passaggio ha una responsabilita distinta:

1. Il web server inoltra la richiesta a `public/index.php`.
2. Il front controller carica Composer e avvia l'applicazione.
3. Il router associa metodo e percorso a un handler.
4. I middleware applicano controlli trasversali.
5. Il controller traduce la richiesta in una chiamata applicativa.
6. Il service esegue il caso d'uso.
7. Repository e integrazioni comunicano con sistemi esterni.
8. Il controller prepara dati e risposta.
9. Il template produce HTML senza contenere logica applicativa.

## Responsabilita delle directory

### `public/`

E la document root configurata nel web server e l'unica directory direttamente accessibile dal browser.

Contiene:

- `index.php`, unico punto di ingresso PHP;
- asset statici che devono essere serviti pubblicamente.

Non deve contenere:

- configurazioni;
- credenziali;
- classi applicative;
- template;
- log;
- cache;
- file `.env`;
- dump del database.

Impostare la document root su `nome-app/public`, non sulla radice del progetto.

### `public/index.php`

E il front controller. Tutte le richieste dinamiche devono arrivare qui tramite la configurazione del web server.

Responsabilita:

- attivare `strict_types`;
- caricare `vendor/autoload.php`;
- avviare l'applicazione;
- creare la richiesta HTTP;
- ottenere e inviare la risposta;
- intercettare soltanto gli errori non gestiti al confine esterno.

Schema concettuale:

```php
<?php

declare(strict_types=1);

use App\Http\Request;

require dirname(__DIR__) . '/vendor/autoload.php';

$app = require dirname(__DIR__) . '/bootstrap/app.php';
$request = Request::fromGlobals();
$response = $app->handle($request);
$response->send();
```

`Application`, `Request` e `Response` devono essere implementati dal progetto oppure forniti da librerie dedicate. Il frammento mostra il flusso, non un'API standard di PHP.

### `public/assets/`

Contiene file destinati direttamente al browser:

- CSS;
- JavaScript;
- immagini;
- font pubblici.

Se il progetto usa una pipeline frontend, mantenere i sorgenti in una directory come `resources/` e generare in `public/assets/` soltanto gli artefatti finali.

### `bootstrap/`

Contiene il codice che compone l'applicazione.

`bootstrap/app.php` puo:

- leggere la configurazione;
- creare il container o le factory;
- costruire connessione database, logger e router;
- registrare repository e integrazioni;
- caricare le route;
- restituire l'oggetto applicazione.

Il bootstrap conosce le implementazioni concrete. Le classi applicative non devono invece conoscere il file di bootstrap.

### `routes/`

Contiene la mappa tra richieste e controller.

`web.php`:

- route che restituiscono HTML;
- pagine;
- form;
- redirect.

`api.php`:

- endpoint JSON;
- webhook;
- eventuali route versionate.

Esempio concettuale:

```php
<?php

use App\Http\Controllers\ContactController;
use App\Http\Controllers\HomeController;

return [
    ['GET', '/', [HomeController::class, 'index']],
    ['POST', '/contact', [ContactController::class, 'store']],
];
```

Il formato reale dipende dal router scelto. Le route non devono contenere query SQL o regole applicative.

### `templates/`

Contiene la presentazione server-rendered.

#### `templates/pages/`

Template associati a pagine complete:

- home;
- about;
- contact;
- elenco o dettaglio di una risorsa.

#### `templates/components/`

Frammenti riutilizzabili:

- header;
- footer;
- navigazione;
- form;
- messaggi.

#### `templates/errors/`

Pagine per errori destinati all'utente:

- `404.php`;
- `403.php`;
- `500.php`.

I template possono:

- leggere dati preparati dal controller;
- eseguire semplici condizioni di presentazione;
- iterare collezioni gia pronte;
- applicare escaping.

Non devono:

- interrogare il database;
- leggere direttamente `$_POST`;
- creare service;
- decidere regole di business;
- effettuare chiamate HTTP esterne.

Ogni dato inserito in HTML deve essere sottoposto all'escaping appropriato al contesto.

### `src/`

Contiene il codice PHP dell'applicazione caricato tramite Composer.

Il namespace principale puo essere:

```text
App\
```

La directory deve riflettere il namespace PSR-4:

```text
App\Http\Controllers\HomeController
```

corrisponde a:

```text
src/Http/Controllers/HomeController.php
```

### `src/Http/`

Traduce il protocollo HTTP nel linguaggio dell'applicazione.

Puo contenere:

- request e response;
- controller;
- middleware;
- gestione sessione;
- rendering;
- normalizzazione degli input HTTP.

Non deve contenere la logica che stabilisce le regole centrali del caso d'uso.

### `src/Http/Controllers/`

I controller coordinano il confine HTTP.

Un controller dovrebbe:

1. leggere dati dalla request;
2. richiamare un validatore;
3. invocare un service;
4. trasformare il risultato in HTML, JSON o redirect.

Non dovrebbe:

- contenere SQL;
- conoscere credenziali;
- implementare algoritmi di dominio;
- creare manualmente tutte le dipendenze;
- includere template tramite percorsi sparsi.

### `src/Http/Middleware/`

Contiene comportamenti applicati prima o dopo il controller:

- autenticazione;
- autorizzazione;
- CSRF;
- rate limiting;
- logging della richiesta;
- header di sicurezza;
- gestione CORS per le API.

Un middleware non deve diventare un service applicativo nascosto.

### `src/Services/`

Contiene casi d'uso o operazioni applicative.

Esempi:

```text
RegisterUser.php
SendContactMessage.php
CreateOrder.php
GenerateInvoice.php
```

Nomi basati su un'azione sono generalmente piu chiari di classi generiche come:

```text
UserService.php
CommonService.php
HelperService.php
```

Un service:

- coordina repository e integrazioni;
- applica regole del caso d'uso;
- definisce il confine della transazione;
- non dipende da `$_GET`, `$_POST` o template.

Per un'applicazione molto piccola questa directory puo essere inizialmente ridotta. Non creare un service che inoltra semplicemente una chiamata senza aggiungere significato.

### `src/Repositories/`

Isola l'accesso ai dati persistenti.

Esempi:

```text
UserRepository.php
ContactMessageRepository.php
PdoUserRepository.php
```

Responsabilita:

- query;
- mapping tra record e oggetti;
- salvataggio e recupero;
- dettagli del database.

Non deve:

- renderizzare HTML;
- leggere request HTTP;
- inviare email;
- decidere il flusso completo di un caso d'uso.

Il repository pattern e utile quando:

- le query sono riutilizzate;
- il mapping ha complessita;
- serve sostituire o isolare l'accesso dati;
- i test devono controllare il caso d'uso senza un database reale.

Per un CRUD minimo, un livello repository puramente pass-through puo essere complessita non necessaria.

### `src/Integrations/`

Contiene adapter verso servizi esterni:

- client HTTP;
- provider email;
- storage remoto;
- pagamenti;
- API di terze parti.

Ogni integrazione deve:

- nascondere il protocollo esterno;
- convertire errori esterni in errori comprensibili all'applicazione;
- avere timeout;
- evitare di esporre direttamente payload vendor ai service.

### `src/Validation/`

Contiene regole di validazione degli input:

- campi obbligatori;
- formato email;
- lunghezze;
- intervalli;
- DTO o risultati di validazione.

La validazione sintattica avviene al confine. Le invarianti applicative restano nei casi d'uso o negli oggetti che rappresentano il dominio.

Non fidarsi direttamente di `$_GET`, `$_POST`, cookie, header o JSON ricevuti.

### `src/Support/`

Contiene componenti tecnici realmente condivisi:

- clock;
- generazione identificatori;
- wrapper filesystem;
- utility di serializzazione;
- eccezioni tecniche comuni.

Evitare che diventi una cartella generica per codice senza collocazione. Se una classe e usata da una sola feature, mantenerla vicino a quella feature.

### `config/`

Contiene configurazione versionabile e priva di segreti.

Esempio:

```php
<?php

return [
    'name' => $_ENV['APP_NAME'] ?? 'Nome App',
    'environment' => $_ENV['APP_ENV'] ?? 'production',
    'debug' => filter_var($_ENV['APP_DEBUG'] ?? false, FILTER_VALIDATE_BOOL),
];
```

Separare file quando aiuta la consultazione:

```text
config/app.php
config/database.php
config/logging.php
```

Non mantenere contemporaneamente `src/Config/` e `config/` con lo stesso ruolo. Eventuali classi tipizzate che rappresentano configurazione runtime possono vivere in `src/`, ma i valori e il caricamento devono avere un'origine chiara.

### `storage/`

Contiene dati generati dall'applicazione:

- log;
- cache;
- file temporanei;
- sessioni su filesystem;
- upload non pubblici, se previsti.

Questa directory:

- non deve essere esposta dal web server;
- deve avere permessi minimi sufficienti al processo PHP;
- deve essere esclusa dai backup del codice quando contiene solo cache;
- deve avere politiche di rotazione e pulizia.

Non versionare il contenuto di `logs/` e `cache/`. Se Git deve conservare le directory vuote, usare un file placeholder privo di dati sensibili.

### `tests/`

Contiene codice che verifica automaticamente il comportamento.

#### `tests/Unit/`

Verifica una singola classe o funzione senza database, rete o filesystem reale.

Esempi:

- validatore email;
- calcolo prezzo;
- regola di autorizzazione;
- service con dipendenze simulate.

#### `tests/Integration/`

Verifica la collaborazione con componenti reali:

- repository e database di test;
- caricamento della configurazione;
- adapter filesystem;
- client verso un server simulato.

#### `tests/Feature/`

Verifica una funzionalita attraverso il confine HTTP:

```text
request -> route -> controller -> service -> response
```

Esempi:

- `GET /` restituisce `200`;
- pagina sconosciuta restituisce `404`;
- form non valido mostra gli errori;
- utente non autenticato viene reindirizzato.

I test non vengono esposti dal web server e non fanno parte del codice eseguito in produzione.

### `vendor/`

E generata da Composer e contiene:

- dipendenze;
- autoloader;
- metadati dei package.

Non modificarla manualmente. Normalmente viene esclusa da Git e ricreata con:

```bash
composer install
```

### `composer.json`

Descrive dipendenze, autoload e comandi del progetto.

Esempio minimo:

```json
{
  "name": "acme/nome-app",
  "type": "project",
  "autoload": {
    "psr-4": {
      "App\\": "src/"
    }
  },
  "autoload-dev": {
    "psr-4": {
      "Tests\\": "tests/"
    }
  },
  "scripts": {
    "test": "phpunit"
  }
}
```

Dopo aver cambiato la configurazione di autoload:

```bash
composer dump-autoload
```

### `composer.lock`

Registra le versioni esatte risolte da Composer.

Per un'applicazione deve normalmente essere versionato, in modo che sviluppo, test e produzione installino lo stesso insieme di dipendenze.

### `.env.example`

Documenta le variabili richieste senza contenerne i valori segreti.

Esempio:

```dotenv
APP_NAME=NomeApp
APP_ENV=development
APP_DEBUG=false
APP_URL=http://localhost

DB_DSN=mysql:host=localhost;dbname=nome_app
DB_USER=
DB_PASSWORD=
```

Il file reale `.env`:

- non deve essere versionato;
- non deve trovarsi in `public/`;
- deve avere valori specifici dell'ambiente;
- non deve essere incluso nei log.

### `.gitignore`

Esempio iniziale:

```gitignore
/.env
/vendor/
/storage/logs/*
/storage/cache/*
/.phpunit.cache/
```

Adattare l'elenco agli strumenti realmente usati.

### `README.md`

Deve permettere di avviare il progetto senza conoscenze implicite.

Contenuto minimo:

- requisiti;
- installazione;
- configurazione ambiente;
- database;
- avvio locale;
- esecuzione test;
- struttura delle directory;
- procedure di build e deploy.

## Dipendenze consentite

Regola di base:

```text
Http -> Services -> Repositories / Integrations
```

Vincoli:

- i controller possono dipendere dai service;
- i service possono dipendere da repository e integrazioni;
- repository e integrazioni non dipendono dai controller;
- i template ricevono dati ma non accedono ai repository;
- la validazione HTTP non deve conoscere il rendering;
- `Support` non deve dipendere da livelli superiori;
- il bootstrap puo conoscere tutte le implementazioni per comporle.

Quando l'applicazione cresce, introdurre interfacce nei confini che devono essere sostituibili. Non creare un'interfaccia per ogni classe senza una seconda implementazione, un confine esterno o una necessita di test concreta.

## Gestione di HTML e API

La presenza di `routes/api.php` non richiede un secondo file pubblico.

Entrambi i flussi passano da:

```text
public/index.php
```

Il router decide:

- route web: risposta HTML o redirect;
- route API: risposta JSON e status HTTP;
- route non trovata: errore `404`.

Questo centralizza:

- gestione errori;
- logging;
- sessione;
- autenticazione;
- header;
- sicurezza.

## File e directory opzionali

### `database/`

Aggiungere quando il progetto gestisce lo schema:

```text
database/
├── migrations/
├── seeds/
└── fixtures/
```

### `bin/`

Aggiungere per comandi CLI:

```text
bin/
└── console
```

### `resources/`

Aggiungere quando CSS e JavaScript richiedono compilazione:

```text
resources/
├── css/
└── js/
```

Gli output finiscono in `public/assets/`.

### `src/Domain/` e `src/Application/`

Aggiungere quando il dominio cresce e la separazione per livello non basta:

```text
src/
├── Domain/
├── Application/
├── Infrastructure/
└── Http/
```

Non introdurre questa variante soltanto per rendere l'albero piu formale.

## Sicurezza strutturale

- Configurare `public/` come unica document root.
- Non accettare percorsi filesystem direttamente dall'utente.
- Validare input esterni.
- Applicare escaping contestuale nell'HTML.
- Usare query parametrizzate.
- Proteggere i form con token CSRF.
- Gestire session cookie con attributi appropriati.
- Non mostrare stack trace in produzione.
- Non registrare password, token o cookie.
- Limitare permessi di scrittura a `storage/`.
- Conservare segreti fuori dal repository.
- Impostare timeout per integrazioni esterne.

La struttura riduce l'esposizione accidentale, ma non rende sicuro il codice automaticamente.

## Varianti

### Progetto molto piccolo

E possibile iniziare con:

```text
public/
templates/
src/Http/
src/Services/
config/
tests/
```

Aggiungere repository, integrazioni e middleware quando emergono responsabilita reali.

### Organizzazione per feature

Quando le directory tecniche diventano molto grandi:

```text
src/
├── Contact/
│   ├── Http/
│   ├── SendContactMessage.php
│   └── ContactMessageRepository.php
├── User/
└── Shared/
```

Questa variante mantiene vicini i file che cambiano insieme.

### Framework MVC

Con Laravel, Symfony o altri framework, seguire prima le convenzioni ufficiali del framework. Questa struttura resta utile come modello mentale, ma non deve essere sovrapposta forzatamente.

## Errori comuni

### Più entry point PHP pubblici

Sintomo:

```text
public/index.php
public/api.php
public/contact.php
public/admin.php
```

Problema:

- bootstrap duplicato;
- controlli di sicurezza incoerenti;
- routing distribuito;
- gestione errori differente.

Soluzione: un front controller e route esplicite.

### Duplicazione della configurazione

Problema:

```text
src/Config/
config/
.env
```

senza una responsabilita distinta.

Soluzione: usare `config/` per i valori versionabili, `.env` per l'ambiente e classi tipizzate soltanto quando servono.

### Controller troppo grandi

Sintomo:

- SQL;
- validazione;
- invio email;
- rendering;
- transazioni;
- gestione completa del caso d'uso nello stesso metodo.

Soluzione: lasciare al controller la traduzione HTTP e spostare il caso d'uso in una classe dedicata.

### Service generici

Nomi come `CommonService`, `UtilityService` o `AppService` nascondono responsabilita differenti.

Soluzione: preferire classi orientate a un'azione o a un concetto preciso.

### Template che interrogano il database

Rende il rendering difficile da testare e produce query nascoste.

Soluzione: preparare tutti i dati prima del rendering.

### Repository usati come requisito formale

Un repository che inoltra ogni chiamata senza isolamento o significato aumenta il numero di file.

Soluzione: introdurlo quando esiste un confine persistente utile.

### Test che usano sempre il database

Rendono lenta anche la verifica di semplici regole.

Soluzione: separare test unitari, integrazione e feature.

### Radice del progetto esposta

Puo rendere raggiungibili configurazioni, dipendenze e file runtime.

Soluzione: document root su `public/`.

## Checklist

- [ ] `public/` e l'unica directory esposta.
- [ ] Esiste un solo `public/index.php`.
- [ ] Routing web e API e separato dal front controller.
- [ ] Composer carica `App\` da `src/` tramite PSR-4.
- [ ] Il bootstrap compone le dipendenze.
- [ ] I controller non contengono SQL o regole applicative estese.
- [ ] I service rappresentano casi d'uso reali.
- [ ] Repository e integrazioni isolano sistemi esterni.
- [ ] Gli input sono validati al confine.
- [ ] I template applicano escaping e non accedono ai dati.
- [ ] Segreti e `.env` non sono versionati.
- [ ] `composer.lock` e versionato.
- [ ] `vendor/`, log e cache sono esclusi da Git.
- [ ] `storage/` non e pubblico e ha permessi controllati.
- [ ] Test unitari, integrazione e feature hanno scopi distinti.
- [ ] Il README documenta avvio, configurazione e test.
- [ ] Le directory opzionali sono introdotte soltanto quando necessarie.

## Riferimenti

- [Composer - Autoload](https://getcomposer.org/doc/04-schema.md#autoload)
- [Composer - Basic usage and autoloading](https://getcomposer.org/doc/01-basic-usage.md#autoloading)
- [PHP-FIG - PSR-4](https://www.php-fig.org/psr/psr-4/)
- [PHP Manual - User submitted data](https://www.php.net/manual/en/security.variables.php)

## Collegamenti

- [[Programmazione/Strutture di Progetto/Indice Strutture di Progetto|Indice Strutture di Progetto]]
- [[Programmazione/Clean Code/Pagine/Separazione delle responsabilita|Separazione delle responsabilita]]
- [[Programmazione/Clean Code/Pagine/Controller sottili|Controller sottili]]
- [[Programmazione/Clean Code/Pagine/Service layer|Service layer]]
- [[Programmazione/Clean Code/Pagine/Repository pattern|Repository pattern]]
- [[Programmazione/Clean Code/Pagine/Validazione ai confini|Validazione ai confini]]
- [[Programmazione/Clean Code/Pagine/Test unitari leggibili|Test unitari leggibili]]
