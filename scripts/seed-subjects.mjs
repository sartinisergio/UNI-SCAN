/**
 * Seed script per inizializzare le materie nel database
 * Esegui con: node scripts/seed-subjects.mjs
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const SUBJECTS = [
  { code: "analisi_1", name: "Analisi 1", description: "Analisi matematica I - Calcolo differenziale e integrale" },
  { code: "analisi_2", name: "Analisi 2", description: "Analisi matematica II - Funzioni di più variabili" },
  { code: "fisica_1", name: "Fisica 1", description: "Fisica generale I - Meccanica e termodinamica" },
  { code: "fisica_2", name: "Fisica 2", description: "Fisica generale II - Elettromagnetismo e ottica" },
  { code: "fisica_generale", name: "Fisica Generale", description: "Corso unificato di fisica generale" },
  { code: "chimica_generale", name: "Chimica Generale", description: "Chimica generale e inorganica" },
  { code: "chimica_organica", name: "Chimica Organica", description: "Chimica organica - Struttura e reattività" },
  { code: "economia_politica", name: "Economia Politica", description: "Principi di economia politica" },
  { code: "istologia", name: "Istologia", description: "Istologia e anatomia microscopica" },
];

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('DATABASE_URL non configurato');
    process.exit(1);
  }

  const connection = await mysql.createConnection(databaseUrl);
  const db = drizzle(connection);

  console.log('Inizializzazione materie...');

  for (const subject of SUBJECTS) {
    try {
      await connection.execute(
        `INSERT INTO subjects (code, name, description, isActive, createdAt, updatedAt) 
         VALUES (?, ?, ?, true, NOW(), NOW())
         ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)`,
        [subject.code, subject.name, subject.description]
      );
      console.log(`✓ ${subject.name}`);
    } catch (error) {
      console.error(`✗ ${subject.name}:`, error.message);
    }
  }

  await connection.end();
  console.log('\nSeed completato!');
}

seed().catch(console.error);
