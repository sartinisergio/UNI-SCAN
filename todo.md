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
