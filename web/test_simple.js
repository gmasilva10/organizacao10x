// Simple test for catalog APIs
console.log('Testing Catalog APIs...')

const testAPI = async (url, name) => {
  try {
    console.log(`\nTesting ${name}...`)
    const response = await fetch(url)
    console.log(`Status: ${response.status}`)
    
    if (response.ok) {
      const data = await response.json()
      console.log(`Data: ${JSON.stringify(data, null, 2)}`)
      console.log(`X-Query-Time: ${response.headers.get('x-query-time')}`)
    } else {
      console.log(`Error: ${response.statusText}`)
    }
  } catch (error) {
    console.error(`Error testing ${name}:`, error.message)
  }
}

// Test all APIs
Promise.all([
  testAPI('http://localhost:3000/api/guidelines/catalog/protocols', 'Protocols'),
  testAPI('http://localhost:3000/api/guidelines/catalog/rir', 'RIR'),
  testAPI('http://localhost:3000/api/guidelines/catalog/readiness', 'Readiness')
]).then(() => {
  console.log('\nAll tests completed!')
}).catch(console.error)
