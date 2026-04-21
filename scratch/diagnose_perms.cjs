const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function diagnose() {
    console.log('Checking table: users');
    const { data: usersData, error: usersError } = await supabase.from('users').select('*').limit(1);
    if (usersError) {
        console.error('Error fetching users:', usersError);
    } else {
        console.log('Successfully fetched users as service_role');
    }

    console.log('\nChecking RLS policies...');
    const { data: policies, error: polError } = await supabase.rpc('get_policies'); // If exists
    
    // Fallback: try to select from pg_policies via rpc if we have one, or just simple select
    const { data: p2, error: e2 } = await supabase.from('pg_policies').select('*').limit(5); // This won't work usually
    
    // Let's try to run a raw query to check permissions
    const { data: perms, error: permsErr } = await supabase.rpc('check_permissions', { table_name: 'users' });
    
    if (permsErr) {
        console.log('RPC check_permissions not found, trying basic check.');
    }
}

diagnose();
