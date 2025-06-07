import { supabase } from './supabase'

async function testSupabaseSetup() {
  try {
    // 1. Test connection
    console.log('Testing Supabase connection...')
    const { data: connectionTest, error: connectionError } = await supabase.from('chats').select('count(*)', { count: 'exact' })
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