import { generateAIContent } from '../api/_lib/ai_service.js';
import dotenv from 'dotenv';

dotenv.config();


async function runTest() {
  const testCases = [
    {
      title: "007: Road to a Million",
      synopsis: "From the producers of the James Bond films comes 007's Road to a Million. Nine pairs of everyday people are unleashed on an epic adventure through a series of 007-inspired challenges, to find questions hidden around the world, for a chance to win a life-changing £1,000,000 prize.",
      cast: ["Brian Cox"]
    },
    {
      title: "The Black Book",
      synopsis: "After his son is framed for a kidnapping, a bereaved deacon takes justice into his own hands and fights a corrupt police gang to absolve him.",
      cast: ["Richard Mofe-Damijo", "Ade Laoye", "Sam Dede"]
    },
    {
      title: "Mission: Impossible - Dead Reckoning Part One",
      synopsis: "Ethan Hunt and his IMF team must track down a dangerous new weapon that threatens all of humanity before it falls into the wrong hands.",
      cast: ["Tom Cruise", "Hayley Atwell"]
    },
    {
        title: "A Tribe Called Judah",
        synopsis: "Five brothers band together to rob a small-town mall, but they end up facing a lot more than they bargained for.",
        cast: ["Funke Akindele", "Jide Kene Achufusi"]
    }
  ];

  console.log('🚀 Starting AI Filtering Dry-Run Test...\n');

  for (const movie of testCases) {
    console.log(`🔍 Checking: "${movie.title}"`);
    try {
      const prompt = `Identify if the following film is a Nollywood (Nigerian) or African production. 
Title: ${movie.title}
Synopsis: ${movie.synopsis}
Cast: ${movie.cast?.join(', ')}

Return ONLY a JSON object: {"isAfrican": true/false, "confidence": 0-1, "reason": "brief reason"}`;

      const { text, telemetry } = await generateAIContent(prompt);
      console.log(`   Engine used: ${telemetry.engine}`);
      
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const result = JSON.parse(cleanedText);
      
      const status = result.isAfrican ? '✅ AFRICAN' : '❌ NOT AFRICAN';
      console.log(`   Status: ${status}`);
      console.log(`   Confidence: ${result.confidence}`);
      console.log(`   Reason: ${result.reason}`);
    } catch (e: any) {
      console.log(`   ❌ Error: ${e.message}`);
    }
    console.log('-----------------------------------\n');
  }
}

runTest();
