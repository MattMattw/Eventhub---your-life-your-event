1. Descrizione del progetto
EventHub è una piattaforma dove gli utenti possono:
● Creare e gestire eventi.
● Iscriversi agli eventi creati da altri.
● Ricevere notifiche in tempo reale quando qualcuno si registra.
● Comunicare tramite una chat interna per ogni evento.
● Esplorare un catalogo pubblico di eventi filtrabile per categorie, data o
luogo.
Gli amministratori avranno un pannello di gestione per moderare eventi, utenti e
segnalazioni.
2. Requisiti funzionali
Il progetto è diviso in macro-funzionalità:
A. Gestione utenti
● Registrazione, login e logout.
● Autenticazione tramite JWT.
# Capitolato — EventHub

## 1. Descrizione del progetto

EventHub è una piattaforma per creare, scoprire e partecipare ad eventi. Le
principali funzionalità includono:

- Creazione e gestione di eventi.
- Iscrizione agli eventi creati da altri utenti.
- Notifiche in tempo reale per nuove iscrizioni e aggiornamenti.
- Chat interna per ogni evento per favorire la comunicazione tra
	partecipanti.
- Catalogo pubblico di eventi con filtri per categoria, data e luogo.

Gli amministratori avranno a disposizione un pannello per moderare eventi,
utenti e segnalazioni.

## 2. Requisiti funzionali

Il progetto è organizzato in macro-aree funzionali:

### A. Gestione utenti

- Registrazione, login e logout.
- Autenticazione tramite JWT.
- Ruoli utente:
	- Utente base: può creare eventi, iscriversi e partecipare alle chat.
	- Amministratore: può approvare/rifiutare eventi, bloccare utenti e
		gestire segnalazioni.
- Recupero password via email (reset token inviato all'indirizzo registrato).

### B. Gestione eventi

- Creazione di eventi con titolo, descrizione, data, luogo, capienza, prezzo
	e immagine.
- Modifica e cancellazione degli eventi creati dagli organizzatori.
- Iscrizione e annullamento iscrizione a un evento.
- Elenco pubblico di eventi con filtri per data, categoria, luogo e ricerca
	testuale.
- Dashboard personale con:
	- Eventi creati dall'utente.
	- Eventi a cui l'utente è iscritto.

### C. Chat e notifiche in tempo reale

- Chat per ogni evento accessibile ai partecipanti.
- Notifiche in tempo reale quando qualcuno si iscrive o cancella
	l'iscrizione a un evento.
- Notifiche in tempo reale verso gli amministratori quando viene creata una
	segnalazione relativa ad un evento o ad un utente.

### D. API pubblica e documentazione

- Tutte le funzionalità devono essere esposte tramite API REST.
- Gli endpoint devono avere controlli di accesso in base al ruolo (user/admin).
- Documentazione API (OpenAPI/Swagger) per tutti gli endpoint principali.

### E. Funzionalità opzionali (extra)

- Integrazione OAuth (Google, GitHub, ecc.) per login rapido.
- Verifica email per nuovi iscritti (link di conferma via email).
- Invio email di conferma per iscrizione ad un evento e notifiche rilevanti.
- Deployment su piattaforme cloud (es. Render, Vercel, Railway, Heroku).

---

Nota: la lista sopra descrive i requisiti principali e alcune estensioni
consigliate; priorità e implementazione possono essere adattate in base alle
esigenze del progetto e alle risorse disponibili.