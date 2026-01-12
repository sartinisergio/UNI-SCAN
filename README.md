# UNI-SCAN - Sistema di Analisi e Confronto di Programmi e Manuali Universitari

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node.js-v20-green.svg)
![React](https://img.shields.io/badge/react-19-blue.svg)
![Database](https://img.shields.io/badge/database-MySQL%2FPostgreSQL%2FSQLite-orange.svg)

## 📋 Descrizione

**UNI-SCAN** è una piattaforma web completa per l'analisi, la valutazione e il confronto di programmi e manuali universitari. Consente agli editori di gestire framework didattici, analizzare manuali con intelligenza artificiale, e confrontare più testi per identificare gap e opportunità di miglioramento.

### Funzionalità Principali

- ✅ **Gestione Framework Didattici**: Crea e gestisci framework di valutazione personalizzati
- ✅ **Database Manuali**: Catalogo completo dei manuali con metadati (editore, autore, anno, prezzo, ecc.)
- ✅ **Analisi Automatica**: Utilizza l'IA per analizzare manuali e valutare la copertura del framework
- ✅ **Confronto Manuali**: Confronta fino a 3 manuali contemporaneamente con tabella comparativa
- ✅ **Esportazione HTML**: Esporta i confronti in HTML modificabile
- ✅ **Dashboard Analitiche**: Visualizza statistiche e metriche di valutazione
- ✅ **Gestione Dati**: CRUD completo per framework, manuali e valutazioni
- ✅ **Autenticazione**: Sistema di login sicuro con OAuth

---

## 🚀 Quick Start

### Prerequisiti

- Node.js v18+
- pnpm v8+
- Database (MySQL 8.0+, PostgreSQL 12+, o SQLite)

### Installazione Locale

```bash
# Clonare il repository
git clone https://github.com/sartinisergio/UNI-SCAN.git
cd UNI-SCAN

# Installare le dipendenze
pnpm install

# Configurare le variabili di ambiente
cp .env.example .env.local
# Editare .env.local con le tue credenziali

# Eseguire le migrazioni del database
pnpm db:push

# Avviare il dev server
pnpm dev
```

L'applicazione sarà disponibile su `http://localhost:3000`

---

## 📚 Documentazione

### Per Utenti
- **[Guida Utente](./docs/user-guide.md)** - Come usare l'applicazione
- **[FAQ](./docs/faq.md)** - Domande frequenti

### Per Sviluppatori
- **[Architettura](./docs/architecture.md)** - Struttura tecnica del progetto
- **[API Documentation](./docs/api.md)** - Endpoint tRPC disponibili
- **[Database Schema](./drizzle/schema.ts)** - Schema del database

### Per DevOps/IT
- **[Guida di Deployment](./deployment.md)** - Come installare su server interno
- **[Configurazione](./docs/configuration.md)** - Variabili di ambiente e setup
- **[Troubleshooting](./deployment.md#troubleshooting)** - Risoluzione problemi comuni

---

## 🏗️ Stack Tecnologico

| Layer | Tecnologia |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Tailwind CSS 4, Vite |
| **Backend** | Express 4, tRPC 11, Node.js |
| **Database** | Drizzle ORM (MySQL, PostgreSQL, SQLite) |
| **Build Tool** | Vite |
| **Package Manager** | pnpm |
| **Testing** | Vitest |
| **UI Components** | shadcn/ui |

---

## 📁 Struttura del Progetto

```
uni-scan/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── pages/         # Pagine dell'applicazione
│   │   ├── components/    # Componenti riutilizzabili
│   │   ├── lib/           # Utility e configurazioni
│   │   └── App.tsx        # Routing principale
│   └── index.html
├── server/                 # Backend Express + tRPC
│   ├── routers.ts         # Definizione procedure tRPC
│   ├── db.ts              # Query helper
│   └── services/          # Servizi (LLM, email, ecc.)
├── drizzle/               # Database schema e migrazioni
│   └── schema.ts          # Definizione tabelle
├── shared/                # Codice condiviso
├── deployment.md          # Guida di deployment
├── package.json
└── vite.config.ts
```

---

## 🔧 Comandi Disponibili

```bash
# Sviluppo
pnpm dev              # Avvia dev server (frontend + backend)
pnpm build            # Build per produzione
pnpm start            # Avvia server di produzione

# Database
pnpm db:push          # Esegui migrazioni
pnpm db:studio        # Apri interfaccia web per il database
pnpm db:generate      # Genera migrazioni da schema

# Testing
pnpm test             # Esegui test con Vitest
pnpm test:watch       # Test in modalità watch

# Linting
pnpm lint             # Verifica codice con ESLint
pnpm format           # Formatta codice con Prettier
```

---

## 🗄️ Database

### Schema Principale

L'applicazione utilizza le seguenti tabelle:

- **frameworks**: Framework didattici di valutazione
- **subjects**: Materie/discipline universitarie
- **manuals**: Manuali universitari
- **manual_evaluations**: Valutazioni dei manuali
- **users**: Utenti dell'applicazione

Vedi `drizzle/schema.ts` per i dettagli completi.

### Migrazioni

Le migrazioni sono gestite automaticamente con Drizzle ORM:

```bash
# Applicare migrazioni
pnpm db:push

# Visualizzare stato
pnpm db:studio
```

---

## 🔐 Variabili di Ambiente

### Obbligatorie

```env
DATABASE_URL=mysql://user:password@localhost:3306/uni_scan
JWT_SECRET=your-secret-key-min-32-chars
```

### Opzionali

```env
PORT=3000
NODE_ENV=development
OPENAI_API_KEY=sk-...
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
```

Vedi `deployment.md` per la lista completa.

---

## 🚀 Deployment

### Su Server Interno Zanichelli

Seguire la [Guida di Deployment](./deployment.md) che include:

- Installazione su Linux/Windows
- Configurazione database
- Setup con PM2 o Systemd
- Configurazione Nginx reverse proxy
- Docker (opzionale)

### Su Manus Cloud (Attualmente in Uso)

L'applicazione è attualmente ospitata su Manus:
- **URL**: https://uniscansys-ensvftth.manus.space
- **Database**: Gestito da Manus
- **Backup**: Contattare supporto Manus

---

## 📊 Funzionalità Dettagliate

### 1. Gestione Framework
- Crea framework didattici personalizzati
- Definisci indicatori di valutazione
- Configura pesi e metriche

### 2. Database Manuali
- Aggiungi manuali con metadati completi
- Carica PDF e documenti
- Gestisci informazioni editore/autore

### 3. Analisi Automatica
- Utilizza IA (LLM) per analizzare contenuti
- Valuta copertura framework automaticamente
- Genera report di valutazione

### 4. Confronto Manuali
- Seleziona fino a 3 manuali
- Visualizza tabella comparativa
- Esporta in HTML modificabile

### 5. Dashboard
- Visualizza statistiche generali
- Monitora analisi in corso
- Accedi a dati storici

---

## 🧪 Testing

L'applicazione include test con Vitest:

```bash
# Eseguire tutti i test
pnpm test

# Test in modalità watch
pnpm test:watch

# Test con coverage
pnpm test:coverage
```

Vedi `server/*.test.ts` per esempi di test.

---

## 🐛 Bug Report e Feature Request

### Segnalare un Bug

1. Apri una [Issue](https://github.com/sartinisergio/UNI-SCAN/issues)
2. Descrivi il problema in dettaglio
3. Includi step per riprodurre il bug
4. Allega screenshot se rilevante

### Richiedere una Feature

1. Apri una [Discussion](https://github.com/sartinisergio/UNI-SCAN/discussions)
2. Descrivi la feature desiderata
3. Spiega il caso d'uso

---

## 📝 Changelog

### v1.0.0 (12 Gennaio 2026)
- ✅ Release iniziale
- ✅ Gestione framework e manuali
- ✅ Analisi automatica con IA
- ✅ Confronto manuali con esportazione HTML
- ✅ Dashboard e statistiche
- ✅ Sistema di autenticazione

---

## 📄 Licenza

Questo progetto è licenziato sotto la [MIT License](./LICENSE).

---

## 👥 Autori

- **Sergio Sartini** - Sviluppo iniziale

---

## 🤝 Contribuire

Le contribuzioni sono benvenute! Per contribuire:

1. Fai un fork del repository
2. Crea un branch per la tua feature (`git checkout -b feature/AmazingFeature`)
3. Commit i tuoi cambiamenti (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

---

## 📞 Support

Per domande o supporto:

- **Email**: sergio.sartini@zanichelli.it
- **GitHub Issues**: https://github.com/sartinisergio/UNI-SCAN/issues
- **Documentazione**: Vedi cartella `docs/`

---

## 🎯 Roadmap

- [ ] Integrazione con più provider LLM
- [ ] Esportazione PDF con formattazione avanzata
- [ ] Grafici comparativi interattivi
- [ ] API REST pubblica
- [ ] Mobile app (React Native)
- [ ] Sincronizzazione multi-editore
- [ ] Versioning e tracking delle modifiche

---

**Ultimo aggiornamento**: 12 Gennaio 2026