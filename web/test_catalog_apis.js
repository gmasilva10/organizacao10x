// Test script for catalog APIs
const testAPIs = async () => {
  const baseUrl = 'http://localhost:3000'
  
  console.log('Testing Catalog APIs...\n')
  
  // Test Protocols API
  try {
    console.log('1. Testing Protocols API...')
    const protocolsResponse = await fetch(`${baseUrl}/api/guidelines/catalog/protocols`)
    const protocolsData = await protocolsResponse.json()
    console.log('Status:', protocolsResponse.status)
    console.log('Data:', JSON.stringify(protocolsData, null, 2))
    console.log('X-Query-Time:', protocolsResponse.headers.get('x-query-time'))
  } catch (error) {
    console.error('Protocols API Error:', error.message)
  }
  
  console.log('\n' + '='.repeat(50) + '\n')
  
  // Test RIR API
  try {
    console.log('2. Testing RIR API...')
    const rirResponse = await fetch(`${baseUrl}/api/guidelines/catalog/rir`)
    const rirData = await rirResponse.json()
    console.log('Status:', rirResponse.status)
    console.log('Data:', JSON.stringify(rirData, null, 2))
    console.log('X-Query-Time:', rirResponse.headers.get('x-query-time'))
  } catch (error) {
    console.error('RIR API Error:', error.message)
  }
  
  console.log('\n' + '='.repeat(50) + '\n')
  
  // Test Readiness API
  try {
    console.log('3. Testing Readiness API...')
    const readinessResponse = await fetch(`${baseUrl}/api/guidelines/catalog/readiness`)
    const readinessData = await readinessResponse.json()
    console.log('Status:', readinessResponse.status)
    console.log('Data:', JSON.stringify(readinessData, null, 2))
    console.log('X-Query-Time:', readinessResponse.headers.get('x-query-time'))
  } catch (error) {
    console.error('Readiness API Error:', error.message)
  }
}

testAPIs().catch(console.error)
