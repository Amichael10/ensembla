const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkColumns() {
  const { data, error } = await supabase.rpc('exec_sql', { 
    sql_query: "SELECT column_name FROM information_schema.columns WHERE table_name = 'people';" 
  });
  
  if (error) {
    // If RPC fails, try a direct query on a single row to see keys
    const { data: row } = await supabase.from('people').select('*').limit(1).single();
    console.log('Columns from sample row:', Object.keys(row || {}));
  } else {
    console.log('Columns:', data.map(c => c.column_name));
  }
}

checkColumns();
