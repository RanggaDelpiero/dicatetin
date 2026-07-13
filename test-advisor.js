fetch('http://localhost:3000/api/advisor', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Halo, apa kabar?' }],
    financialContext: 'Saya punya saldo 5 juta.'
  })
}).then(async res => {
  console.log(res.status);
  console.log(await res.text());
}).catch(console.error);
