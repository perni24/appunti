---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - programmazione
  - python
  - web
  - django
aliases:
  - Django
prerequisites: []
related: []
title: Django
---

# Django

## Sintesi

Django integra routing, ORM, migrazioni, template, form, autenticazione e admin. Offre convenzioni per costruire applicazioni complete; non decide al posto tuo le regole del dominio o chi puo leggere/modificare ogni oggetto.

Baseline: **CPython 3.12.10 e Django 5.2.18**, ramo 5.2, SQLite del runtime su Windows. Non e una dichiarazione dell'ultima versione di Django o della compatibilita con ogni database.

## Quando usarlo

- Applicazioni con modelli relazionali, form e gestione amministrativa.
- Progetti che beneficiano di componenti integrati e convenzioni condivise.
- Siti server-rendered o API affiancate a un'app completa.

L'admin e un'interfaccia gestionale per utenti fidati e autorizzati, non automaticamente il frontend del prodotto. Django REST Framework e un pacchetto aggiuntivo per API, non parte implicita di ogni progetto Django.

## Come funziona

- **Project**: configurazione, URL principali e ingressi WSGI/ASGI.
- **App**: modulo funzionale con modelli, view, URL e migrazioni; deve essere registrato dove necessario.
- **Model**: schema/mapping e accesso dati. Istanziare un model non salva una riga.
- **View**: gestisce la richiesta e restituisce una HttpResponse.
- **Template**: produce HTML con contesto ed escaping.
- **Form/ModelForm**: converte e valida input; non e un parser JSON generale.

La sigla MTV distingue Model, Template e View. Non vieta un livello di servizi quando una regola coinvolge piu modelli o effetti.

## API / Sintassi

| API                    | Da ricordare                                                                |
| ---------------------- | --------------------------------------------------------------------------- |
| `path` e `include`     | Collegano view e URL; il nome serve a reverse                               |
| `QuerySet.filter(...)` | Costruisce una query lazy; iterazione, list e altre operazioni la eseguono  |
| `first()`              | Restituisce oggetto o None                                                  |
| `get()`                | Richiede un risultato; puo sollevare DoesNotExist o MultipleObjectsReturned |
| `get_object_or_404`    | Converte l'assenza in 404, non controlla i permessi                         |
| `ModelForm.is_valid()` | Valida i campi esposti dal form                                             |
| `transaction.atomic()` | Delimita una transazione/savepoint, non annulla email o chiamate HTTP       |

### Validazione e vincoli non sono la stessa cosa

EmailField fornisce validazione a livello Python, ma **save() non chiama automaticamente full_clean()**. objects.create segue il salvataggio e non lo trasforma in una validazione completa.

Un ModelForm valida i campi gestiti; scegli una lista fields esplicita. I vincoli del database restano necessari: un controllo di unicita prima del salvataggio puo essere superato da una scrittura concorrente.

Non trattare qualsiasi IntegrityError come duplicato noto. Gestisci il vincolo atteso fuori dal blocco atomic fallito, dopo il rollback, e lascia emergere gli altri errori.

## Esempio pratico

Un progetto locale con un profilo fittizio, lettura HTML/JSON e admin. **UserProfile non e il modello utente di autenticazione** e l'esempio non realizza registrazione/login. Gli endpoint pubblici mostrano solo ID e nome dimostrativi: in un prodotto reale filtra gli oggetti per autorizzazione prima di restituirli.

In una directory nuova, vuota e dedicata, con virtualenv attivo:

```powershell
python -m pip install "Django==5.2.18"
```

```powershell
python -m django startproject config .
```

```powershell
python manage.py startapp profiles
```

I comandi generano manage.py, config e profiles. Nei file sotto inserisci il contenuto indicato; gli altri file generati restano presenti.

### config/settings.py

Aggiungi **alla fine del file generato**, conservando le app Django, middleware, database SQLite e template predefiniti:

```python
INSTALLED_APPS += ["profiles"]
ALLOWED_HOSTS = ["127.0.0.1", "localhost"]
```

Questa e configurazione locale. Il file generato contiene DEBUG=True e una SECRET_KEY di sviluppo: non usarli per un deployment pubblico. Configurazione e segreti di produzione devono essere separati.

### profiles/models.py

```python
from django.db import models


class UserProfile(models.Model):
    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=100)

    def __str__(self):
        return self.display_name
```

### profiles/forms.py

