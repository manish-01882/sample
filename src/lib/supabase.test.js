require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js')

// Debug: Log the environment variables
console.log('Environment variables:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'exists' : 'missing');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials!')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSupabaseSetup() {
  try {
    // 1. Test connection
    console.log('\nTesting Supabase connection...')
    const { data: connectionTest, error: connectionError } = await supabase
      .from('chats')
      .select('*', { count: 'exact', head: true })
    
    if (connectionError) throw connectionError
    console.log('✅ Connection successful!')

    // 2. Test insert
    console.log('\nTesting insert operation...')
    const testChat = {
      user_id: '00000000-0000-0000-0000-000000000000', // Test UUID
      type: 'text',
      prompt: 'Test prompt',
      response: 'Test response'
    }
    const { data: insertData, error: insertError } = await supabase
      .from('chats')
      .insert([testChat])
      .select()
      .single()
    
    if (insertError) {
      console.log('❌ Insert failed (expected due to RLS):', insertError.message)
    } else {
      console.log('✅ Insert successful:', insertData)
    }

    // 3. Test select
    console.log('\nTesting select operation...')
    const { data: selectData, error: selectError } = await supabase
      .from('chats')
      .select('*')
      .limit(5)
    
    if (selectError) {
      console.log('❌ Select failed (expected due to RLS):', selectError.message)
    } else {
      console.log('✅ Select successful:', selectData)
    }

    // 4. Test RLS
    console.log('\nTesting RLS...')
    console.log('Current auth status:', await supabase.auth.getSession())
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testSupabaseSetup() 