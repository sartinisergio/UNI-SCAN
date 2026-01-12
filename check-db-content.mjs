import { drizzle } from "drizzle-orm/mysql2/promise";
import mysql from "mysql2/promise";
import { frameworks } from "./drizzle/schema.ts";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const result = await db.select().from(frameworks).where({ subjectId: 1 }).limit(1);

if (result.length > 0) {
  const fw = result[0];
  const content = JSON.stringify(fw.content);
  
  console.log("Framework ID:", fw.id);
  console.log("Subject ID:", fw.subjectId);
  console.log("Version:", fw.version);
  console.log("Content length:", content.length);
  console.log("Content starts with:", content.substring(0, 100));
  console.log("Content ends with:", content.substring(content.length - 100));
  
  // Controlla se inizia con { e finisce con }
  const parsed = JSON.parse(content);
  console.log("\nFirst keys in JSON:", Object.keys(parsed).slice(0, 5));
  console.log("Last keys in JSON:", Object.keys(parsed).slice(-5));
} else {
  console.log("No framework found for subject 1");
}

await connection.end();
