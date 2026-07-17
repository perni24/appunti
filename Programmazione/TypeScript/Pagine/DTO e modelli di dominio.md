---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [typescript, dto, domain-modeling, architecture]
aliases: [DTO TypeScript, Modelli di dominio]
prerequisites: [API tipizzate, Validazione runtime e tipi statici]
related: [Domain modeling, API contract, Pattern Repository e Service]
---

# DTO e modelli di dominio

## Sintesi

Un DTO descrive dati trasferiti tra confini, per esempio request/response API. Un modello di dominio rappresenta concetti interni dell'applicazione, con invarianti e significato business.

In TypeScript e importante non confondere questi livelli: un dato valido per l'API non e sempre un oggetto di dominio valido.

## Quando usarlo

- API backend.
- Frontend che consuma dati remoti.
- Persistenza database.
- Validazione input.
- Architetture con dominio separato.

## Come funziona

I DTO sono spesso semplici oggetti serializzabili. I modelli di dominio possono essere tipi branded, classi, value object o strutture validate.

Tra DTO e dominio conviene avere mapper espliciti.

## API / Sintassi

```ts
type CreateUserDto = {
  email: string;
  password: string;
};

type User = {
  id: string;
  email: string;
};
```

## Esempio pratico

```ts
type UserResponseDto = {
  id: string;
  email: string;
};

type User = {
  id: string;
  email: string;
  canLogin: boolean;
};

function toUserResponse(user: User): UserResponseDto {
  return {
    id: user.id,
    email: user.email,
  };
}
```

La response pubblica non espone tutti i dettagli del dominio.

## Varianti

- **Request DTO**.
- **Response DTO**.
- **Database model**.
- **Domain model**.
- **View model**.
- **Value object**.

## Errori comuni

- **Usare il modello database come DTO pubblico**.
- **Usare il DTO come dominio interno senza validazione**.
- **Duplicare tipi senza mappatura chiara**.
- **Esporre campi sensibili nelle response**.

## Checklist

- Separare input, output e dominio.
- Validare DTO in ingresso.
- Mappare esplicitamente dominio verso response.
- Non esporre password hash, token o campi interni.
- Usare brand/value object per invarianti forti.

## Collegamenti

- [[Domain modeling]]
- [[API contract]]
- [[Pattern Repository e Service]]
