var colored_console = require('./colored_console.js');
var r = require('./request_wrapper.js');

var host = 'http://localhost';
var port = 3000;
var supervisor_port = 4040;
var journey_port = 3002;

var address = make_url(host, port);

var journey_address = make_url(host, journey_port);
var supervisor_address = make_url(host, supervisor_port);

var cliente = make_url(host, 5000);

var Client = require('node-rest-client').Client;
var client = new Client();

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
var SupervisorClient = require('./node_supervisor_client');

function make_url(host, port) {
    return host + ':' + port;
}

var monitor = function () {

};
var get_timeout = require("./get.js");

app.route('/status').get(function (req, res) {
    res.json({status: 'status'});
});

app.route('/get_next_bus/').get(function (req, res) {
//console.log("params body ", req.query);
  var line_id = req.query.line_id;
  var stop_id = req.query.stop_id;
  var response = res;
    get_timeout(journey_address + "/next_bus", {
        parameters: {
            line_id: line_id,
            stop_id: stop_id
        }
    }, 2000, function(err) {
        //console.log("el error",err);
        //response.sendStatus(408);
        noResponse(cliente)
    }, function (data, body) {
      console.log("time",data);
        report_to_client(cliente, data.next_bus_time);
    });

});

//TODO: el cliente falta aca...
function report_to_client(cliente, next_bus_time){
    //console.log(">>>> ", cliente + '/proximo_bus', next_bus_time);
    client.get(cliente + '/proximo_bus', {
        parameters: {
            'next_bus': next_bus_time
        }
    }, function(){console.log('Se envio el estado al cliente');});
}

function noResponse(cliente, next_bus_time){
    //console.log(">>>> ", cliente + '/proximo_bus', next_bus_time);
    client.get(cliente + '/noresponse', {
        parameters: {
          msg: "hubo un error"
        }
    }, function(){console.log('Se envio el estado al cliente');});
}

app.route('/line_status/').get(function (req, res) {
    var response = res;

    get_timeout(supervisor_address + "/line_status/", {}, 2000, function (err, body) {
        console.log(err);
        if (err) {
            response.sendStatus(408);
            return;
        }else{
            response.json({'status': body.status});
        }
    });
});


//
// Heartbeat

app.route('/heartbeat').get(function (req, res) {
    res.json({status: 'ok'});
});

var server = app.listen(port, function () {

    colored_console.log_info("Initializing node in port " + server.address().port + "....");
    supervisorClient = new SupervisorClient(address, monitor);

    var suffix = 'Empezando servidor en el puerto ' + server.address().port;

    console.log(suffix);
    supervisorClient.register().finally(function () {
        if (!supervisorClient.isOnline()) {
            console.log('Trabajando sin supervisor por ahora...');
        } else {
            console.log('Trabajando con el supervisor...');
        }

    });

    return server;
});