```python
from django import forms
from .models import UserProfile


class UserProfileForm(forms.ModelForm):
    class Meta:
        model = UserProfile
        fields = ["email", "display_name"]
```

### profiles/views.py

```python
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render
from django.views.decorators.http import require_safe

from .models import UserProfile


@require_safe
def health(request):
    return JsonResponse({"status": "ok"})


@require_safe
def profile_detail(request, pk):
    profile = get_object_or_404(UserProfile, pk=pk)
    return JsonResponse({"id": profile.pk, "display_name": profile.display_name})


@require_safe
def profile_page(request, pk):
    profile = get_object_or_404(UserProfile, pk=pk)
    return render(request, "profiles/detail.html", {"profile": profile})
```

### profiles/urls.py

```python
from django.urls import path
from . import views

app_name = "profiles"
urlpatterns = [
    path("health/", views.health, name="health"),
    path("api/profiles/<int:pk>/", views.profile_detail, name="detail"),
    path("profiles/<int:pk>/", views.profile_page, name="page"),
]
```

### config/urls.py

```python
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("profiles.urls")),
]
```

### profiles/admin.py

```python
from django.contrib import admin
from .forms import UserProfileForm
from .models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    form = UserProfileForm
    list_display = ["email", "display_name"]
```

### profiles/templates/profiles/detail.html

```html
<!doctype html>
<html lang="it">
  <head>
    <meta charset="utf-8" />
    <title>Profilo dimostrativo</title>
  </head>
  <body>
    <h1>{{ profile.display_name }}</h1>
    <p>Profilo dimostrativo</p>
  </body>
</html>
```

Il doppio namespace profiles evita collisioni tra template di app diverse. L'escaping predefinito non va disattivato con safe per visualizzare contenuti non fidati.

### Migrazioni e avvio

Genera la migrazione dallo stato dei model, poi ispeziona il file in profiles/migrations. Il comando non confronta arbitrariamente tutto il database con il codice.

```powershell
python manage.py makemigrations profiles
```

Visualizza il piano:

```powershell
python manage.py migrate --plan
```

Applica **solo al database del demo**; in progetti reali questa operazione modifica lo schema e richiede strategia di deploy e backup:

```powershell
python manage.py migrate
```

Controlli di configurazione:

```powershell
python manage.py check
```

Per usare l'admin locale, crea interattivamente un utente senza inserire password nei comandi o negli appunti:

```powershell
python manage.py createsuperuser
```

Avvio locale; scegli una porta libera:

```powershell
python manage.py runserver 127.0.0.1:8002
```

Crea un record fittizio in /admin/ e usa il suo ID nei due percorsi di dettaglio. runserver non e un server di produzione. I file di migrazione appartengono al controllo versione del progetto; il database locale e i segreti no.

### profiles/tests.py

```python
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import TestCase
from django.urls import reverse

from .forms import UserProfileForm
from .models import UserProfile


class ProfileTests(TestCase):
    def setUp(self):
        self.profile = UserProfile.objects.create(
            email="demo@example.com", display_name="Demo"
        )

    def test_json_and_missing(self):
        url = reverse("profiles:detail", args=[self.profile.pk])
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(), {"id": self.profile.pk, "display_name": "Demo"}
        )
        self.assertEqual(self.client.get("/api/profiles/99999/").status_code, 404)

    def test_methods(self):
        response = self.client.post(reverse("profiles:health"))
        self.assertEqual(response.status_code, 405)
        self.assertIn("GET", response.headers["Allow"])

    def test_form(self):
        form = UserProfileForm(
            data={"email": "invalid", "display_name": "Demo"}
        )
        self.assertFalse(form.is_valid())
        self.assertIn("email", form.errors)

    def test_full_clean_is_explicit(self):
        profile = UserProfile(email="invalid", display_name="Demo")
        with self.assertRaises(ValidationError):
            profile.full_clean()
        # Controprova nel solo database temporaneo del test.
        profile.save()
        self.assertTrue(UserProfile.objects.filter(pk=profile.pk).exists())

    def test_unique_constraint(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                UserProfile.objects.create(
                    email=self.profile.email, display_name="Duplicate"
                )
        self.assertEqual(UserProfile.objects.count(), 1)

    def test_lazy_query(self):
        with self.assertNumQueries(0):
            query = UserProfile.objects.filter(email=self.profile.email)
        with self.assertNumQueries(1):
            self.assertEqual(query.first().pk, self.profile.pk)

    def test_html_escapes(self):
        self.profile.display_name = "<script>alert(1)</script>"
        self.profile.save(update_fields=["display_name"])
        response = self.client.get(
            reverse("profiles:page", args=[self.profile.pk])
        )
        self.assertContains(response, "&lt;script&gt;")
        self.assertNotContains(response, "<script>")
```

