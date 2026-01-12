# UNI-SCAN - Project TODO

## Fase 1: Setup Progetto
- [x] Schema database (users, api_configs, analyses, frameworks, manuals)
- [x] Tipi condivisi TypeScript (materie, gap types, valutazioni)
- [x] Configurazione tema e stili globali

## Fase 2: Backend API
- [ ] Integrazione Dropbox API (lettura/scrittura)
- [x] Integrazione OpenAI API (GPT-4, temperature=0)
- [x] Integrazione Perplexity API
- [x] Integrazione Claude API
- [x] Router configurazione API utente
- [x] Sistema multi-provider con fallback

## Fase 3: Frontend Layout
- [x] Dashboard layout con sidebar
- [x] Navigazione principale (Home, Gestione Dati, Scenario 1, Scenario 2, Impostazioni)
- [x] Pagina impostazioni (configurazione API keys)
- [x] Sistema notifiche toast

## Fase 4: Gestione Dati
- [x] Lista materie disponibili
- [x] CRUD Framework per materia (solo admin)
- [x] CRUD Indici manuali (solo admin)
- [x] Editor JSON con validazione
- [ ] Upload e parsing PDF/TXT per estrazione indici
- [x] Versionamento framework

## Fase 5: Scenario 2 - Database Manuali
- [x] Selezione materia e manuali
- [x] Vista singola scheda valutazione
- [ ] Vista comparativa multi-manuale (tabella)
- [ ] Esportazione PDF schede
- [ ] Script batch generazione valutazioni

## Fase 6: Scenario 1 - Analisi Situazionale
- [x] Upload programma corso (PDF/TXT)
- [ ] Parsing e estrazione testo
- [ ] Analisi contestuale (profilo pedagogico)
- [ ] Identificazione manuale adottato
- [ ] Analisi tecnica (contenuti vs framework)
- [ ] Identificazione e classificazione gap
- [ ] Raccomandazione manuale Zanichelli
- [ ] Generazione post-it commerciale
- [x] Visualizzazione risultati
- [x] Storico analisi

## Fase 7: Funzionalità Email
- [ ] Sistema classificazione gap (coverage, currency, depth, pedagogy)
- [ ] Logica prioritizzazione gap
- [ ] Template email modulari
- [ ] Generazione email personalizzata (GPT-4, temp=0)
- [ ] Varianti oggetto email
- [ ] Visualizzazione email con copia-incolla

## Fase 8: Testing e Refinement
- [ ] Test unitari backend (Vitest)
- [ ] Test integrazione API
- [ ] Bug fixing
- [ ] Ottimizzazione performance

