const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkAdmin() {
  const email = 'amichaelwale@gmail.com';
  console.log(`Checking if ${email} exists in public.users...`);
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();
    
  if (error) {
    console.error('Error:', error);
  } else if (!data) {
    console.log('User NOT found in public.users table!');
    
    // Check auth.users directly via rpc or just listing
    console.log('Checking auth.users...');
    const { data: authUser, error: authErr } = await supabase.auth.admin.listUsers();
    if (authErr) {
        console.error('Auth check error:', authErr);
    } else {
        const found = authUser.users.find(u => u.email === email);
        if (found) {
            console.log('User found in auth.users, but missing from public.users.');
            console.log('This means the trigger handle_new_user might have failed or not fired.');
        } else {
            console.log('User NOT found in auth.users either.');
        }
    }
  } else {
    console.log('User found:', data);
  }
}

checkAdmin();
