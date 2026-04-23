const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkRelationship() {
  console.log('Testing users join with people...');
  const { data, error } = await supabase
    .from('users')
    .select('*, people(name)')
    .limit(1);
    
  if (error) {
    console.error('Error with standard join:', error);
    
    console.log('Testing with explicit foreign key fk_users_linked_profile...');
    const { data: d2, error: e2 } = await supabase
        .from('users')
        .select('*, people!fk_users_linked_profile(name)')
        .limit(1);
    
    if (e2) {
        console.error('Error with explicit FK join:', e2);
    } else {
        console.log('Success with explicit FK join!');
    }
  } else {
    console.log('Success with standard join!');
  }
}

checkRelationship();
