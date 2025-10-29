async function testTemplatesAPI() {
  console.log('🧪 Testando API /relationship/templates...')

  try {
    // Teste GET
    console.log('\n📥 Testando GET...')
    const getResponse = await fetch('http://localhost:3000/api/relationship/templates', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    console.log('GET Status:', getResponse.status)
    const getData = await getResponse.text()
    console.log('GET Response:', getData)

    // Teste POST
    console.log('\n📤 Testando POST...')
    const postData = {
      code: 'MSG1',
      title: 'Após a Venda',
      anchor: 'sale_close',
      touchpoint: 'whatsapp',
      suggested_offset: '+0d',
      channel_default: 'whatsapp',
      message_v1: 'Olá [Nome do Aluno], estou muito feliz em começar essa jornada com você!',
      message_v2: 'Oi [Nome do Aluno], seja bem-vindo(a) à nossa jornada de transformação!',
      active: true,
      priority: 1,
      audience_filter: {},
      variables: ['Nome do Aluno']
    }

    const postResponse = await fetch('http://localhost:3000/api/relationship/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)
    })

    console.log('POST Status:', postResponse.status)
    const postResult = await postResponse.text()
    console.log('POST Response:', postResult)

  } catch (error) {
    console.error('❌ Erro:', error.message)
  }
}

testTemplatesAPI()
