const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listRoutines() {
  const { data, error } = await supabase
    .from('peoples') // use any table
    .select('id')
    .limit(1);
  
  // Actually I can't query information_schema via PostgREST directly unless enabled.
  console.log('Testing connection...');
  if (error) console.error(error);
  else console.log('Connection OK');
}

listRoutines();
