---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: non revisionato
publish: true
tags:
  - programmazione
  - postgres
  - orm
aliases: []
prerequisites: []
related: []
title: ORM
---

# ORM

## Sintesi

Un ORM collega classi, righe e relazioni. È utile per lavorare con entità applicative, ma **il costo dipende dalle query realmente inviate**. Per decidere come caricare una relazione, chiediti quali oggetti servono, quanti viaggi al database richiedono e se vanno conservati anche i genitori senza figli.

## Laboratorio: contare gli ordini per cliente

Database di prova `lab_app` con nomi liberi. Come proprietario prepara due tabelle e concedi al solo ruolo runtime la lettura (si assume `USAGE` sullo schema `public`):

```sql
CREATE TABLE public.lab_customers (id integer PRIMARY KEY);
CREATE TABLE public.lab_customer_orders (
  id integer PRIMARY KEY, customer_id integer NOT NULL REFERENCES public.lab_customers
);
INSERT INTO public.lab_customers VALUES (1), (2), (3);
INSERT INTO public.lab_customer_orders VALUES (10, 1), (11, 1), (12, 2);
GRANT SELECT ON public.lab_customers, public.lab_customer_orders TO lab_app_user;
```

Python con SQLAlchemy 2.0 e Psycopg 3; il servizio libpq `lab_app` usa `lab_app_user`. Ciascuna chiamata apre una **Session nuova**, per non falsare il confronto con relazioni già caricate. Il mapping usa le tabelle esistenti nello schema `public`, qui visibile nello `search_path`.

```python
from sqlalchemy import ForeignKey, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, selectinload

class Base(DeclarativeBase):
    pass

class Customer(Base):
    __tablename__ = "lab_customers"
    id: Mapped[int] = mapped_column(primary_key=True)
    orders: Mapped[list["Order"]] = relationship()

class Order(Base):
    __tablename__ = "lab_customer_orders"
    id: Mapped[int] = mapped_column(primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("lab_customers.id"))

engine = create_engine("postgresql+psycopg://", connect_args={"service": "lab_app"})

def counts(eager):
    stmt = select(Customer).order_by(Customer.id)
    if eager:
        stmt = stmt.options(selectinload(Customer.orders))
    with Session(engine) as session:
        return [(c.id, len(c.orders)) for c in session.scalars(stmt)]

print(counts(False))
print(counts(True))
engine.dispose()
```

Entrambe le stampe danno `[(1, 2), (2, 1), (3, 0)]`. Nel primo caso il caricamento *lazy* invia **4 SELECT sui dati**: uno per i clienti e uno per ogni collezione letta, anche quella vuota. Con `selectinload` ne bastano **2 su questo campione**: clienti, poi ordini per l'insieme delle chiavi. Per verificarlo in sviluppo usa il log SQL con parametri oscurati; non contare come query di business quelle di inizializzazione del driver. Su insiemi più grandi il loader può suddividere le chiavi in più blocchi.

## Quando non caricare gli oggetti

Se servono **solo i conteggi**, non trasferire tutti gli ordini per contarli in Python:

```sql
SELECT c.id, count(o.id) AS ordini
FROM public.lab_customers AS c
LEFT JOIN public.lab_customer_orders AS o ON o.customer_id = c.id
GROUP BY c.id ORDER BY c.id;
```

Un solo statement, stessi tre risultati. `count(o.id)` restituisce zero per il cliente senza ordini; `count(*)` conterebbe la riga prodotta dal left join. Il caricamento anticipato è utile quando servono veramente i figli; un join su più collezioni può invece moltiplicare le righe trasferite.

## Confini della transazione

Un *query builder* costruisce SQL, un ORM può anche tracciare gli oggetti e inviare le modifiche con un *flush*: il flush non è un commit. Con SQLAlchemy `Session(engine)` da sola non conferma le scritture alla chiusura; delimita l'unità di lavoro con `session.begin()`. Non condividere la stessa sessione tra richieste concorrenti. Controlla SQL e lock delle migrazioni generate, proprio come faresti con una migrazione manuale.

## Fonti

[SQLAlchemy 2.0: caricamento delle relazioni](https://docs.sqlalchemy.org/en/20/orm/queryguide/relationships.html) · [Unità di lavoro e Session](https://docs.sqlalchemy.org/en/20/orm/session_basics.html)

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Analisi delle Query|Analisi delle Query]]
- [[Programmazione/PostgreSQL/Pagine/Migrazioni schema|Migrazioni schema]]
- [[Programmazione/PostgreSQL/Pagine/Driver e connection string|Driver e connection string]]
- [[Programmazione/Python/Pagine/SQLAlchemy|SQLAlchemy: sessioni e unità di lavoro]]
