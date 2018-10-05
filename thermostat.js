var dto = require('./domain.js');
var os = require('os');
var request = require("request");
var _ = require('lodash');

var ATAG_CACHE_KEY = 'atagDiag';
var HTTP_CLIENT_PORT = 10000;
var MESSAGE_INFO_CONTROL = 1;
var MESSAGE_INFO_SCHEDULES = 2;
var MESSAGE_INFO_CONFIGURATION = 4;
var MESSAGE_INFO_REPORT = 8;
var MESSAGE_INFO_STATUS = 16;
var MESSAGE_INFO_WIFISCAN = 32;

// ===================== Object description =====================

function atagOneLocalConnector(configuration) {
    this.THERMOSTAT_NAME = 'ATAG One';
    this.MAX_LISTEN_TIMEOUT_SECONDS = 60;

	/**
	 * UDP port the thermostat sends its messages to.
	 */
	this.UDP_BROADCAST_PORT = 11000;
	/**
	 * Client port the thermostat listens on.
	 */

	this.SLEEP_BETWEEN_FAILURE_MS = 2000;

	this.RESPONSE_ACC_STATUS = "acc_status";

	/**
	 * Hostname and MAC address of running machine.
	 */
	this.computerInfo;

	/**
	 * ATAG One Device ID and IP address. Will have a value when thermostat found.
	 */
	this.selectedDevice;

	/**
	 * When true, then skip the auth request during login.
	 */
    this.skipAuthRequest;    

    if (configuration === undefined || !(configuration instanceof dto.AtagConfiguration)) {
        console.log('No configuration present');
        throw 'No configuration present';
    }

    this.skipAuthRequest = configuration.skipAuthRequest;
    var hostname = configuration.hostName;
    
    if(hostname.length > 0) {
        var inetAddress =  hostname;
    }

    var deviceInfo = getDeviceInfo();
    if(configuration.mac.length > 0) {
        deviceInfo = new dto.DeviceInfo();
        deviceInfo.ip = deviceInfo.ip;
        deviceInfo.name = deviceInfo.name;
        deviceInfo.mac = configuration.mac; 
    }

    this.computerInfo = deviceInfo;
}

// ===================== Public Atag One Local Connector functions =====================

atagOneLocalConnector.prototype.login = function() {
    return new Promise((resolve, reject) => {
        console.log("Try to find the " + this.THERMOSTAT_NAME + " in the local network.");
        
        searchOnes(this.selectedDevice, this.UDP_BROADCAST_PORT, this.MAX_LISTEN_TIMEOUT_SECONDS)
            .then((data) => {
                this.selectedDevice = data;

                if(!this.skipAuthRequest) {
                    requestAuthorizationFromThermostat(this.selectedDevice, this.computerInfo)
                    .then((data) => {
                        console.log(data);
                        return resolve();
                    })
                    .catch((err) => {
                        console.log(err);
                        return reject(err);
                    });
                }
            })
            .catch((exception) => {
                console.log('No devices found');
                this.selectedDevice = undefined;
            });
    });
}

atagOneLocalConnector.prototype.getDiagnostics = function() {
    return new Promise((resolve, reject) => {

        if (this.selectedDevice === undefined) {
            reject("No device selected, cannot request authorization.");
        }

        if (this.computerInfo === undefined) {
            reject("Cannot determine MAC address of computer, authorization process cancelled.");
        }

        var pairUrl = "http://" + this.selectedDevice.deviceAddress + ":" + HTTP_CLIENT_PORT + "/retrieve";
        console.log("POST retrieve: URL=" + pairUrl);        

        var macAddress = this.computerInfo.mac;
		var info = MESSAGE_INFO_CONTROL + MESSAGE_INFO_REPORT;
		var jsonPayload = "{\"retrieve_message\":{" +
			"\"seqnr\":0," +
			"\"account_auth\":{" +
			"\"user_account\":\"\"," +
			"\"mac_address\":\"" + macAddress + "\"}," +
			"\"info\":" + info + "}}\n";

        requestPairing(pairUrl, jsonPayload, 5)
            .then((data) => {
                return resolve(data);
            })
            .catch((err) => {
                return reject(err);
            });
    });
}

// ===================== Private Atag One Local Connector functions =====================

