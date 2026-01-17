import { supabase } from './lib/supabase'

async function testConnection() {
  console.log('Testing Supabase connection...')
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  
  try {
    // Test 1: Check if we can connect
    const { data, error } = await supabase
      .from('documents')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Connection failed:', error.message)
      return false
    }
    
    console.log('✅ Successfully connected to Supabase!')
    console.log('✅ Documents table is accessible')
    
    // Test 2: Check medical_records table
    const { error: medError } = await supabase
      .from('medical_records')
      .select('count')
      .limit(1)
    
    if (medError) {
      console.error('⚠️ Medical records table issue:', medError.message)
    } else {
      console.log('✅ Medical records table is accessible')
    }
    
    return true
  } catch (err) {
    console.error('❌ Unexpected error:', err)
    return false
  }
}

testConnection()
