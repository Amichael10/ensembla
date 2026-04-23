const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkView() {
  const { data, error } = await supabase.rpc('exec_sql', { 
    sql_query: "SELECT pg_get_viewdef('users', true);" 
  });
  
  if (error) {
    console.error('Error fetching view def:', error);
  } else {
    console.log('View Definition:', data);
  }

  const { data: grants, error: grantErr } = await supabase.rpc('exec_sql', {
    sql_query: "SELECT grantee, privilege_type FROM information_schema.role_table_grants WHERE table_name = 'users';"
  });

  if (grantErr) {
    console.error('Error fetching grants:', grantErr);
  } else {
    console.log('Grants:', grants);
  }
}

checkView();
