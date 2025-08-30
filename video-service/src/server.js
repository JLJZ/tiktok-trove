const { app, port } = require('./app');

app.listen(port, () => {
  console.log(`Video Service listening on http://localhost:${port}`);
});
