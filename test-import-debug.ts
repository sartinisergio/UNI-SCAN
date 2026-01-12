// Temporary file to test the logic
const fileName = "framework_Matematica_Bio.json";

// Step 1: Extract subjectCode (from dropbox.ts)
const subjectCode = fileName
  .replace(".json", "")
  .replace(/^framework_/i, "")
  .toLowerCase()
  .replace(/ /g, "_");

console.log("Step 1 - Extracted subjectCode:", subjectCode);

// Step 2: Try mapping
const subjectMapping: Record<string, string> = {
  "analisi_matematica_1": "analisi_1",
  "analisi_matematica_2": "analisi_2",
  "analisi_1": "analisi_1",
  "analisi_2": "analisi_2",
  "fisica_generale_1": "fisica_1",
  "fisica_generale_2": "fisica_2",
  "fisica_1": "fisica_1",
  "fisica_2": "fisica_2",
  "fisica_generale": "fisica_generale",
  "matematica_bioscienze": "matematica_per_biologia",
  "matematica_per_bioscienze": "matematica_per_biologia",
  "matematica_bio": "matematica_per_biologia",
  "matematica_per_biologia": "matematica_per_biologia",
  "chimica_generale": "chimica_generale",
  "chimica_organica": "chimica_organica",
  "economia_politica": "economia_politica",
  "microeconomia": "microeconomia",
  "macroeconomia": "macroeconomia",
  "istologia": "istologia",
};

let mappedCode = subjectMapping[subjectCode];
console.log("Step 2 - Mapped code:", mappedCode);

if (!mappedCode) {
  mappedCode = subjectCode;
  console.log("Step 3 - No mapping, using direct:", mappedCode);
}

// Step 3: Check against database codes
const dbCodes = [
  "analisi_1",
  "analisi_2",
  "fisica_1",
  "fisica_2",
  "fisica_generale",
  "chimica_generale",
  "chimica_organica",
  "economia_politica",
  "istologia",
  "macroeconomia",
  "microeconomia",
  "matematica_per_biologia",
];

const found = dbCodes.find((code) => code.toLowerCase() === mappedCode);
console.log("Step 4 - Found in database:", found);

if (!found) {
  const normalizedCode = mappedCode.replace(/_/g, "");
  const foundNormalized = dbCodes.find(
    (code) => code.toLowerCase().replace(/_/g, "") === normalizedCode
  );
  console.log("Step 5 - Found with normalized:", foundNormalized);
}
