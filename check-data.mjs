import mysql from 'mysql2/promise';

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const [rows] = await conn.query('SELECT technicalAnalysis FROM analyses WHERE id = 1');
  const data = rows[0].technicalAnalysis;
  console.log('Keys:', Object.keys(data));
  console.log('Has analisi_moduli:', !!data.analisi_moduli);
  console.log('Has copertura_moduli:', !!data.copertura_moduli);
  if (data.analisi_moduli) console.log('analisi_moduli length:', data.analisi_moduli.length);
  if (data.copertura_moduli) console.log('copertura_moduli sample:', JSON.stringify(data.copertura_moduli[0], null, 2));
  await conn.end();
}
main().catch(console.error);
