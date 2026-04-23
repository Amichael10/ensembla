const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testQuery() {
  console.log('Testing exact query from AdminUsers.jsx as ANON...');
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.log(`❌ Error: ${error.message} (${error.code})`);
  } else {
    console.log(`✅ Success: Found ${data.length} users.`);
  }
}

testQuery();
