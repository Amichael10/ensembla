const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro-latest' });

async function runCleanup() {
  console.log('🔍 Fetching 30 films for AI evaluation...');
  const { data: films } = await supabase
    .from('films')
    .select('id, title, synopsis')
    .limit(30);

  const prompt = `
    Analyze these films. Determine if they are Nigerian/African or International (Hollywood/Bollywood/etc).
    Be strict. If it's a Hollywood movie like "The Monkey" (Stephen King) or "Inside Out", mark it as is_african: false.
    
    Films:
    ${JSON.stringify(films, null, 2)}
    
    Return ONLY a JSON array:
    [
      { "id": "...", "title": "...", "is_african": true/false, "country": "...", "reason": "..." }
    ]
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  const evaluation = JSON.parse(jsonMatch[0]);

  console.log('\n📝 AI Evaluation Results:');
  const nonAfrican = evaluation.filter(f => !f.is_african);
  
  if (nonAfrican.length > 0) {
    console.log(`⚠️ Found ${nonAfrican.length} non-African films to remove:`);
    nonAfrican.forEach(f => console.log(` - ${f.title} (${f.reason})`));
    
    // Actually delete if you want, but for now just list
    console.log('\n[DRY RUN] To delete these, we would run: .delete().in("id", [...ids])');
  } else {
    console.log('✅ No non-African films found in this batch.');
  }

  // Check for some new actors too
  console.log('\n🌟 Asking Gemini for new Nollywood discoveries (Yoruba/Igbo/Hausa)...');
  const actorPrompt = `Suggest 5 influential Yoruba and 5 influential Hausa (Kannywood) actors. JSON only: [{"name": "...", "region": "..."}]`;
  const actorResult = await model.generateContent(actorPrompt);
  console.log(actorResult.response.text());
}

runCleanup();