function requestAuthorizationFromThermostat(selectedDevice, computerInfo) {
    return new Promise((resolve, reject) => {
        if (selectedDevice === undefined) {
            reject("No device selected, cannot request authorization.");
        }

        if (computerInfo === undefined) {
            reject("Cannot determine MAC address of computer, authorization process cancelled.");
        }

        var pairUrl = "http://" + selectedDevice.deviceAddress + ":" + HTTP_CLIENT_PORT + "/pair_message";
        console.log("POST pair_message: URL=" + pairUrl);        

        // Get the local (short) hostname.
		var shortName = computerInfo.name;
		if (shortName.indexOf('.') > 0) {
			shortName = shortName.split("\\.")[0];
        }

        var macAddress = computerInfo.mac;
        var deviceName = shortName + " atag-one API";

        var jsonPayload = "{\"pair_message\":{\"seqnr\":0,\"accounts\":" +
			"{\"entries\":[{" +
			"\"user_account\":\"\"," +
			"\"mac_address\":\"" + macAddress + "\"," +
			"\"device_name\":\"" + deviceName + "\"," +
            "\"account_type\":0}]}}}";

        requestPairing(pairUrl, jsonPayload, 5)
            .then((data) => {
                return resolve(data);
            })
            .catch((err) => {
                return reject(err);
            });
    });
}

function requestPairing(pairUrl, jsonPayload, attempts) {
    return new Promise((resolve, reject) => {
        if (attempts === 3) {
            return reject(new Error('Too many attempts'));
        } 

        var options = {
            url: pairUrl,
            timeout: 0,
            method: 'POST',
            body: jsonPayload,
            headers: {
                'Content-Type': 'text/plain;charset=UTF-8',
                'Content-Length': Buffer.byteLength(jsonPayload),
                'Accept': '*/*',
                'User-Agent': 'HomeDash/1.0',
                'Accept-Encoding': 'gzip,deflate',
                'Accept-Language': 'en-US,en;q=0.8'
            }
        };

        console.log('Starting request ...');

        request(options, function(err, res, body) {
            if(err) {
                console.log('error: ' + err);
                return reject(err);
            } else if (res.statusCode !== 200) {
                console.log('status: ' + res.statusCode);
                err = new Error("Unexpected status code: " + res.statusCode);
                err.res = res;
                return reject(err);
            } 

            // Check the result
            // 1 = Pending
            // 2 = Accepted
            // 3 = Denied
            var result = JSON.parse(body);
            if(result !== undefined && result.pair_reply !== undefined && result.pair_reply.acc_status === 0) {
                console.log('pair_reply');
                return resolve(true);
            } else if(result !== undefined && result.retrieve_reply !== undefined && result.retrieve_reply.acc_status === 2) {
                console.log('retrieve_reply');
                return resolve(result.retrieve_reply.report);
            } else {
                console.log('pairing failed, result:');
                console.log(result);
                console.log('retry pairing ...');
                return delay(5000).then(() => {
                    requestPairing(pairUrl, jsonPayload, (attempts | 0) + 1);
                });
            }
        });
    });
}

function delay(ms){
  return new Promise(function(resolve){
    setTimeout(resolve, ms);
  });
}

function searchOnes(selectedDevice, port, timeout) {
    return new Promise((resolve, reject) => {
        // Is the selected device known        
        if(selectedDevice !== undefined) {
            resolve(selectedDevice);
        }

        var messageTag = 'ONE ';

        console.log('getUdpBroadcastMessage');

        // Check for UDP broadcast messages from the ONE
        getUdpBroadcastMessage(port, timeout, messageTag)
            .then((data) => {
                var device = new dto.AtagOneInfo();
                device.deviceAddress = data.senderAddress;
                device.deviceId = data.message.split(' ')[1];

                return resolve(device);
            })
            .catch((exception) => {
                return reject(exception);
            });
    });
}

