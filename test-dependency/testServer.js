var http = require('http');
var s = http.createServer(function(req, res) {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.write('Hello\n');
  let randomTime = randomIntInc(1800, 7000);
  console.log("Waiting " + randomTime);
  setInterval(function() {
    res.end(' World\n');
  }, randomTime);
  console.log("Hello");
});
s.listen(80);

function randomIntInc(low, high) {
  return Math.floor(Math.random() * (high - low + 1) + low);
}