```powershell
python manage.py test profiles
```

TestCase usa un database di test separato. Il salvataggio di email invalida e una controprova intenzionale, non il percorso da copiare nella logica applicativa. La validazione puo normalizzare dati e verificare regole, mentre i vincoli DB difendono invarianti anche tra scritture concorrenti.

Il client Django dei test non applica CSRF per default. Per provarlo crea un Client(enforce_csrf_checks=True): con il middleware attivo una POST senza token puo ricevere 403 prima di raggiungere la view, anche se il test del solo vincolo sul metodo riceve 405. Non disabilitare CSRF nell'app per uniformare questi due casi.

## Varianti

- **Transazioni**: atomic annulla le scritture DB se un errore attraversa il blocco. Per effetti post-commit usa on_commit dove appropriato, senza confonderlo con una coda durabile.
- **Query**: select_related/prefetch_related servono a ridurre N+1 in relazioni diverse; misura il numero di query, non aggiungerli indiscriminatamente.
- **Async**: Django 5.2 espone view e parte dell'ORM async, ma le transazioni async non sono supportate. Isola il lavoro transazionale in una funzione sync da chiamare con sync_to_async; non disabilitare le protezioni async-unsafe.
- **API**: JsonResponse non offre automaticamente serializer, OpenAPI o autorizzazione per oggetto. Un framework API aggiuntivo ha configurazioni e contratti propri.
- **Ambienti**: DEBUG, host, chiavi, database, static e media richiedono configurazione dedicata. Un file caricato dall'utente non va trattato come codice eseguibile.

## Errori comuni

- Dimenticare INSTALLED_APPS, import della view o include degli URL.
- Credere che EmailField renda impossibile salvare una email invalida.
- Usare fields="**all**" senza valutare i campi che potrebbero essere aggiunti.
- Catturare errori DB dentro atomic e continuare con una transazione compromessa.
- Modificare tabelle a mano senza migrazioni o fidarsi di SQLite per ogni semantica di PostgreSQL.
- Rimuovere CSRF per far funzionare un form o usare safe come rimedio all'escaping.
- Assumere che login o permessi admin proteggano automaticamente tutte le view.
- Usare DEBUG=True e runserver in produzione.

## Checklist

- Project, app, route e template sono collegati senza import mancanti?
- Validazione e vincoli database sono entrambi espliciti?
- Migrazioni versionate e verificate su un database rappresentativo?
- Query, 404, metodi, escaping e input invalidi sono testati?
- Autenticazione, autorizzazione e CSRF hanno test dedicati?
- check --deploy e stato eseguito sui settings di produzione, senza scambiarlo per un audit completo?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/SQLAlchemy|SQLAlchemy]]
- [[Programmazione/Python/Pagine/Alembic|Alembic]]
- [[Programmazione/Python/Pagine/FastAPI|FastAPI]]
- [[Programmazione/Python/Pagine/Flask|Flask]]
- [[Programmazione/Python/Pagine/SQLite con sqlite3|SQLite con sqlite3]]
- [[Programmazione/Python/Pagine/Testing|Testing]]
- [[Programmazione/PostgreSQL/Indice PostgreSQL|PostgreSQL]]

## Fonti

- [Django 5.2: progetto e URL](https://docs.djangoproject.com/en/5.2/intro/tutorial01/).
- [Modelli, migrazioni e admin](https://docs.djangoproject.com/en/5.2/intro/tutorial02/).
- [Model.save e full_clean](https://docs.djangoproject.com/en/5.2/ref/models/instances/).
- [ModelForm](https://docs.djangoproject.com/en/5.2/topics/forms/modelforms/).
- [Transazioni](https://docs.djangoproject.com/en/5.2/topics/db/transactions/).
- [QuerySet, valutazione e relazioni](https://docs.djangoproject.com/en/5.2/ref/models/querysets/).
- [Protezione CSRF](https://docs.djangoproject.com/en/5.2/ref/csrf/).
- [Supporto async](https://docs.djangoproject.com/en/5.2/topics/async/).
- [Test client e database di test](https://docs.djangoproject.com/en/5.2/topics/testing/tools/).
- [Checklist di deployment](https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/).
