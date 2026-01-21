// Use native fetch (available in Node.js 18+)
const API_URL = 'http://localhost:3000/api/trpc';

async function testEvaluation() {
  try {
    console.log('🚀 Starting two-phase evaluation test...\n');
    
    // Get all manuals to find Chimica Generale - Atkins
    console.log('📚 Fetching manuals...');
    const manualsRes = await fetch(`${API_URL}/manual.getAll?batch=1`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!manualsRes.ok) {
      console.error('❌ Failed to fetch manuals:', manualsRes.status);
      return;
    }
    
    const manualsData = await manualsRes.json();
    const manuals = manualsData.result?.data || [];
    
    console.log(`✅ Found ${manuals.length} manuals`);
    
    // Find Chimica Generale - Atkins
    const chim = manuals.find(m => 
      m.subject?.includes('Chimica') && m.title?.includes('Atkins')
    );
    
    if (!chim) {
      console.log('⚠️  Chimica Generale - Atkins not found. Available manuals:');
      manuals.slice(0, 5).forEach(m => console.log(`  - ${m.subject}: ${m.title}`));
      return;
    }
    
    console.log(`\n✅ Found manual: ${chim.subject} - ${chim.title} (ID: ${chim.id})\n`);
    
    // Start evaluation
    console.log('🔄 Starting evaluation...');
    const evalRes = await fetch(`${API_URL}/manual.evaluate?batch=1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        json: {
          manualId: chim.id,
          frameworkId: chim.frameworkId
        }
      })
    });
    
    if (!evalRes.ok) {
      console.error('❌ Evaluation failed:', evalRes.status);
      const text = await evalRes.text();
      console.error(text);
      return;
    }
    
    const evalData = await evalRes.json();
    console.log('✅ Evaluation started\n');
    
    // Wait for evaluation to complete (check every 5 seconds)
    let completed = false;
    let attempts = 0;
    const maxAttempts = 120; // 10 minutes max
    
    while (!completed && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
      
      const checkRes = await fetch(`${API_URL}/manual.getById?batch=1&input={"json":{"id":"${chim.id}"}}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        const manual = checkData.result?.data;
        
        if (manual?.manualEvaluation?.content) {
          console.log(`✅ Evaluation completed after ${attempts * 5} seconds\n`);
          
          // Parse the HTML to extract key info
          const html = manual.manualEvaluation.content;
          
          // Extract score
          const scoreMatch = html.match(/Valutazione:\s*(\d+)\/100/);
          const score = scoreMatch ? scoreMatch[1] : 'N/A';
          
          // Extract verdict
          const verdictMatch = html.match(/Verdetto:\s*<[^>]+>([^<]+)<\/[^>]+>/);
          const verdict = verdictMatch ? verdictMatch[1] : 'N/A';
          
          // Count modules
          const moduleMatches = html.match(/<h3>Modulo \d+:/g) || [];
          const moduleCount = moduleMatches.length;
          
          // Count degree programs
          const degreeMatches = html.match(/<h3>Classe di Laurea:/g) || [];
          const degreeCount = degreeMatches.length;
          
          console.log('📊 EVALUATION RESULTS:');
          console.log(`   Score: ${score}/100`);
          console.log(`   Verdict: ${verdict}`);
          console.log(`   Modules evaluated: ${moduleCount}`);
          console.log(`   Degree programs evaluated: ${degreeCount}\n`);
          
          if (moduleCount === 0 || degreeCount === 0) {
            console.log('⚠️  WARNING: Missing modules or degree programs!');
            console.log('   First 500 chars of HTML:');
            console.log(html.substring(0, 500));
          } else {
            console.log('✅ EVALUATION SUCCESSFUL!');
            console.log('   All modules and degree programs were evaluated.');
          }
          
          completed = true;
        } else {
          process.stdout.write('.');
        }
      }
    }
    
    if (!completed) {
      console.log('\n❌ Evaluation timed out after 10 minutes');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testEvaluation();
