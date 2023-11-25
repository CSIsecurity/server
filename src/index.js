const app = require('./app');

// app.listen(app.get('port'));
// console.log('server on port ', app.get('port'));
const PORT = 4000;
const ADDRESS = '0.0.0.0';
server.listen(PORT, ADDRESS, () => {
  console.log(`Server listening on ${ADDRESS}:${PORT}`);
});