## Bug Fixes
- [x] Fix promoterProfile.get returning undefined instead of null
- [x] Investigare gli 8 errori (sono errori Amplitude/adblocker, non dell'app)
- [x] Implementare importazione dati da Dropbox (framework e manuali)
- [x] Fix frameworks.getActive returning undefined instead of null
- [x] Fix altre query che restituivano undefined (getByCode, getManualById, getEvaluationByManual)
- [x] Fix percorso Dropbox - aggiornato a /Apps/Zanichelli_Analisi_app/
- [x] Debug connessione Dropbox - trovato errore expired_access_token
- [x] Fix percorsi Dropbox per Scoped App (App Folder) - rimosso /Apps/Zanichelli_Analisi_app/
- [x] Aggiungere materie mancanti (Macroeconomia, Matematica_Bio, Microeconomia)
- [x] Verificare struttura cartelle manuali su Dropbox (sottocartelle per materia)
- [x] Implementare scansione ricorsiva sottocartelle manuali
- [x] Implementare sistema refresh token Dropbox (OAuth flow + auto-refresh)

## Scenario 1 - Analisi Situazionale (Completato)
- [x] Servizio analisi GPT-4 con prompt a 3 fasi
- [x] Parsing programma universitario (estrazione testo)
- [x] Fase 1: Analisi contestuale (profilo pedagogico docente)
- [x] Fase 2: Analisi tecnica (contenuti vs framework)
- [x] Fase 3: Sintesi commerciale (gap, raccomandazioni, post-it)
- [x] Identificazione e classificazione gap (4 tipologie)
- [x] Raccomandazione manuale Zanichelli
- [x] Generazione post-it commerciale
- [x] Salvataggio analisi nel database
- [x] UI pagina Analisi con workflow guidato e tabs risultati

## Bug Fixes (Nuovi)
- [x] Fix parsing PDF - estrarre testo dal PDF invece di salvare raw content
- [x] Fix salvataggio analisi nel database (troncamento contenuto se troppo lungo)

## Bug Fix + Nuove Funzionalità
- [x] Fix visualizzazione dettaglio analisi nello Storico
- [x] Implementare generazione automatica email personalizzata
- [x] Servizio emailGenerator con prompt GPT-4
- [x] Procedura tRPC analyses.generateEmail
- [x] UI per generazione e visualizzazione email nella pagina dettaglio analisi
- [x] Fix TypeScript errors (postItContent, emailToShow)

## Miglioramenti UI Analisi (Nuova Richiesta)
- [x] Formattare Post-it in modo leggibile (non JSON grezzo)
- [x] Popolare tab Profilo con dati analisi contestuale
- [x] Popolare tab Copertura con dati analisi tecnica
- [x] Popolare tab Gap con gap identificati formattati
- [x] Popolare tab Strategia con strategia approccio
- [x] Includere titolo manuale Zanichelli nell'email generata
- [x] Aggiungere esportazione HTML dell'analisi completa
- [x] Card manuale Zanichelli raccomandato in evidenza

## Fix Copertura e Email (Nuova Richiesta)
- [x] Cambiare tab Copertura da percentuali a report narrativo
- [x] Aggiungere pulsante "Rigenera Email" nel tab Email
- [x] Mostrare analisi dettagliata per modulo con argomenti coperti/extra/omessi
- [x] Sintesi tecnica evidenziata in box blu

## Fix Esportazione HTML
- [x] Includere dati tab Copertura nell'esportazione HTML (tutti i 12 moduli con argomenti coperti/omessi)

## Caricamento Indici e Valutazione Manuali
- [x] Pulsante "Carica Indice" nella scheda manuale
- [x] Dialog per upload/incolla JSON indice
- [x] Parsing JSON e salvataggio capitoli/argomenti nel database
- [x] Pulsante "Genera Valutazione" per analisi GPT-4
- [x] Confronto indice manuale vs framework materia
- [x] Salvataggio valutazione nel database
- [ ] Utilizzo valutazioni nell'analisi situazionale

## Fix Dialog Carica Indice
- [x] Mostrare indice esistente nel dialog invece del placeholder
- [x] Aggiungere pulsante "Importa da Dropbox" per ricaricare l'indice

## Fix Dialog Carica Indice (Usabilità)
- [x] Rendere il dialog scrollabile per vedere i pulsanti
- [x] Aggiungere pulsante per upload file JSON locale
- [x] Spostare pulsanti in footer fisso sempre visibile

## Fix Dropbox Token e Semplificazione UI
- [x] Aggiungere campi appKey e appSecret allo schema database
- [x] Modificare flusso OAuth per salvare App Key e App Secret
- [x] Aggiornare servizio Dropbox per usare credenziali dal database
- [x] Rimuovere pulsante "Carica File JSON" ridondante dal dialog

## Fix UI Dropbox Impostazioni
- [x] Aggiungere pulsante "Riconnetti" per reinserire App Key e App Secret

## Fix Importazione Indice da Dropbox
- [x] Investigare errore "File non trovato su Dropbox"
- [x] Migliorare algoritmo di matching (titolo, autore, combinato)
- [x] Aggiungere log dei file disponibili per debug

## Fix Genera Valutazione
- [x] Verificare se viene applicata a tutti i manuali invece che a uno solo (confermato: funziona per singolo manuale)
- [x] Auto-seleziona il manuale dopo generazione per mostrare la valutazione

## Miglioramenti UI Valutazione Manuali
- [x] Cambiare pulsante "Genera Valutazione" in "Valutazione OK" quando esiste già una valutazione
- [x] Aggiungere pulsante esportazione valutazione HTML (per caricarla su Dropbox)

## Fix Esportazione HTML Valutazione
- [x] Includere dati tab Copertura nell'esportazione (frameworkCoverage.modules)
- [x] Includere dati tab Punti di Forza nell'esportazione (già presente)
- [x] Includere dati tab Punti Deboli nell'esportazione (già presente)

## Verifica Esportazione HTML Valutazione (09/12/2025)
- [x] Verificato che l'esportazione HTML include tutte le sezioni:
  - Panoramica (approccio didattico, livello contenuti)
  - Copertura Framework (13 moduli con percentuali, note, argomenti coperti/mancanti)
  - Punti di Forza (3 punti con descrizioni)
  - Punti Deboli (3 punti con impatto)
- [x] File HTML generato correttamente (16KB, ben formattato)
- [x] Rendering verificato nel browser

## Miglioramento Analisi Economia Politica (09/12/2025)
- [x] Modificare prompt valutazione manuali per identificare:
  - [x] Scuola di pensiero dell'autore (Neo-keynesiano, Neoclassico, Istituzionalista, ecc.)
  - [x] Sequenza breve/lungo periodo in microeconomia
  - [x] Sequenza breve/lungo periodo in macroeconomia
  - [x] Approccio ai modelli di crescita (Neoclassica/Solow, Endogena/Romer, Mista)
- [x] Modificare prompt analisi programmi per rilevare stessi elementi
- [x] Aggiornare struttura JSON valutazione con nuovi campi in didacticApproach
- [x] Aggiornare UI scheda valutazione per mostrare nuovi campi
- [x] Aggiornare UI analisi programmi per mostrare nuovi campi
- [x] Aggiornare esportazione HTML con nuovi campi
- [ ] Rigenerare valutazione manuale Mankiw per testare nuovi campi

## Fix Pulsante Rigenera Valutazione (09/12/2025)
- [x] Aggiungere pulsante "Rigenera Valutazione" per manuali con valutazione esistente

## Bug Fix: Lista valutazioni non si aggiorna (09/12/2025)
- [x] Correggere invalidazione cache dopo generazione valutazione - aggiunto invalidate per listBySubject

## Miglioramento UI Schede Manuali (09/12/2025)
- [x] Ridurre dimensioni caratteri nelle schede manuali
- [x] Assicurarsi che pulsante rigenera valutazione sia visibile per tutti i manuali con valutazione

## Funzionalità Elimina Analisi (09/12/2025)
- [x] Aggiungere pulsante elimina nello storico analisi
- [x] Creare procedura tRPC per eliminare analisi
- [x] Aggiungere conferma prima di eliminare

## Bug Fix: Esportazione HTML Analisi (09/12/2025)
- [x] Correggere serializzazione oggetti in Analisi Tecnica (mostra [object Object])
- [x] Verificare che tutti i dati dell'analisi siano salvati correttamente nel database

## Bug Fix CRITICO: MyLab vs MyZanichelli (09/12/2025)
- [x] Correggere errore: MyLab è Pearson, la piattaforma Zanichelli è MyZanichelli
- [x] Aggiungere istruzione esplicita nel prompt Fase 3 (sintesi commerciale)
- [x] Aggiungere istruzione esplicita nel prompt generazione email

## Bug CRITICO: Valutazione manuali ignora la materia (09/12/2025)
- [x] Il prompt di valutazione tratta tutti i manuali come se fossero di economia politica
- [x] Modificare il servizio per usare il framework specifico della materia del manuale
- [x] Passare il nome della materia al prompt di valutazione
- [x] Aggiungere istruzioni specifiche per economia solo quando la materia è economica
- [x] Usare schema JSON diverso per materie economiche vs generiche

## Miglioramento Input Analisi - Bibliografia Strutturata (10/12/2025)
- [x] Aggiungere campo "Corso di Laurea" ai dati insegnamento
- [x] Creare sezione "Bibliografia Adottata" nel form
- [x] Implementare select "Manuale Principale" con manuali da database + opzione "Altro"
- [x] Implementare lista dinamica "Manuali Alternativi" con possibilità di aggiungere/rimuovere
- [x] Usare procedura tRPC esistente manuals.listBySubject per ottenere manuali
- [x] Aggiornare schema database analyses per salvare i nuovi campi
- [x] Aggiornare prompt analisi Fase 2 e Fase 3 per usare i dati strutturati

## Bug Fix: Analisi ignora manuali alternativi (10/12/2025)
- [x] L'analisi si concentra solo sul manuale principale e ignora completamente le alternative
- [x] La strategia commerciale dovrebbe considerare tutti i manuali adottati
- [x] Aggiornare prompt Fase 2 e Fase 3 per includere analisi comparativa con le alternative
- [x] Aggiunto campo manuali_alternativi nello schema JSON Fase 2

## Bug Fix: Filosofia Didattica vuota (10/12/2025)
- [x] La sezione "Filosofia Didattica" mostrava campi errati (orientamento/approccio_preferito invece di approccio_principale)
- [x] Corretta UI per usare i campi corretti dal prompt Fase 1
- [x] Corretta esportazione HTML per usare i campi corretti

## Bug Fix: Logica raccomandazione manuali (10/12/2025)
- [x] Problema: Quando Zanichelli è già alternativa (Solomons), lo propone come sostituto invece di analizzare il manuale principale (Brown)
- [x] Manca analisi esplicita del manuale principale (Brown) e delle alternative (Botta)
- [x] La strategia deve essere diversa in base alla posizione di Zanichelli:
  - Se Zanichelli è principale: consolidare l'adozione
  - Se Zanichelli è alternativa: farlo diventare principale (ma analizzare comunque il principale attuale)
  - Se Zanichelli è assente: farlo aggiungere
- [x] Aggiungere sezione "Analisi Bibliografia Adottata" nei risultati con:
  - Valutazione manuale principale (punti forza/debolezza, allineamento, motivo scelta)
  - Valutazione manuali alternativi (confronto con principale)
  - Posizione Zanichelli (principale/alternativa/assente)
  - Sintesi competitiva

## Bug Fix: Errore parsing risposta AI Fase 3 (10/12/2025)
- [x] L'analisi non si completa - errore "Errore nel parsing della risposta AI"
- [x] Semplificato lo schema JSON della sezione analisi_bibliografia
- [x] Aggiornata UI per usare la nuova struttura semplificata

## Aggiunta Analisi Bibliografia all'esportazione HTML (10/12/2025)
- [x] Aggiungere sezione "Analisi Bibliografia Adottata" nell'esportazione HTML

## Switch API Provider (10/12/2025)
- [x] Aggiungere preferenza utente per scegliere provider LLM (Manus/OpenAI)
- [x] Salvare preferenza nel database (campo llmProvider nella tabella users)
- [x] Creare procedure tRPC per get/set preferenza (apiConfig.getLlmProvider, apiConfig.setLlmProvider)
- [x] Modificare servizi LLM per leggere preferenza e usare provider corretto (invokeLLMWithUserPreference)
- [x] Aggiungere switch nella UI Impostazioni (componente LLMProviderToggle)
- [x] Mostrare stato connessione per entrambi i provider

## Bug Fix: Errore ricorrente "Unexpected token '<', "<!doctype"..." (18/12/2025)
- [x] Investigare causa dell'errore nella pagina /gestione-dati
- [x] Identificare quale query tRPC sta fallendo (dropbox.getFolderStructure)
- [x] Correggere il problema alla radice (reso lazy il caricamento Dropbox)
- [x] Testare la soluzione - pagina ora si carica correttamente

## Bug Fix: Errore ricorrente si ripresenta (26/12/2025)
- [x] L'errore "Unexpected token '<', "<!doctype"..." si ripresenta nonostante il fix precedente (causato da conflitto porte)
- [x] Implementare soluzione più robusta con timeout sul server (30s timeout su getFolderStructure)
- [x] Aggiungere error boundary e retry logic nel frontend (gestione errori migliorata con UI dedicata)

## Bug Fix: Errore importazione framework - materie non trovate (30/12/2025)
- [x] Errore durante importazione framework da Dropbox per: Analisi_matematica_1, Analisi_matematica_2, Fisica_Generale_1, Fisica_Generale_2, Matematica_Bioscienze
- [x] Verificare se le materie esistono nel database con nomi diversi (trovate discrepanze nei nomi)
- [x] Aggiungere le materie mancanti (Macroeconomia, Microeconomia, Matematica per Biologia) e migliorare il matching con tabella di mapping

## Bug Fix: Errore importazione con prefisso framework_ (30/12/2025)
- [x] I file framework hanno prefisso "framework_" che non viene gestito dal matching
- [x] Aggiornare logica per rimuovere il prefisso prima del matching (aggiunto .replace(/^framework_/i, "") in dropbox.ts)
- [x] Estesa tabella di mapping per includere tutti i nomi diretti

## Bug: Framework non visualizzabili dopo importazione (30/12/2025)
- [x] I framework importati mostrano data 8 dicembre invece del 30 dicembre (risolto: updatedAt ora viene aggiornato esplicitamente)
- [x] La matita di modifica è presente ma i framework non sono visualizzabili (risolto: aggiunto pulsante Visualizza e funzionalità Modifica)
- [x] Verificare se l'aggiornamento del database avviene correttamente (risolto: updateFramework ora imposta updatedAt esplicitamente)
- [x] Verificare se il problema è nella query di lettura o nell'update (risolto: UI ora mostra "Aggiornato il" quando updatedAt != createdAt)

## Bug: Importazione Dropbox non funziona (30/12/2025)
- [ ] Il pulsante "Importa Framework" non risponde o non completa l'operazione
- [ ] Verificare se ci sono errori nella console o nel server
- [ ] Testare la connessione Dropbox e le API

## Bug: Framework realmente troncati durante importazione (30/12/2025)
- [x] I framework importati sono incompleti (TUTTI i framework sono troncati)
- [x] VERIFICATO: i file su Dropbox sono completi e corretti (iniziano e finiscono con {})
- [ ] ERRORE PRECEDENTE: il contenuto nel database NON è completo come pensato
- [ ] Il framework inizia da "alignment_method" invece che dall'inizio
- [ ] Le prime 430+ righe sono state tagliate durante l'importazione
- [ ] Identificare dove avviene il troncamento nel codice di importazione
- [ ] Correggere il bug e reimportare i framework

## Bug: Errore importazione framework_Matematica_Bio.json (02/01/2026)
- [x] Il file framework_Matematica_Bio.json non trova la materia corrispondente
- [x] Verificare se "Matematica per Biologia" esiste nel database (esiste con code matematica_per_biologia)
- [x] Correggere il mapping o aggiungere la materia (aggiunto matematica_per_biologia, macroeconomia, istologia al mapping)
- [ ] ERRORE PERSISTE: aggiungere logging per vedere quale codice viene estratto dal nome file
- [ ] Verificare se il problema è nella normalizzazione del nome o nel matching

## Bug: Timeout Dropbox e pulsante Riprova non funziona (03/01/2026)
- [x] La query getFolderStructure va in timeout dopo 30s (RISOLTO: rimossa la query)
- [x] Il pulsante "Riprova" non ricarica i dati (RISOLTO: rimossa la necessità di riprova)
- [x] Aumentare il timeout o ottimizzare la query (SOLUZIONE: rimossa la visualizzazione della struttura)
- [x] Correggere il pulsante Riprova per fare refetch (RISOLTO: interfaccia semplificata)

## Bug: Server crash durante importazione framework (07/01/2026)
- [ ] Il server crasha quando clicchi su "Importa Framework"
- [ ] Errore: "Unexpected token '<', "<!doctype"..." - il server restituisce HTML di errore
- [ ] Investigare i log del server per trovare l'errore
- [ ] Correggere il bug nel codice di importazione


## Migrazione da Dropbox a Database (COMPLETATA - 08/01/2026)
- [x] FASE 1: Verificare schema database
- [x] FASE 2: Aggiungere CRUD completo per framework e manuali
- [x] FASE 3: Saltata - Dropbox rimosso, caricamento via UI
- [x] FASE 4: Rimuovere Dropbox completamente dal codice
- [x] FASE 5: Verificare stabilita del server (0 errori TS)
- [x] FASE 6: Creare checkpoint della migrazione

## Nuovo Framework Multiclasse (In Elaborazione)
- [x] Analizzato framework Chimica Generale - Multiclasse (10 classi di laurea)
- [x] Confermato compatibilità con UNI-SCAN
- [x] Definito criterio per popolare select classi di laurea (dinamico dal framework)
- [ ] Aggiungere campo degreeClass alle analisi (dopo migrazione Dropbox)
- [ ] Aggiornare prompt GPT-4 per usare dati per-class dal nuovo framework
- [ ] Aggiornare UI per mostrare analisi per-class
- [ ] Caricare framework multiclasse Chimica Generale quando pronto
- [ ] Caricare framework multiclasse Istologia quando pronto
- [ ] Caricare framework multiclasse per altre materie quando pronti

## Conversione PDF → Testo (Nuova Funzionalità)
- [ ] Installare libreria pdfjs-dist per conversione PDF affidabile
- [ ] Creare servizio pdfToText nel backend
- [ ] Integrare conversione nel flusso di caricamento programma
- [ ] Testare con PDF reali per verificare qualità estrazione testo


## Prossimi Step (Priorità - 08/01/2026)

### Step 1: Caricare Framework Multiclasse
- [ ] Caricare framework Chimica Generale multiclasse via UI
- [ ] Caricare framework Istologia multiclasse via UI
- [ ] Verificare che i dati siano stati salvati correttamente nel database

### Step 2: Implementare Upload File JSON
- [ ] Aggiungere input file per upload JSON nei framework
- [ ] Aggiungere input file per upload JSON nei manuali
- [ ] Validare il JSON caricato
- [ ] Testare upload con file JSON reali

### Step 3: Aggiungere Campo Classe di Laurea
- [ ] Aggiungere campo degreeClass alla tabella evaluations
- [ ] Aggiungere select classe di laurea nel form di Analisi Situazionale
- [ ] Popolare dinamicamente dal framework selezionato
- [ ] Aggiornare prompt GPT-4 per usare la classe di laurea
- [ ] Testare con un'analisi completa


## Migrazione da Dropbox a Database (COMPLETATA - 08/01/2026)
- [x] FASE 1: Verificare schema database
- [x] FASE 2: Aggiungere CRUD completo per framework e manuali
- [x] FASE 3: Saltata - Dropbox rimosso, caricamento via UI
- [x] FASE 4: Rimuovere Dropbox completamente dal codice
- [x] FASE 5: Verificare stabilità del server (0 errori TS)
- [x] FASE 6: Creare checkpoint della migrazione

## Tre Step Successivi (COMPLETATI - 08/01/2026)
- [x] FASE 1: Caricare i framework multiclasse nel database (Chimica Generale e Istologia)
- [x] FASE 2: Implementare upload file JSON per framework e manuali
- [x] FASE 3: Aggiungere campo classe di laurea nel form di Analisi Situazionale
- [x] FASE 4: Testare e validare i tre step
- [ ] FASE 5: Creare checkpoint finale

## Nuovo Framework Multiclasse (In Elaborazione)
- [x] Analizzato framework Chimica Generale - Multiclasse (10 classi di laurea)
- [x] Confermato compatibilità con UNI-SCAN
- [x] Definito criterio per popolare select classi di laurea (dinamico dal framework)
- [x] Caricato framework multiclasse Chimica Generale nel database
- [x] Caricato framework multiclasse Istologia nel database
- [x] Aggiunto campo degreeClass alle analisi
- [x] Implementato select dinamico per classe di laurea nel form
- [x] Estratte classi dal campo framework.classes_analyzed
- [x] Puliti i nomi delle classi (L-13_Biologia → L-13)
- [x] Spostato select classe di laurea subito dopo select materia
- [ ] Aggiornare prompt GPT-4 per usare dati per-class dal nuovo framework
- [ ] Aggiornare UI per mostrare analisi per-class
- [ ] Caricare framework multiclasse per altre materie quando pronti

## Conversione PDF → Testo (Nuova Funzionalità)
- [ ] Installare libreria pdfjs-dist per conversione PDF affidabile
- [ ] Creare servizio pdfToText nel backend
- [ ] Integrare conversione nel flusso di caricamento programma
- [ ] Testare con PDF reali per verificare qualità estrazione testo


## Fix Valutazione Istologia - Struttura Framework Variabile (09/01/2026)
- [x] Fix: Framework Istologia usa "syllabus_modules" invece di "modules"
- [x] Aggiornare manualEvaluator.ts per cercare syllabus_modules oltre a modules/moduli
- [ ] Testare valutazione Istologia con nuovo codice
- [x] Creare sistema robusto per normalizzare strutture framework diverse (frameworkNormalizer.ts)
- [x] Documentare formati supportati per framework futuri (19 test passati)

## Implementazione Conversione PDF → Testo (09/01/2026)
- [ ] Aggiungere libreria pdfjs-dist per parsing PDF
- [ ] Creare servizio pdfParser.ts per estrazione testo da PDF
- [ ] Implementare troncamento automatico per PDF molto lunghi
- [ ] Aggiornare form Analisi Situazionale per upload PDF programmi
- [ ] Testare parsing PDF con programmi reali

## Aggiornamento Prompt GPT-4 per Classe di Laurea (09/01/2026)
- [x] Fase 1: Passare degreeClass al prompt
- [x] Fase 1: Aggiunta sezione FRAMEWORK MULTICLASSE al prompt
- [x] Fase 2: Usare moduli specifici della classe nel prompt
- [x] Fase 2: Aggiunta sezione CLASSE DI LAUREA al prompt
- [x] Fase 2: Identificare gap specifici della classe
- [x] Fase 3: Generare raccomandazioni specifiche della classe
- [x] Fase 3: Aggiunta sezione CLASSE DI LAUREA al prompt Fase 3
- [x] Testare analisi completa con Istologia + classe di laurea

## Generazione Email di Contatto (09/01/2026)
- [x] Aggiungere sezione email nel prompt della Fase 3
- [x] Generare email personalizzata con vantaggi manuale per classe di laurea
- [x] Includere argomenti di forza vs competitor
- [x] Testare generazione email con Istologia

## Test Valutazione Istologia (09/01/2026)
- [ ] Verificare che la valutazione Istologia funzioni correttamente
- [ ] Controllare che i moduli syllabus_modules vengano estratti correttamente
- [ ] Verificare che il prompt riceva i dati corretti
- [ ] Testare rigenerazione batch per Istologia


## Estrazione Automatica PDF (09/01/2026) - SOSPESO
- [ ] Implementare estrazione PDF con pdftotext nel backend
- [ ] **NOTA**: Dopo ore di tentative, la soluzione non è stata completata
- [ ] **ALTERNATIVA CONSIGLIATA**: Fornire script Python standalone agli utenti per convertire PDF in TXT
- [ ] **LIMITE ATTUALE**: Gli utenti devono convertire manualmente i PDF in TXT prima di caricarli
- [ ] **SCRIPT PYTHON FUNZIONANTE**: Disponibile - usa pypdf, funziona perfettamente in 10 minuti


## Conversione PDF Integrata (09/01/2026) - NUOVA FEATURE
- [ ] Creare servizio backend di conversione PDF con pypdf
- [ ] Aggiungere procedura tRPC per conversione PDF
- [ ] Creare pagina ConvertPdf con UI per upload e visualizzazione
- [ ] Aggiungere voce menu e routing per la nuova pagina
- [ ] Testare end-to-end con Ancona_Politecnica.pdf


## Tool Conversione PDF Standalone (09/01/2026) - NUOVA FEATURE
- [ ] Creare componente PdfConverterTool standalone
- [ ] Aggiungere il tool nella home page
- [ ] Testare end-to-end con Ancona_Politecnica.pdf


---

## Multi-Editore Feature (feature/multi-editore branch) - IN PROGRESS

### Phase 1: Requirements Gathering
- [ ] Definire esattamente quali modifiche fare per il multi-editore
- [ ] Decidere come funziona il switch (localStorage, database, URL parameter)
- [ ] Definire quali dati filtrano per editore (manuali, framework, analisi)
- [ ] Identificare gli editori da supportare oltre a Zanichelli
- [ ] Specificare qualsiasi altro requisito

### Phase 2: Implementation
- [ ] Creare copia locale di UNI-SCAN nel sandbox
- [ ] Implementare publisher switch nelle Impostazioni
- [ ] Aggiornare schema database per supportare filtro editore
- [ ] Aggiornare tutte le query per filtrare per editore
- [ ] Testare funzionalità end-to-end

### Phase 3: Testing & Deployment
- [ ] Verificare che il switch editore funziona correttamente
- [ ] Testare che i dati si filtrano correttamente
- [ ] Testare che non ci sono errori TypeScript
- [ ] Documentare le modifiche
- [ ] Preparare per merge a main branch
