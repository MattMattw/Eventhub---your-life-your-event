const express = require('express');
const cors = require('cors');

// Immaginiamo che le tue rotte siano definite in questi file
// const userRoutes = require('./routes/users');
// const eventRoutes = require('./routes/events');

const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURAZIONE CORS ---
// Definiamo quali origini (frontend) possono fare richieste al nostro backend.
const corsOptions = {
  // In sviluppo, permettiamo solo al server di sviluppo del frontend di connettersi.
  // Per la produzione, dovresti cambiare questo con l'URL del tuo sito live.
  origin: 'http://localhost:5173',
  optionsSuccessStatus: 200 // Per browser più vecchi
};

// Applica il middleware CORS a tutte le richieste in entrata.
// Questo deve venire PRIMA della definizione delle rotte.
app.use(cors(corsOptions));

// Middleware per il parsing del JSON nel corpo delle richieste
app.use(express.json());

// --- ROTTE API ---
// app.use('/api/users', userRoutes);
// app.use('/api/events', eventRoutes);

// --- ROTTA DI TEST PER LA VERIFICA EMAIL ---
// Questa è una rotta di esempio per gestire la chiamata dal frontend.
// In un'applicazione reale, questa logica sarebbe in un controller.
app.post('/api/users/verify-email/:token', (req, res) => {
  const { token } = req.params;
  console.log(`[Backend] Ricevuto token di verifica: ${token}`);

  // Simula una risposta di successo
  res.status(200).json({ message: 'Email verificata con successo dal backend!' });
});

app.listen(PORT, () => {
  console.log(`Backend server in ascolto sulla porta ${PORT}`);
});