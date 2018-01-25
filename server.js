var ZShepherd = require('zigbee-shepherd');
var zserver = new ZShepherd('/dev/tty.usbmodem14211',{dbPath:"./database/dev.db"});
var mqtt = require('mqtt')
options = {clientId:"zigbee-ad-1",username:"",password:"",protocolVersion: 4}
var client  = mqtt.connect('mqtt://localhost:1883',options)
var counter = 0;
var utils  = require("./lib/utils.js")

// see [1]
zserver.on('ready', function () {
    console.log('Server is ready. Allow devices to join the network within 180 secs.');
    console.log('Waiting for incoming clients or messages...');
    console.log(zserver.info());
    // zserver.permitJoin(40);
    console.log(zserver.list());
    console.log("Device info:")
});

client.on('connect', function () {
    console.log("----MQTT connected to broker---------");
    client.subscribe('pt:j1/mt:cmd/rt:dev/rn:zigbee/ad:1/+/+');
    client.subscribe('pt:j1/mt:cmd/rt:ad/rn:zigbee/ad:1');
  })

client.on('message', function (topic, message) {
    // message is Buffer
    msgObj = JSON.parse(message);
    console.log(message.toString());
    console.log(topic);
    if (msgObj.serv== "zigbee") {
        switch(msgObj.type){
            case "cmd.thing.get_inclusion_report":
               devId = msgObj.val
               sendInclusionReport(Number(devId))
               break;
            case "cmd.thing.inclusion":
                startDeviceInclusion(msgObj.val)
                break;   
            case "cmd.network.get_all_nodes":
                sendNodesListResport();
                break;   
            default:
               console.log("Unsupported FIMP message type")
        }
       
    }else if (msgObj.serv=="out_bin_switch") {
        fimpAddr = utils.NewFimpAddressFromString(topic)
        console.log(fimpAddr);
        addrSplit =  fimpAddr.serviceAddress.split("_");
        devId = Number(addrSplit[0]);
        epId = Number(addrSplit[1]);
        ctrlBinarySwitch(devId,epId,msgObj.val);

    } else {
        console.log("Unsupported FIMP service")
    }
    
    
  })
  
zserver.on('permitJoining', function (joinTimeLeft) {
    console.log(joinTimeLeft);
});

zserver.on('error', function (error) {
    console.log(error);
});

function startDeviceInclusion(flag) {
    console.log("Starting device inclusion:"+flag);
    if (flag) {
        zserver.permitJoin(60);
    }else {
        zserver.permitJoin(0);
    }
}

function sendNodesListResport() {
    nodes = zserver.list();
    result = []
    for(var i in nodes) {
        powerSource = ""
        if (nodes[i].powerSource != undefined) {
            powerSource = nodes[i].powerSource.toLowerCase()
        }
        node = {"address":nodes[i].nwkAddr+"","power_source":powerSource,"alias":nodes[i].modelId}
        result.push(node)
    }
    payload = {
        "ctime": "2018-01-24T20:07:54+0100",
        "props": {},
        "serv": "zigbee",
        "tags": [],
        "type": "evt.network.all_nodes_report",
        "val": result,
        "val_t": "object"
    }
    client.publish('pt:j1/mt:evt/rt:ad/rn:zigbee/ad:1', JSON.stringify(payload));

}

function sendInclusionReport(devId) {
    ep = zserver.find(devId,1)
    if (ep == undefined) {
        console.log("UNdefined endpoint");
        return 
    }
    payload = utils.GenerateInclusionReport(ep);
    console.log("Sending report ")
    console.log(payload)
    
    client.publish('pt:j1/mt:evt/rt:ad/rn:zigbee/ad:1', JSON.stringify(payload));
}

function ctrlBinarySwitch(devId,epId,value) {
    // devId = devId+0;
    console.log("devId = "+devId);
    console.log("epId = "+epId);

    var ep = zserver.find(devId, epId);
    if (ep == undefined) {
        console.log("Device is not found by the address. Skipp");
        return;
    }
    console.log("ep = "+ep);
    cmd = "off";
    if (value) {
       cmd = "on";
    }
    ep.functional('genOnOff', cmd, {}, function (err, rsp) {
        if (!err)
            console.log("Cmd response :"+rsp);
        else 
            console.log("Err:",err);    
    // This example receives a 'defaultRsp'
    // {
    //     cmdId: 2,
    //     statusCode: 0
    // }
    });
    reportBinarySwitch(devId,epId,value);

}

