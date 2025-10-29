async function testAPI() {
  console.log('🧪 Testando API /relationship/tasks...')
  
  try {
    const response = await fetch('http://localhost:3000/api/relationship/tasks?page_size=1', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    console.log('Status:', response.status)
    console.log('Headers:', Object.fromEntries(response.headers.entries()))
    
    const data = await response.text()
    console.log('Response:', data)
    
  } catch (error) {
    console.error('Erro:', error.message)
  }
}

testAPI()
