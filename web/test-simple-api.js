// Teste simples da API sem autenticação
fetch('http://localhost:3000/api/health')
.then(response => {
  console.log('Health Status:', response.status);
  return response.json();
})
.then(data => {
  console.log('Health Response:', data);
})
.catch(error => {
  console.error('Health Error:', error);
});
