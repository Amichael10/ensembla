const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function updateConstraint() {
  const sql = `
    ALTER TABLE films DROP CONSTRAINT IF EXISTS films_release_type_check;
    ALTER TABLE films ADD CONSTRAINT films_release_type_check 
    CHECK (release_type IN ('cinema', 'youtube', 'netflix', 'prime_video', 'kaba', 'showmax', 'other'));
  `;

  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('Error updating constraint:', error);
    // If exec_sql doesn't exist, we'll have to tell the user to run it in the dashboard.
    console.log('You might need to run this SQL in the Supabase Dashboard:');
    console.log(sql);
  } else {
    console.log('Constraint updated successfully!');
  }
}

updateConstraint();
