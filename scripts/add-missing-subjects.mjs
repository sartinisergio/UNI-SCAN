import { drizzle } from "drizzle-orm/mysql2";
import { subjects } from "../drizzle/schema.ts";
import { eq } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const db = drizzle(DATABASE_URL);

const newSubjects = [
  { code: "macroeconomia", name: "Macroeconomia" },
  { code: "microeconomia", name: "Microeconomia" },
  { code: "matematica_bio", name: "Matematica per Biologia" },
];

async function main() {
  console.log("Adding missing subjects...");
  
  for (const subject of newSubjects) {
    try {
      // Check if already exists
      const existing = await db.select().from(subjects).where(eq(subjects.code, subject.code)).limit(1);
      
      if (existing.length > 0) {
        console.log(`Subject ${subject.code} already exists, skipping`);
        continue;
      }
      
      await db.insert(subjects).values(subject);
      console.log(`Added subject: ${subject.name}`);
    } catch (error) {
      console.error(`Error adding ${subject.code}:`, error);
    }
  }
  
  console.log("Done!");
  process.exit(0);
}

main();
