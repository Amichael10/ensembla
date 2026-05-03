
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Checking for available RPCs...');
  // This is a hacky way to list functions if they are exposed
  const { data, error } = await supabase.rpc('get_functions');
  console.log('Functions:', data || error);
}
run();
