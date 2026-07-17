---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [programmazione, python, web, django]
aliases: [Django]
prerequisites: []
related: []
---

# Django

## Sintesi

Django e un framework web full-stack Python. Include ORM, routing, template, form, autenticazione, admin, migrazioni e molte convenzioni integrate.

E adatto ad applicazioni web complete e backend CRUD dove velocita di sviluppo, admin e struttura consolidata sono importanti.

## Quando usarlo

Usa Django quando:

- devi costruire applicazioni web complete;
- serve un pannello admin rapidamente;
- il dominio e molto CRUD;
- vuoi convenzioni forti;
- il team beneficia di un framework integrato;
- vuoi ORM e migrazioni inclusi.

Per microservizi API-first leggeri, FastAPI o Flask possono essere piu snelli.

## Come funziona

Django segue un'architettura spesso descritta come MTV:

- **Model**: dati e ORM;
- **Template**: rendering HTML;
- **View**: logica di richiesta/risposta.

Componenti principali:

- models;
- views;
- urls;
- templates;
- forms;
- admin;
- migrations;
- settings.

## API / Sintassi

Model:

```python
from django.db import models


class UserProfile(models.Model):
    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=100)
```

View:

```python
from django.http import JsonResponse


def health(request):
    return JsonResponse({"status": "ok"})
```

URL:

```python
from django.urls import path

urlpatterns = [
    path("health/", health),
]
```

Migrazioni:

```bash
python manage.py makemigrations
python manage.py migrate
```

## Esempio pratico

Query ORM:

```python
def get_user_by_email(email):
    return UserProfile.objects.filter(email=email).first()
```

Registrazione admin:

```python
from django.contrib import admin


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ["email", "display_name"]
```

## Varianti

- **Django classico**: HTML, template e form.
- **Django REST Framework**: API REST strutturate.
- **Django admin**: gestione dati interna.
- **Django ORM**: accesso database integrato.
- **App Django**: moduli applicativi riutilizzabili.
- **Settings per ambiente**: configurazioni separate per dev, test e produzione.

## Errori comuni

- Mettere troppa logica nelle view o nei model.
- Usare l'admin come interfaccia finale per utenti non tecnici senza valutarne limiti.
- Ignorare problemi N+1 nelle query ORM.
- Non separare settings per ambienti diversi.
- Modificare database manualmente invece di usare migrazioni.
- Sottovalutare sicurezza, permessi e validazione form.

## Checklist

- Il progetto beneficia davvero di un framework full-stack?
- Models, views e servizi hanno responsabilita chiare?
- Le migrazioni sono versionate?
- Le query ORM critiche sono controllate?
- Settings e segreti sono gestiti correttamente?
- Admin, permessi e autenticazione sono configurati con criterio?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[SQLAlchemy]]
- [[Alembic]]
- [[FastAPI]]
- [[Flask]]
- [[Programmazione/Postgres/Indice postgres|Postgres]]
