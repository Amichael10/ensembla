const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTables() {
    const { data, error } = await supabase.rpc('get_tables'); // Hope this exists
    if (error) {
        // Fallback to searching information_schema if rpc doesn't exist
        // Note: Raw SQL via supabase-js requires a custom RPC usually
        console.log('RPC get_tables failed. Trying direct query on common tables.');
        const tables = ['users', 'profiles', 'people', 'channels', 'films'];
        for (const t of tables) {
            const { data: d, error: e } = await supabase.from(t).select('count', { count: 'exact', head: true });
            console.log(`Table '${t}': ${e ? 'ERROR: ' + e.message : 'OK (' + d + ' rows)'}`);
        }
    } else {
        console.log('Tables:', data);
    }
}

checkTables();
