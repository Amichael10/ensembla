const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testAnonAccess() {
  console.log('Testing access as ANON/AUTHENTICATED role...');
  const { error } = await supabase.from('users').select('id').limit(1);
  if (error) {
    console.log(`❌ Table [users]: ${error.message} (${error.code})`);
  } else {
    console.log(`✅ Table [users]: Exists and is readable by ANON`);
  }
}

testAnonAccess();
