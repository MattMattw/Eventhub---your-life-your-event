# 📘 Schema Dati - EventHub

Questo documento descrive le **entità principali** e le **relazioni logiche** all'interno dell’applicazione *EventHub*.  
Il database scelto è **MongoDB**.
Le entità sono rappresentate come **documenti** in diverse collezioni.  
Le relazioni tra entità sono gestite tramite **riferimenti (`ObjectId`)** e non tramite embedding diretto, per garantire flessibilità e prestazioni.

---

## 👤 User

Rappresenta un utente registrato all’interno della piattaforma.

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `_id` | ObjectId | Identificativo univoco generato da MongoDB |
| `name` | String | Nome completo dell’utente |
| `email` | String | Email univoca, usata per il login |
| `passwordHash` | String | Password cifrata con algoritmo di hashing (es. bcrypt) |
| `role` | String | Ruolo dell’utente: `'user'` o `'admin'` |
| `status` | String | Stato account: `'active'` o `'blocked'` |
| `createdAt` | Date | Data di creazione del profilo utente |

**Relazioni:**
- Un utente può **creare più eventi** (`Event.creatorRef`).
- Un utente può **iscriversi a più eventi** (tramite la collezione `Registration`).
- Un utente può **inviare messaggi** nelle chat evento (`Message.authorRef`).

---

## 🎉 Event

Rappresenta un evento creato da un utente (organizzatore).

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `_id` | ObjectId | Identificativo univoco evento |
| `title` | String | Titolo dell’evento |
| `description` | String | Descrizione dettagliata dell’evento |
| `date` | Date | Data e ora dell’evento |
| `location` | String | Luogo o città in cui si svolge |
| `category` | String | Categoria dell’evento (es. tecnologia, sport, cultura...) |
| `capacity` | Number | Numero massimo di partecipanti |
| `imageURL` | String | URL immagine di copertina (facoltativo) |
| `creatorRef` | ObjectId (User) | Riferimento all’utente che ha creato l’evento |
| `status` | String | Stato approvazione evento: `'pending'`, `'approved'`, `'rejected'` |
| `createdAt` | Date | Data di creazione evento |

**Relazioni:**
- Un evento **appartiene a un utente creatore** (`creatorRef`).
- Un evento **ha molti iscritti** (collezione `Registration`).
- Un evento **ha una chat associata** (collezione `Message`).

---

## 📝 Registration

Rappresenta l’iscrizione di un utente a un evento.  
Serve a gestire la relazione **molti-a-molti** tra `User` e `Event`.

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `_id` | ObjectId | Identificativo univoco iscrizione |
| `userRef` | ObjectId (User) | Utente che si iscrive |
| `eventRef` | ObjectId (Event) | Evento a cui è iscritto |
| `status` | String | Stato iscrizione: `'registered'` o `'cancelled'` |
| `createdAt` | Date | Data dell’iscrizione |

**Regole di business:**
- Un utente non può avere due iscrizioni attive allo stesso evento.
- Se la capienza dell’evento è piena, l’iscrizione non è consentita.
- Quando un utente annulla l’iscrizione, il posto si libera.

---

## 💬 Message

Rappresenta un messaggio inviato nella chat interna di un evento.  
La chat è **in tempo reale** tramite Socket.io.  
I messaggi **possono essere non persistenti** (solo in memoria) oppure **persistiti** se in futuro si desidera uno storico.

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `_id` | ObjectId | Identificativo messaggio (solo se salvato) |
| `eventRef` | ObjectId (Event) | Evento di riferimento della chat |
| `authorRef` | ObjectId (User) | Utente che ha inviato il messaggio |
| `content` | String | Testo del messaggio |
| `createdAt` | Date | Data e ora di invio del messaggio |

**Nota:**  
Attualmente i messaggi **non vengono salvati nel database**.  
Sono gestiti **solo in memoria** durante la sessione Socket.io e scompaiono alla disconnessione o al riavvio del server.

---

## ⚙️ Relazioni principali (riepilogo)

| Entità A | Relazione | Entità B | Tipo relazione |
|-----------|------------|-----------|----------------|
| User | crea | Event | 1 → N |
| User | si iscrive a | Event | N ↔ N (tramite Registration) |
| User | invia messaggi in | Event | N → N (via Message) |
| Admin (User) | modera | Event / User | gestione privilegi |
| Event | contiene | Message | 1 → N |

---

## 🧮 Esempi di documenti (JSON)

### User
```json
{
  "_id": "66f89b4b2b12c24a88fa90f3",
  "name": "Mario Rossi",
  "email": "mario.rossi@example.com",
  "passwordHash": "$2b$10$KfT...",
  "role": "user",
  "status": "active",
  "createdAt": "2025-10-30T12:45:00Z"
}
```

📅 Ultimo aggiornamento: 31 ottobre 2025

👤 Autore: Mattia Martinelli

📁 Progetto: EventHub - Esame finale Node.js