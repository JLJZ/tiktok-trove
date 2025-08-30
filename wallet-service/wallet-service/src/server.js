const { app, port } = require('./app');

app.listen(port, () => {
  console.log(`Wallet Service listening on http://localhost:${port} (docs: /docs)`);
});
