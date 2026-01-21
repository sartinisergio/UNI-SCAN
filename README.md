# UNI-SCAN

**Sistema di Analisi e Confronto di Programmi e Manuali Universitari**

UNI-SCAN è un'applicazione web che permette di analizzare e confrontare i programmi universitari con i manuali di testo, identificando gap di copertura e allineamenti tra il contenuto teorico atteso e quello effettivamente trattato nei testi.

---

## 🎯 Funzionalità Principali

### 1. **Gestione Materie**
- ✅ Creazione di nuove materie con codice, nome e descrizione
- ✅ Eliminazione di materie dal sistema
- ✅ Visualizzazione dinamica di tutte le materie disponibili

### 2. **Gestione Framework di Valutazione**
- ✅ Caricamento di framework ideali (struttura teorica)
- ✅ Gestione di framework reali (modulati su programmi effettivi)
- ✅ Supporto per multiple classi di laurea (L-XX, LM-XX)
- ✅ Criteri di valutazione personalizzabili

### 3. **Database Manuali**
- ✅ Caricamento e gestione di manuali per editore
- ✅ Supporto per multiple editori (Zanichelli, Edises, Pearson, ecc.)
- ✅ Indicizzazione e ricerca veloce

### 4. **Analisi Situazionale**
- ✅ Analisi automatica di programmi universitari
- ✅ Identificazione di gap di copertura
- ✅ Valutazione dell'allineamento tra programmi e manuali
- ✅ Generazione di rapporti dettagliati

### 5. **Storico Analisi**
- ✅ Tracciamento di tutte le analisi effettuate
- ✅ Visualizzazione storica dei risultati
- ✅ Esportazione dati

---

## 🛠️ Stack Tecnologico

### Frontend
- **React 19** - UI framework
- **Tailwind CSS 4** - Styling
- **TypeScript** - Type safety
- **tRPC** - End-to-end type-safe APIs
- **Shadcn/UI** - Component library
- **Wouter** - Lightweight router

### Backend
- **Express 4** - Web server
- **Node.js** - Runtime
- **tRPC 11** - RPC framework
- **Drizzle ORM** - Database ORM
- **MySQL/TiDB** - Database

### Services
- **Manus OAuth** - Authentication
- **Manus LLM** - AI-powered analysis
- **AWS S3** - File storage
- **PDF.js** - PDF processing

---

## 📋 Struttura del Progetto

```
uni-scan/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── lib/           # Utilities (tRPC client, etc.)
│   │   └── App.tsx        # Main app component
│   └── public/            # Static assets
├── server/                 # Backend Express + tRPC
│   ├── _core/             # Framework code (OAuth, tRPC setup, etc.)
│   ├── services/          # Business logic (analysis, evaluation, etc.)
│   ├── routers.ts         # tRPC procedures
│   └── db.ts              # Database queries
├── drizzle/               # Database schema & migrations
│   ├── schema.ts          # Table definitions
│   └── migrations/        # SQL migrations
├── shared/                # Shared types & constants
├── storage/               # S3 helpers
└── package.json           # Dependencies
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 22+**
- **pnpm 10+**
- **MySQL/TiDB database**
- **Manus account** (for OAuth and services)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/sartinisergio/UNI-SCAN.git
cd UNI-SCAN
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**
Create a `.env.local` file with:
```
DATABASE_URL=mysql://user:password@localhost:3306/uni_scan
JWT_SECRET=your-secret-key
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
# ... other env vars
```

4. **Run database migrations**
```bash
pnpm db:push
```

5. **Start development server**
```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

---

## 📚 Key Workflows

### Creating a New Subject

1. Go to **Gestione Dati** (Data Management)
2. Click **"Nuova Materia"** (New Subject)
3. Fill in:
   - **Codice Materia** (Subject Code, e.g., "biochimica")
   - **Nome Materia** (Subject Name, e.g., "Biochimica")
   - **Descrizione** (Description, optional)
4. Click **"Crea Materia"** (Create Subject)
5. The new subject appears in the dropdown

### Creating a Framework

1. Create an ideal framework (JSON) using the template
2. Pass it to CoreX with university programs
3. CoreX produces a real framework
4. Upload the real framework in **Gestione Dati**

### Running an Analysis

1. Select a subject
2. Click **"Nuova Analisi"** (New Analysis)
3. Upload a university program (PDF)
4. Select evaluation framework
5. System analyzes and generates report

---

## 🗄️ Database Schema

### Main Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts and roles |
| `subjects` | University subjects/courses |
| `frameworks` | Evaluation frameworks (ideal & real) |
| `manuals` | Textbook references |
| `analyses` | Analysis results |
| `manual_evaluations` | Manual evaluation scores |

---

## 🔐 Authentication

UNI-SCAN uses **Manus OAuth** for authentication:
- Users login via Manus portal
- Session stored in secure HTTP-only cookie
- Admin role required for management features
- Protected procedures via `protectedProcedure` and `adminProcedure`

---

## 🧪 Testing

Run tests with:
```bash
pnpm test
```

Tests are located in `*.test.ts` files throughout the project.

---

## 📦 Build & Deploy

### Build for production
```bash
pnpm build
```

### Start production server
```bash
pnpm start
```

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Write/update tests
4. Commit: `git commit -m "Add feature description"`
5. Push: `git push origin feature/your-feature`
6. Create a Pull Request

---

## 📝 Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow ESLint configuration
- Format with Prettier: `pnpm format`

### Database Changes
1. Update schema in `drizzle/schema.ts`
2. Run `pnpm db:push` to generate migrations
3. Test migrations locally
4. Commit schema and migrations

### Adding Features
1. Create database helpers in `server/db.ts`
2. Add tRPC procedures in `server/routers.ts`
3. Create UI components in `client/src/pages/` or `client/src/components/`
4. Wire components with tRPC hooks
5. Write tests in `*.test.ts` files

---

## 🐛 Troubleshooting

### Database Connection Error
- Check `DATABASE_URL` in `.env.local`
- Verify database is running
- Check credentials

### OAuth Login Fails
- Verify `VITE_APP_ID` and `OAUTH_SERVER_URL`
- Check Manus account settings
- Clear browser cookies

### Build Errors
- Run `pnpm install` to ensure dependencies are correct
- Run `pnpm check` to check TypeScript
- Clear `.next` and `dist` directories

---

## 📞 Support

For issues or questions:
1. Check existing GitHub issues
2. Create a new issue with detailed description
3. Include error messages and steps to reproduce

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- Built with React, Tailwind CSS, and tRPC
- Powered by Manus platform
- Uses Drizzle ORM for database management

---

**Last Updated:** January 2026  
**Version:** 1.0.0
