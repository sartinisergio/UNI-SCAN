import * as db from "../server/db";

// This is the correct structure from Gestione Dati with 15 modules and key_concepts
const correctChemistryFramework = {
  "content": {
    "program_profiles": [
      {
        "name": "L-2 Biotecnologie",
        "priority_modules": "Cruciale una comprensione profonda delle soluzioni, degli equilibri acido-base e della cinetica (in ottica enzimatica). Fondamentale la chimica del coordinamento per le applicazioni bioinorganiche. Meno rilevante la parte approfondita sui materiali solidi e metallurgia."
      },
      {
        "name": "L-7-8-9 Ingegneria",
        "priority_modules": "Focus assoluto su stechiometria applicativa, termodinamica, elettrochimica (batterie/corrosione) e stati della materia (scienza dei materiali). La chimica descrittiva e nucleare sono marginali, salvo per ingegneria chimica o energetica."
      },
      {
        "name": "L-13 Scienze biologiche",
        "priority_modules": "Cruciale la padronanza di soluzioni, pH, tamponi e legami chimici (interazioni molecolari). Fondamentale la cinetica e la termodinamica di base per comprendere i processi biologici. Marginale la chimica inorganica descrittiva dettagliata e la chimica nucleare."
      },
      {
        "name": "L-25/L-26 Agraria e Alimentare",
        "priority_modules": "Fondamentale la chimica delle soluzioni, acidi/basi e le proprietà colligative. Importante la chimica organica descrittiva degli elementi nutrienti (N, P, K) e la cinetica per la conservazione degli alimenti. Meno focus sulla struttura atomica quantistica avanzata."
      },
      {
        "name": "L-27 Scienze chimiche",
        "priority_modules": "Richiede una copertura esaustiva e approfondita di tutti i moduli senza esclusioni. Cruciale il rigore formale in termodinamica, quantistica (struttura atomica/legame) e chimica inorganica descrittiva e di coordinazione."
      },
      {
        "name": "L-29/LM-13 Farmacia e CTF",
        "priority_modules": "Focus critico su stechiometria (dosaggi), soluzioni, equilibri e acidi-basi. Molto importante la struttura atomica e il legame per la futura chimica farmaceutica. La parte inorganica descrittiva deve concentrarsi sugli elementi di interesse biologico e tossicologico."
      },
      {
        "name": "L-32/L-34 Scienze Naturali e Geologia",
        "priority_modules": "Cruciale la chimica inorganica descrittiva (mineralogia), gli stati della materia (fasi solide) e la termodinamica geochimica. Fondamentale la chimica nucleare per le datazioni radiometriche. Meno rilevante la cinetica complessa o l'elettrochimica avanzata."
      }
    ],
    "syllabus_modules": [
      {
        "core_contents": "Analisi approfondita delle particelle subatomiche, definizione di numero atomico, massa e isotopia. Studio degli spettri atomici, evoluzione dei modelli atomici, configurazioni elettroniche con focus sui principi di Pauli, Aufbau e Hund.",
        "key_concepts": [
          "Configurazioni elettroniche",
          "Principi di Aufbau, Pauli, Hund",
          "Particelle subatomiche",
          "Numero atomico e massa",
          "Evoluzione modelli atomici",
          "Spettri atomici",
          "Isotopia e isotopi",
          "Orbitali atomici",
          "Livelli energetici",
          "Quantizzazione dell'energia"
        ],
        "name": "1. Struttura dell'atomo"
      },
      {
        "core_contents": "Organizzazione strutturale della tavola periodica. Analisi dei trend periodici riguardanti raggio atomico e ionico, energia di ionizzazione, affinità elettronica ed elettronegatività.",
        "key_concepts": [
          "Organizzazione strutturale Tavola Periodica",
          "Trend periodici",
          "Raggio atomico",
          "Raggio ionico",
          "Energia di ionizzazione",
          "Prima energia di ionizzazione",
          "Affinità elettronica",
          "Elettronegatività",
          "Variazione lungo periodo",
          "Variazione lungo gruppo",
          "Configurazione elettronica e periodicità",
          "Metalli e non-metalli",
          "Proprietà anfotere"
        ],
        "name": "2. Tavola periodica e proprietà periodiche"
      },
      {
        "core_contents": "Studio comparato dei legami ionico, covalente e metallico. Applicazione della teoria VSEPR per la geometria molecolare, concetti di ibridazione e teoria degli orbitali molecolari. Approfondimento su polarità, momento dipolare e forze intermolecolari.",
        "key_concepts": [
          "Tipi di Legame Chimico",
          "Legame Covalente",
          "Legame Ionico",
          "Legame Metallico",
          "Teoria VSEPR",
          "Geometria Molecolare",
          "Ibridazione degli Orbitali",
          "Teoria degli Orbitali Molecolari",
          "Polarità del Legame",
          "Momento Dipolare",
          "Forze Intermolecolari",
          "Studio Comparato Legami"
        ],
        "name": "3. Legame chimico"
      },
      {
        "core_contents": "Concetti fondamentali di mole e massa molare (Numero di Avogadro). Bilanciamento reazioni, identificazione del reagente limitante, calcolo delle rese (teorica e percentuale) e conversioni tra unità di concentrazione.",
        "key_concepts": [
          "Concetto di mole",
          "Massa molare",
          "Numero di Avogadro",
          "Bilanciamento reazioni chimiche",
          "Stechiometria reazione",
          "Reagente limitante",
          "Reagente in eccesso",
          "Calcolo resa teorica",
          "Calcolo resa percentuale",
          "Concentrazione soluzioni",
          "Unità di concentrazione",
          "Conversione unità"
        ],
        "name": "4. Stechiometria"
      },
      {
        "core_contents": "Leggi dei gas ideali e comportamento dei gas reali. Studio dei liquidi (tensione superficiale), classificazione dei solidi (cristallini vs amorfi), lettura dei diagrammi di fase e termodinamica dei passaggi di stato.",
        "key_concepts": [
          "Leggi Gas Ideali",
          "Comportamento Gas Reali",
          "Termodinamica Passaggi Stato",
          "Diagrammi di Fase",
          "Stato Liquido Proprietà",
          "Tensione Superficiale",
          "Classificazione Solidi",
          "Solidi Cristallini Amorfi"
        ],
        "name": "5. Stati della materia"
      },
      {
        "core_contents": "Definizione di sistemi e funzioni di stato. Applicazioni di calorimetria, calcolo dell'entalpia di reazione, formazione e legame. Applicazione della Legge di Hess e relazione tra energia interna e lavoro.",
        "key_concepts": [
          "Entalpia di reazione",
          "Legge di Hess",
          "Funzioni di stato",
          "Calcolo entalpia formazione",
          "Definizione sistemi termodinamici",
          "Calorimetria applicazioni",
          "Energia interna",
          "Lavoro termodinamico",
          "Entalpia di legame"
        ],
        "name": "6. Termochimica"
      },
      {
        "core_contents": "Concetti di entropia ed energia libera di Gibbs per la previsione della spontaneità e dell'equilibrio. Definizione di potenziale chimico e relazioni matematiche tra ΔG, ΔH e ΔS.",
        "key_concepts": [
          "Energia libera di Gibbs",
          "Entropia termodinamica",
          "Criteri di spontaneità",
          "Condizioni di equilibrio",
          "Potenziale chimico",
          "Relazione ΔG, ΔH, ΔS",
          "Variazione di entalpia (ΔH)",
          "Termodinamica chimica"
        ],
        "name": "7. Termodinamica chimica"
      },
      {
        "core_contents": "Analisi della velocità di reazione, definizione dell'ordine di reazione e meccanismi. Studio della catalisi, energia di attivazione e teoria dello stato di transizione.",
        "key_concepts": [
          "Velocità di reazione",
          "Ordine di reazione",
          "Legge cinetica",
          "Costante cinetica",
          "Energia di attivazione",
          "Meccanismi di reazione",
          "Catalisi omogenea ed eterogenea",
          "Reazioni di primo ordine",
          "Reazioni di secondo ordine",
          "Teoria dello stato di transizione",
          "Molecularità della reazione",
          "Fattori che influenzano la velocità",
          "Equazione di Arrhenius"
        ],
        "name": "8. Cinetica chimica"
      },
      {
        "core_contents": "Costanti di equilibrio Kc e Kp, applicazione del Principio di Le Châtelier. Studio degli equilibri in fase gassosa e in soluzione, con focus sulle relazioni termodinamiche sottostanti.",
        "key_concepts": [
          "Equilibrio chimico",
          "Costante di equilibrio (Kc)",
          "Costante di equilibrio (Kp)",
          "Principio di Le Châtelier",
          "Equilibri in fase gassosa",
          "Equilibri in soluzione acquosa",
          "Relazioni termodinamiche",
          "Quoziente di reazione (Q)",
          "Variazione di pressione/volume",
          "Effetto della temperatura",
          "Energia libera di Gibbs",
          "Gradi di avanzamento"
        ],
        "name": "9. Equilibrio chimico"
      },
      {
        "core_contents": "Classificazione delle soluzioni, unità di concentrazione e calcoli sulle diluizioni. Studio del prodotto di solubilità (Ksp) e analisi dettagliata delle proprietà colligative inclusa la pressione osmotica.",
        "key_concepts": [
          "Classificazione delle soluzioni",
          "Unità di concentrazione",
          "Calcoli sulle diluizioni",
          "Proprietà colligative",
          "Prodotto di solubilità (Ksp)",
          "Solubilità ionica",
          "Pressione osmotica",
          "Abbassamento crioscopico",
          "Innalzamento ebullioscopico",
          "Tensione di vapore",
          "Fattore di van't Hoff"
        ],
        "name": "10. Chimica delle soluzioni"
      },
      {
        "core_contents": "Confronto tra le teorie di Arrhenius, Brønsted-Lowry e Lewis. Calcolo del pH per acidi/basi forti e deboli (Ka, Kb, Kw), funzionamento delle soluzioni tampone, curve di titolazione e uso degli indicatori.",
        "key_concepts": [
          "Teorie acido-base (Arrhenius, Brønsted-Lowry, Lewis)",
          "Calcolo del pH (Acidi e basi forti)",
          "Costanti di equilibrio acido-base (Ka, Kb, Kw)",
          "Calcolo del pH (Acidi e basi deboli)",
          "Funzionamento delle soluzioni tampone",
          "Meccanismo d'azione dei tamponi",
          "Curve di titolazione acido-base",
          "Punto di equivalenza e semiequivalenza",
          "Uso e selezione degli indicatori",
          "Equilibri ionici in soluzione acquosa"
        ],
        "name": "11. Acidi e basi"
      },
      {
        "core_contents": "Bilanciamento redox, funzionamento delle celle galvaniche e potenziali standard. Applicazione dell'equazione di Nernst, processi di elettrolisi, tecnologie delle batterie/celle a combustibile e fenomeni di corrosione.",
        "key_concepts": [
          "Bilanciamento reazioni redox",
          "Celle galvaniche e funzionamento",
          "Potenziali standard di riduzione",
          "Equazione di Nernst",
          "Processi di elettrolisi",
          "Tecnologie delle batterie",
          "Celle a combustibile",
          "Fenomeni di corrosione"
        ],
        "name": "12. Elettrochimica"
      },
      {
        "core_contents": "Stabilità del nucleo, difetto di massa, tipologie di decadimento radioattivo e serie. Differenze tra fissione e fusione, cenni di dosimetria e applicazioni pratiche.",
        "key_concepts": [
          "Stabilità nucleare",
          "Difetto di massa",
          "Energia di legame nucleare",
          "Decadimento radioattivo",
          "Tipologie di decadimento",
          "Serie radioattive",
          "Reazioni di fissione nucleare",
          "Reazioni di fusione nucleare",
          "Dosimetria delle radiazioni",
          "Applicazioni della radioattività"
        ],
        "name": "13. Chimica nucleare"
      },
      {
        "core_contents": "Sistematica degli elementi chimici dai gruppi principali (1-2, 13-18) ai metalli di transizione, lantanidi e attinidi. Focus su idrogeno, composti binari e leghe.",
        "key_concepts": [
          "Sistematica elementi chimici",
          "Elementi del Gruppo 1 (Alcalini)",
          "Elementi del Gruppo 2 (Alcalino-terrosi)",
          "Elementi del Gruppo 13-18",
          "Metalli di transizione",
          "Lantanidi e Attinidi",
          "Proprietà chimiche per gruppo",
          "Composti binari",
          "Leghe metalliche",
          "Idrogeno e composti"
        ],
        "name": "14. Chimica descrittiva inorganica"
      },
      {
        "core_contents": "Introduzione ai concetti fondamentali della chimica organica: ibridazione del carbonio, nomenclatura IUPAC, tipi di isomeria. Studio dei principali gruppi funzionali e loro reattività.",
        "key_concepts": [
          "Ibridazione del carbonio",
          "Nomenclatura IUPAC",
          "Isomeria strutturale",
          "Stereoisomeria",
          "Gruppi funzionali",
          "Alcani, alcheni, alchini",
          "Alcoli e eteri",
          "Aldeidi e chetoni",
          "Acidi carbossilici",
          "Esteri e ammidi"
        ],
        "name": "15. Introduzione alla chimica organica"
      }
    ]
  }
};

async function updateChemistryFramework() {
  try {
    console.log("Updating Chemistry framework with correct structure...");
    
    await db.updateFramework(60001, {
      content: correctChemistryFramework
    });
    
    console.log("✅ Framework updated successfully!");
    console.log("Now has 15 modules with key_concepts");
    
  } catch (error) {
    console.error("Error updating framework:", error);
  }
}

updateChemistryFramework();