function getUdpBroadcastMessage(port, timeout, messageTag) {
    return new Promise((resolve, reject) => {
        if (timeout < 0) {
            console.log("'maxTimeoutSeconds' value cannot be smaller than zero.");
            reject("'maxTimeoutSeconds' value cannot be smaller than zero.");
        }    

        console.log('Creating socket');

        var socket = require( "dgram" ).createSocket( "udp4" );
        var socketOpen = false;

        socket.on("message", function(message, requestInfo) {
            // Log the received message.
            console.log("Message: " + message.toString('utf8') + " from " + requestInfo.address + ":" + requestInfo.port);

            var result = new dto.UdpMessage();
            result.message = message.toString('utf8');
            result.senderAddress = requestInfo.address;

            socket.close();

            return resolve(result);
        });

        socket.on("error", function(data) {
            console.log(data);
            return reject(data);
        });

        socket.bind(port);
        console.log('listens to ' + port);

        // delay(10000)
        //     .then(() => {
        //         console.log('Timeout expired for UDP Atag ONE message on port ' + port);
                
        //         socket.close();

        //         return reject('Timeout expired for UDP Atag ONE message on port ' + port);
        //     }); 
    });
}

function getDeviceInfo() {
    var result = undefined;
    var ifaces = os.networkInterfaces();

    Object.keys(ifaces).forEach(function (ifname) {
        var alias = 0;

        ifaces[ifname].forEach(function (iface) {
            if ('IPv4' !== iface.family || iface.internal !== false) {
                // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                console.log('skip');
                return;
            }

            if (alias >= 1) {
                console.log('skip alias');
                // this single interface has multiple ipv4 addresses
                // TODO: console.log(ifname + ':' + alias, iface.mac);
            } else {
                // this interface has only one ipv4 adress
                var deviceInfo = new dto.DeviceInfo();
                deviceInfo.ip = iface.address;
                deviceInfo.name = ifname;
                deviceInfo.mac = iface.mac;
                result = deviceInfo;
                console.log(result);
            }
        });
    });

    return result;
}

module.exports = function(RED) {
    // Enable access to static files
    RED.httpAdmin.get('/static/*', function(req, res) {
        var options = {
            root: __dirname + '/static/',
            dotfiles: 'deny'
        };
        res.sendFile(req.params[0], options);
    });

    // Hold the IP address of the Atag One thermostat
    function AtagOneControllerNode(config) {
        RED.nodes.createNode(this, config);

        this.getConfig = function() {
            return config;
        }

        var node = this;

        node.log(JSON.stringify(config));

        this.control = function(topic, payload, okCb, errCb) {
            var config = new dto.AtagConfiguration();
            var connection = new atagOneLocalConnector(config);

			connection.login()
				.then((data) => { 
					connection.getDiagnostics()
						.then((data) => {
							var state = {
								"burningHours": data.burning_hours,
								"roomTemp": data.room_temp,
								"outsideTemp": data.outside_temp,
								"hotWaterTemp": data.dhw_water_temp,
								"chWaterTemp": data.ch_water_temp,
								"chReturnWaterTemp": data.ch_return_temp,
								"hotWaterPressure": data.dhw_water_pres,
								"chWaterPressure": data.ch_water_pres,
								"setTemp": data.shown_set_temp
							};
		
							return okCb(state);
						})
						.catch((err) => {
							return errCb(err);
						});
				 })
                .catch((err) => {
                    return errCb(err);
                });

        }
    }
    RED.nodes.registerType("atagone-controller", AtagOneControllerNode);

/**
	* ====== atagone-get ===================
	* Gets the status from an Atag One thermostat
	* messages received via node-red flows
	* =======================================
	*/
	function AtagOneGet(config) {
		RED.nodes.createNode(this, config);
		this.name = config.name;
		var atagoneController = RED.nodes.getNode(config.controller);
		var node = this;
		
		// handle incoming node-red message
		this.on("input", function(msg) {

            var item = (config.itemname && (config.itemname.length != 0)) ? config.itemname : msg.item;

            atagoneController.control(null, null,
								function(body){
									// no body expected for a command or update
                					node.status({fill:"green", shape: "dot", text: " "});
                					//msg.payload_in = msg.payload;
									//msg.payload = JSON.parse(body);
									msg.payload = body;
                					node.send(msg);
								},
								function(err) {
                					node.status({fill:"red", shape: "ring", text: err});
                					node.warn(err);
								}
			);
		});
		this.on("close", function() {
			node.log('close');
		});
	}
	//
	RED.nodes.registerType("atagone-get", AtagOneGet);

}