function reportBinarySwitch(devId,epId,value) {
    addr = devId+"_"+epId
    payload = {
        "ctime": "2018-01-24T20:07:54+0100",
        "props": {},
        "serv": "out_bin_switch",
        "tags": [],
        "type": "evt.binary.report",
        "val": value,
        "val_t": "bool"
      }
    client.publish('pt:j1/mt:evt/rt:dev/rn:zigbee/ad:1/sv:out_bin_switch/ad:'+addr, JSON.stringify(payload));
}

function reportPresence(devId,epId,value) {
    addr = devId+"_"+epId
    payload = {
        "ctime": "2018-01-24T20:07:54+0100",
        "props": {},
        "serv": "sensor_presence",
        "tags": [],
        "type": "evt.presence.report",
        "val": value,
        "val_t": "bool"
      }
    client.publish('pt:j1/mt:evt/rt:dev/rn:zigbee/ad:1/sv:sensor_presence/ad:'+addr, JSON.stringify(payload));
}


function reportTemperature(devId,endpId,temperature) {
    addr = devId+"_"+endpId
    payload = {
        "ctime": "2018-01-24T20:07:54+0100",
        "props": {
          "unit": "C"
        },
        "serv": "sensor_temp",
        "tags": [],
        "type": "evt.sensor.report",
        "val": temperature,
        "val_t": "float"
      }
    client.publish('pt:j1/mt:evt/rt:dev/rn:zigbee/ad:1/sv:sensor_temp/ad:'+addr, JSON.stringify(payload));
}

function reportHumidity(devId,endpId,humidity) {
    addr = devId+"_"+endpId
    payload = {
        "ctime": "2018-01-24T20:07:54+0100",
        "props": {
          "unit": "%"
        },
        "serv": "sensor_humid",
        "tags": [],
        "type": "evt.sensor.report",
        "val": humidity,
        "val_t": "float"
      }
    client.publish('pt:j1/mt:evt/rt:dev/rn:zigbee/ad:1/sv:sensor_humid/ad:'+addr, JSON.stringify(payload));
}

function reportButton(devId,endpId,mode) {
    addr = devId+"_"+endpId
    payload = {
        "ctime": "2018-01-24T20:07:54+0100",
        "props": {},
        "serv": "scene_ctrl",
        "tags": [],
        "type": "evt.scene.report",
        "val": mode+"",
        "val_t": "string"
      }
    client.publish('pt:j1/mt:evt/rt:dev/rn:zigbee/ad:1/sv:scene_ctrl/ad:'+addr, JSON.stringify(payload));
}

// see [2]
zserver.on('ind', function (msg) {
    switch (msg.type) {
        case 'devIncoming':
            console.log('Device: ' + msg.data + ' joining the network!');
            // msg.endpoints.forEach(function (ep) {
            //     console.log(ep.dump());  // endpoint information
            // });
            console.log(msg);
            sendInclusionReport(msg.data);   
            break;
        case 'devChange':
            console.log("Some data from device");    
            break; 
        case 'attReport':
            console.log("Attribute report");
            console.log(msg);
            switch(msg.data.cid) {
                case 'msRelativeHumidity':
                    console.log(counter+". Humidity = "+msg.data.data.measuredValue/100)
                    reportHumidity(msg.endpoints[0].getNwkAddr(),msg.endpoints[0].epId,msg.data.data.measuredValue/100);
                    break;
                case 'msTemperatureMeasurement':
                    console.log(counter+".Temperature = "+msg.data.data.measuredValue/100)
                    reportTemperature(msg.endpoints[0].getNwkAddr(),msg.endpoints[0].epId,msg.data.data.measuredValue/100);
                    break;
                case 'msOccupancySensing':
                    console.log(counter+". Motion detected");
                    val = false 
                    if (msg.data.data.occupancy == 1)
                       val = true; 
                    reportPresence(msg.endpoints[0].getNwkAddr(),msg.endpoints[0].epId,val);
                    setTimeout(function(){
                        reportPresence(msg.endpoints[0].getNwkAddr(),msg.endpoints[0].epId,false);
                    }, 5000,false);
                    break;
                case 'genOnOff':
                    if (msg.data.data.onOff!=undefined) {
                        reportButton(msg.endpoints[0].getNwkAddr(),msg.endpoints[0].epId,msg.data.data.onOff)
                    }else {
                        reportButton(msg.endpoints[0].getNwkAddr(),msg.endpoints[0].epId,msg.data.data['32768'])
                    }
                    break;    
                default:
                    console.log(counter+".Unknown attribute: "+msg.data.cid)    
                    console.log(msg);
            }
            counter++;
      
            break;       
        default:
            // Not deal with other msg.type in this example
            console.log("Unknown event from device. Event = "+msg.type);
            break;
    }
});

zserver.start(function (err) {
    if (err)
        console.log(err);
});