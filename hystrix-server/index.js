const restify = require('restify');
const rp = require('request-promise');
const https = require('https');
const fs = require('fs');
const hystrixSSEStream = require('hystrixjs').hystrixSSEStream;
const CommandsFactory = require('hystrixjs').commandFactory;
const service = {
  errorThreshold: 1,
  timeout: 5000,
  concurrency: 300
}

function hystrixStreamResponse(request, response) {
  response.header('Content-Type', 'text/event-stream;charset=UTF-8');
  response.header('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
  response.header('Pragma', 'no-cache');
  return hystrixSSEStream.toObservable().subscribe(
    function onNext(sseData) {
      response.write('data: ' + sseData + '\n\n');
    },
    function onError(error) {
      console.log(error);
    },
    function onComplete() {
      return response.end();
    }
  );

};

function makeRequest(options) {
  if (!options.uri) {
    options.uri = "";
  }
  return rp(options);
}

var serviceCommand = CommandsFactory.getOrCreate("testservice")
  .circuitBreakerErrorThresholdPercentage(service.errorThreshold)
  .timeout(3000)
  .run(makeRequest)
  .circuitBreakerRequestVolumeThreshold(service.concurrency)
  .circuitBreakerSleepWindowInMilliseconds(service.timeout)
  .statisticalWindowLength(30000)
  .statisticalWindowNumberOfBuckets(10)
  .errorHandler(isErrorHandler)
  .fallbackTo(fallback)
  .build();

function fallback(err, args) {
  console.log(err);
  if (err.message == "CommandTimeOut") {
    return { "message": args[0].uri + " is unavailable", "statusCode": 503 };
  }
}


function isErrorHandler(error, response, body) {
  if (error) {
    return error;
  }
  if (response.statusCode == 503) {
    var unavailableError = new Error();
    unavailableError.name = "ServiceUnavailableError";
    return unavailableError;
  }
  return null;
};

var promise = serviceCommand.execute(arguments)

function respond(req, res, next) {
  var options = {
    'method': 'GET',
    'uri': "http://testserver",
    'resolveWithFullResponse': true,
    'simple': false
  }

  serviceCommand.execute(options)
    .then(function(response) {
      if (response.statusCode == 200) {
        res.send(response.body);
        next();
      } else {
        console.log("here");
        res.send(response.statusCode, response.message);
        next();
      }
    })
    .catch(function(err) {
      console.log(err);
      console.log("in catch");
      res.send(503);
    })

}

var server = restify.createServer();
server.get('/servicecheck', respond);
server.get('/api/hystrix.stream', hystrixStreamResponse);
server.listen(8080, function() {
  console.log('%s listening at %s', server.name, server.url);
});
server.listen(80, function() {
  console.log('%s listening at %s', server.name, server.url);
});