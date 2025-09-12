// Check if tables exist and have data
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kkxlztopdmipldncduvj.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtreGx6dG9wZG1pcGxkbmNkdXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NzM0NTMsImV4cCI6MjA2NDM0OTQ1M30.s443KF6W-W9ojzyraQ5v4YHYruqO9F08AkFHr0n3WxQ'

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const checkTable = async (tableName) => {
  try {
    console.log(`\nChecking table: ${tableName}`)
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .limit(5)
    
    if (error) {
      console.error(`Error querying ${tableName}:`, error.message)
      return false
    }
    
    console.log(`✓ Table ${tableName} exists`)
    console.log(`  Count: ${count}`)
    console.log(`  Sample data:`, data?.slice(0, 2))
    return true
  } catch (err) {
    console.error(`Exception querying ${tableName}:`, err.message)
    return false
  }
}

const checkAllTables = async () => {
  console.log('Checking catalog tables...')
  
  const tables = ['anthro_protocols', 'rir_matrix', 'readiness_types', 'readiness_stages']
  const results = await Promise.all(tables.map(checkTable))
  
  const allExist = results.every(Boolean)
  console.log(`\nAll tables exist: ${allExist}`)
  
  if (!allExist) {
    console.log('\nSome tables are missing or have errors. Check the database migration.')
  }
}

checkAllTables().catch(console.error)
