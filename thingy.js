module.exports = function(RED) {
    "use strict";
    var http = require("http")
    var WebSocket = require("ws");

    function ThingyNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.uuid = config.uuid;

        node.on('input', function(msg) {
            var options = {
              hostname: 'api.thing.zone',
              port: 80,
              path: '/'+node.uuid+'/actuators/led',
              method: 'PUT',
              headers: {
                  'Content-Type': 'application/json',
              }
            };
            var req = http.request(options, function(res) {
              console.log('Status: ' + res.statusCode);
              console.log('Headers: ' + JSON.stringify(res.headers));
              res.setEncoding('utf8');
              res.on('data', function (body) {
                //console.log('Body: ' + body);
              });
            });
            req.on('error', function(e) {
              console.log('problem with request: ' + e.message);
            });
            // write data to request body
            req.write(JSON.stringify(msg.payload));
            req.end();
        });

        var outputs = {
            temperature: 0,
            pressure: 1,
            humidity: 2,
            gas: 3,
            color: 4
        }
        var socket = new WebSocket("ws://api.thing.zone/"+node.uuid+"/sensors/ws");

        socket.onmessage = function (event) {
            var msg = Array(6).fill(null);
            var data = JSON.parse(event.data);
            for (var sensor in data.sensors) {
                msg[outputs[sensor]] = {
                    payload: data.sensors[sensor],
                    data: data,
                    time: Date.parse(data.timestamp)
                };
            }
            if ('state' in data) {
                msg[5] = {
                    payload: data.state,
                    data: data
                }
            }
            node.send(msg);
        }
        socket.onerror = function(e) {
            console.warn(e.message);
        };

    }
    RED.nodes.registerType("thingy",ThingyNode);
}
