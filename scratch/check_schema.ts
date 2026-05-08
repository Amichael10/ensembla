import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
  const { data, error } = await supabase.rpc('inspect_table_columns', { table_name: 'people' });
  if (error) {
    // Fallback: use a simple query
    console.log('RPC failed, trying information_schema');
    const { data: cols, error: colError } = await supabase.from('people').select('*').limit(1);
    if (colError) console.error(colError);
    else console.log('Columns:', Object.keys(cols[0]));
  } else {
    console.log(data);
  }
}

checkSchema();
