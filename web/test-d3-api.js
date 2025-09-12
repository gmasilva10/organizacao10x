// Teste simples da API D3
const testData = {
  answers: {
    hipertensao: "sim"
  },
  aluno: {
    idade: 40,
    sexo: "M"
  }
};

fetch('http://localhost:3000/api/guidelines/versions/default/preview', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(testData)
})
.then(response => {
  console.log('Status:', response.status);
  return response.text();
})
.then(data => {
  console.log('Response:', data);
})
.catch(error => {
  console.error('Error:', error);
});
