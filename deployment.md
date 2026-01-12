# UNI-SCAN - Guida di Installazione e Deployment

## Indice
1. [Requisiti di Sistema](#requisiti-di-sistema)
2. [Architettura dell'Applicazione](#architettura-dellapplicazione)
3. [Installazione Locale](#installazione-locale)
4. [Configurazione del Database](#configurazione-del-database)
5. [Variabili di Ambiente](#variabili-di-ambiente)
6. [Avvio dell'Applicazione](#avvio-dellapplicazione)
7. [Deployment su Server](#deployment-su-server)
8. [Docker (Opzionale)](#docker-opzionale)
9. [Backup e Migrazione Dati](#backup-e-migrazione-dati)
10. [Troubleshooting](#troubleshooting)

---

## Requisiti di Sistema

### Minimi
- **Node.js**: v18.0.0 o superiore
- **pnpm**: v8.0.0 o superiore (package manager)
- **Database**: MySQL 8.0+, PostgreSQL 12+, o SQLite 3.0+
- **RAM**: 2GB minimo
- **Spazio disco**: 5GB minimo
- **Porta**: 3000 (configurabile)

### Consigliati per Produzione
- **Node.js**: v20 LTS
- **Database**: MySQL 8.0+ o PostgreSQL 14+
- **RAM**: 4GB+
- **Spazio disco**: 20GB+
- **Sistema operativo**: Linux (Ubuntu 20.04+ o equivalente)
- **Reverse proxy**: Nginx o Apache
- **SSL/TLS**: Certificato valido

---

## Architettura dell'Applicazione

```
UNI-SCAN
├── Frontend (React 19 + Tailwind CSS 4)
│   └── client/src/
├── Backend (Express 4 + tRPC 11)
│   └── server/
├── Database (Drizzle ORM)
│   └── drizzle/
└── Configurazione
    └── package.json, vite.config.ts, vitest.config.ts
```

**Stack Tecnologico**:
- **Frontend**: React 19, TypeScript, Tailwind CSS 4, Vite
- **Backend**: Express 4, tRPC 11, Node.js
- **Database**: Drizzle ORM (supporta MySQL, PostgreSQL, SQLite)
- **Build Tool**: Vite
- **Package Manager**: pnpm
- **Testing**: Vitest

---

## Installazione Locale

### 1. Clonare il Repository

```bash
git clone https://github.com/sartinisergio/UNI-SCAN.git
cd UNI-SCAN
```

### 2. Installare le Dipendenze

```bash
pnpm install
```

Se si verificano errori di lockfile, usare:
```bash
pnpm install --no-frozen-lockfile
```

### 3. Configurare le Variabili di Ambiente

Creare un file `.env.local` nella root del progetto:

```bash
# Database
DATABASE_URL="mysql://user:password@localhost:3306/uni_scan"

# JWT e Autenticazione
JWT_SECRET="your-super-secret-key-min-32-chars"

# OAuth (se usi Manus OAuth)
VITE_APP_ID="your-app-id"
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://portal.manus.im"

# LLM Provider (OpenAI o Manus)
OPENAI_API_KEY="sk-..."
VITE_FRONTEND_FORGE_API_KEY="your-key"

# Dropbox (opzionale, per importazione dati)
DROPBOX_APP_KEY="your-app-key"
DROPBOX_APP_SECRET="your-app-secret"

# Server
PORT=3000
NODE_ENV="development"
```

---

## Configurazione del Database

### Opzione 1: MySQL

```bash
# Creare il database
mysql -u root -p -e "CREATE DATABASE uni_scan CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Aggiornare DATABASE_URL in .env.local
DATABASE_URL="mysql://user:password@localhost:3306/uni_scan"

# Eseguire le migrazioni
pnpm db:push
```

### Opzione 2: PostgreSQL

```bash
# Creare il database
createdb uni_scan

# Aggiornare DATABASE_URL in .env.local
DATABASE_URL="postgresql://user:password@localhost:5432/uni_scan"

# Eseguire le migrazioni
pnpm db:push
```

### Opzione 3: SQLite (Sviluppo)

```bash
# DATABASE_URL in .env.local
DATABASE_URL="file:./drizzle/prod.db"

# Eseguire le migrazioni
pnpm db:push
```

### Verificare la Migrazione

```bash
# Controllare che le tabelle siano state create
pnpm db:studio  # Apre un'interfaccia web per visualizzare il database
```

---

## Variabili di Ambiente

### Obbligatorie

| Variabile | Descrizione | Esempio |
|-----------|-------------|---------|
| `DATABASE_URL` | Stringa di connessione al database | `mysql://user:pass@localhost:3306/db` |
| `JWT_SECRET` | Chiave segreta per i token JWT (min 32 caratteri) | `your-secret-key-min-32-chars` |

### Opzionali (ma Consigliate)

| Variabile | Descrizione | Default |
|-----------|-------------|---------|
| `PORT` | Porta su cui ascolta il server | `3000` |
| `NODE_ENV` | Ambiente (development/production) | `development` |
| `OPENAI_API_KEY` | Chiave API OpenAI per LLM | - |
| `VITE_APP_ID` | ID applicazione OAuth | - |
| `OAUTH_SERVER_URL` | URL server OAuth | - |

---

## Avvio dell'Applicazione

### Sviluppo

```bash
# Avvia il dev server (frontend + backend)
pnpm dev
```

L'applicazione sarà disponibile su `http://localhost:3000`

### Produzione

```bash
# Build dell'applicazione
pnpm build

# Avvia il server di produzione
pnpm start
```

---

## Deployment su Server

### Prerequisiti

- SSH accesso al server
- Node.js e pnpm installati
- Database configurato e accessibile
- Dominio e certificato SSL (consigliato)

### Procedura di Deployment

#### 1. Preparare il Server

```bash
# SSH nel server
ssh user@your-server.com

# Creare la cartella dell'applicazione
mkdir -p /var/www/uni-scan
cd /var/www/uni-scan

# Clonare il repository
git clone https://github.com/sartinisergio/UNI-SCAN.git .
```

#### 2. Installare le Dipendenze

```bash
pnpm install --prod
```

#### 3. Configurare le Variabili di Ambiente

```bash
# Creare il file .env
nano .env
```

Aggiungere le variabili necessarie (vedi sezione "Variabili di Ambiente")

#### 4. Eseguire le Migrazioni del Database

```bash
pnpm db:push
```

#### 5. Build dell'Applicazione

```bash
pnpm build
```

#### 6. Avviare il Server

**Opzione A: Manualmente**
```bash
pnpm start
```

**Opzione B: Con PM2 (Process Manager)**
```bash
# Installare PM2 globalmente
npm install -g pm2

# Avviare l'app con PM2
pm2 start "pnpm start" --name "uni-scan"

# Salvare la configurazione
pm2 save

# Avviare PM2 al boot del sistema
pm2 startup
```

**Opzione C: Con Systemd (Linux)**

Creare il file `/etc/systemd/system/uni-scan.service`:

```ini
[Unit]
Description=UNI-SCAN Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/uni-scan
Environment="NODE_ENV=production"
Environment="PORT=3000"
ExecStart=/usr/local/bin/pnpm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Quindi:
```bash
sudo systemctl daemon-reload
sudo systemctl enable uni-scan
sudo systemctl start uni-scan
```

#### 7. Configurare il Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name uni-scan.zanichelli.local;

    # Redirect HTTP a HTTPS (se SSL è configurato)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name uni-scan.zanichelli.local;

    # Certificati SSL
    ssl_certificate /etc/ssl/certs/uni-scan.crt;
    ssl_certificate_key /etc/ssl/private/uni-scan.key;

    # Proxy verso l'applicazione Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ricaricare Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Docker (Opzionale)

Se preferite usare Docker, creare un `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Installare pnpm
RUN npm install -g pnpm

# Copiare i file
COPY . .

# Installare le dipendenze
RUN pnpm install --prod

# Build dell'applicazione
RUN pnpm build

# Esporre la porta
EXPOSE 3000

# Avviare l'app
CMD ["pnpm", "start"]
```

Creare un `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: "mysql://root:password@db:3306/uni_scan"
      JWT_SECRET: "your-secret-key"
      NODE_ENV: "production"
    depends_on:
      - db

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: uni_scan
    volumes:
      - db_data:/var/lib/mysql
    ports:
      - "3306:3306"

volumes:
  db_data:
```

Avviare con Docker Compose:
```bash
docker-compose up -d
```

---

## Backup e Migrazione Dati

### Backup del Database

#### MySQL
```bash
mysqldump -u user -p uni_scan > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### PostgreSQL
```bash
pg_dump -U user uni_scan > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### SQLite
```bash
cp drizzle/prod.db drizzle/prod_backup_$(date +%Y%m%d_%H%M%S).db
```

### Ripristino del Database

#### MySQL
```bash
mysql -u user -p uni_scan < backup_20240112_120000.sql
```

#### PostgreSQL
```bash
psql -U user uni_scan < backup_20240112_120000.sql
```

#### SQLite
```bash
cp drizzle/prod_backup_20240112_120000.db drizzle/prod.db
```

### Esportare Dati da Manus verso Server Interno

1. Esportare il database da Manus (contattare il supporto Manus)
2. Convertire il formato se necessario
3. Importare nel database del server interno
4. Verificare l'integrità dei dati

---

## Troubleshooting

### Errore: "Cannot find module 'pnpm'"

```bash
npm install -g pnpm
```

### Errore: "DATABASE_URL is not defined"

Verificare che il file `.env` esista e contenga `DATABASE_URL`:
```bash
cat .env | grep DATABASE_URL
```

### Errore: "Port 3000 is already in use"

Cambiare la porta in `.env`:
```
PORT=3001
```

O killare il processo che usa la porta 3000:
```bash
# Linux/Mac
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Errore: "Connection refused" al database

Verificare:
1. Il database è in esecuzione: `systemctl status mysql` (o postgresql)
2. Le credenziali in `.env` sono corrette
3. La porta del database è corretta (default: 3306 per MySQL, 5432 per PostgreSQL)
4. Il firewall non blocca la connessione

### L'applicazione è lenta

1. Verificare l'uso della RAM: `free -h` (Linux) o Task Manager (Windows)
2. Verificare i log del server: `pm2 logs uni-scan`
3. Verificare le query del database: `pnpm db:studio`
4. Aumentare la RAM del server se necessario

### Errore: "pnpm install" fallisce

```bash
# Pulire la cache
pnpm store prune

# Reinstallare
pnpm install --no-frozen-lockfile
```

---

## Support e Contatti

Per domande o problemi:
- Repository GitHub: https://github.com/sartinisergio/UNI-SCAN
- Issues: https://github.com/sartinisergio/UNI-SCAN/issues

---

## Changelog

### v1.0.0 (12 Gennaio 2026)
- ✅ Release iniziale
- ✅ Esportazione HTML confronto manuali
- ✅ Bug fix data access
- ✅ pnpm lockfile aggiornato