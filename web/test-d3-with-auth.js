// Teste da API D3 com headers de autenticação
const testData = {
  answers: {
    hipertensao: "sim"
  }
};

fetch('http://localhost:3000/api/guidelines/versions/default/preview', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': 'sb-kkxlztopdmipldncduvj-auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzM2NTI0MDAwLCJpYXQiOjE3MzY1MjA0MDAsImlzcyI6Imh0dHBzOi8va2t4bHp0b3BkbWlwbGRuY2R1dmouc3VwYWJhc2UuY28vYXV0aC92MSIsInN1YiI6InRlc3QtdXNlci1pZCIsImVtYWlsIjoiYWRtaW4uYmFzaWNAcGcubG9jYWwiLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoiYWRtaW4uYmFzaWNAcGcubG9jYWwiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiYWRtaW4uYmFzaWNAcGcubG9jYWwifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTczNjUyMDQwMH1dLCJzZXNzaW9uX2lkIjoiMTIzNDU2Nzg5LWFiY2RlZi1naGlqLWtsbW4tb3BxcnN0dXYiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.test-signature'
  },
  body: JSON.stringify(testData)
})
.then(response => {
  console.log('Status:', response.status);
  console.log('Headers:', Object.fromEntries(response.headers.entries()));
  return response.text();
})
.then(data => {
  console.log('Response:', data.substring(0, 500));
})
.catch(error => {
  console.error('Error:', error);
});
