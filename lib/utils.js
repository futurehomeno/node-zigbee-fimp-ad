module.exports = {
    NewFimpAddressFromString:NewFimpAddressFromString,
    GenerateInclusionReport:GenerateInclusionReport
  };

class FimpAddress {
    constructor() {
        this.payloadType = "";
        this.msgType = "";
        this.resourceType = "";
        this.resourceType = "";
        this.resourceName = "";
        this.serviceName = "";
        this.resourceAddress = "";
        this.serviceAddress = "";
    }
}

function NewFimpAddressFromString(topicString){
    var addr = new FimpAddress();
    var tokens = topicString.split("/");
    for (var i in tokens) {
        var tokenName = tokens[i].split(":")[0];
        var tokenValue = tokens[i].split(":")[1]
        switch(tokenName) {
            case "pt":
                addr.payloadType = tokenValue;
                break;
            case "mt":
                addr.msgType = tokenValue;    
                break;
            case "rt":
                addr.resourceType = tokenValue; 
                break;
            case "rn":
                addr.resourceName = tokenValue;
                break;
            case "ad":
                if( addr.serviceName == undefined){
                    addr.resourceAddress = tokenValue;
                }else {
                    addr.serviceAddress = tokenValue;
                }
                break;
            case "sv":
                addr.serviceName = tokenValue;
                break;                
        }
    }
    return addr ;
}

function GenerateInclusionReport (ep) {

   var powerSource = ""
   if (ep.device.powerSource != undefined) {
       powerSource = ep.device.powerSource;
   }
   var report =   {
        "ctime": "2018-01-25T10:30:42+0100",
        "props": {},
        "serv": "zigbee",
        "tags": [],
        "type": "evt.thing.inclusion_report",
        "val": {
          "address": ep.device.nwkAddr+"",
          "category": "",
          "comm_tech": "zigbee",
          "device_id": ep.device.ieeeAddr+"",
          "groups": [
            "ch_0"
          ],
          "hw_ver": "1",
          "is_sensor": "0",
          "manufacturer_id": ep.device.manufId+"",
          "power_source": powerSource.toLowerCase(),
          "product_hash": ep.device.modelId,
          "product_id": ep.device.modelId,
          "product_name": ep.device.modelId,
          "prop_set": {},
          "security": "",
          "services": getServicesForProduct(ep.device.manufId,ep.device.modelId,ep.device.nwkAddr,ep.epId),
          "sw_ver": "258",
          "tech_specific_props": {
           
          },
          "wakeup_interval": "-1"
        },
        "val_t": "object"
      }
    return report;  
}


function getServicesForProduct(manufId,modelId,devId,epId) {
    var result = []
    address = devId+"_"+epId
    switch (manufId) {
        case 4151: // Xiaomi 
            switch(modelId) {
                case "lumi.sens":  // temp humidity sensor
                    result = [
                        {
                          "address": '/rt:dev/rn:zigbee/ad:1/sv:sensor_temp/ad:'+address,
                          "enabled": true,
                          "groups": [
                            "ch_0"
                          ],
                          "interfaces": [
                            {
                              "intf_t": "out",
                              "msg_t": "evt.sensor.report",
                              "val_t": "float",
                              "ver": "1"
                            }
                          ],
                          "location": "",
                          "name": "sensor_temp",
                          "prop_set_ref": "",
                          "props": {
                            "is_secure": true,
                            "is_unsecure": false,
                            "sup_units":["C"]
                          }
                        },
                        {
                            "address": '/rt:dev/rn:zigbee/ad:1/sv:sensor_humid/ad:'+address,
                            "enabled": true,
                            "groups": [
                              "ch_0"
                            ],
                            "interfaces": [
                              {
                                "intf_t": "out",
                                "msg_t": "evt.sensor.report",
                                "val_t": "float",
                                "ver": "1"
                              }
                            ],
                            "location": "",
                            "name": "sensor_humid",
                            "prop_set_ref": "",
                            "props": {
                              "is_secure": true,
                              "is_unsecure": false,
                              "sup_units":["%"]
                            }
                          }
                      ]
                    break;
                case "lumi.sensor_motion":
                result = [
                    {
                      "address": '/rt:dev/rn:zigbee/ad:1/sv:sensor_presence/ad:'+address,
                      "enabled": true,
                      "groups": [
                        "ch_0"
                      ],
                      "interfaces": [
                        {
                          "intf_t": "out",
                          "msg_t": "evt.presence.report",
                          "val_t": "bool",
                          "ver": "1"
                        }
                      ],
                      "location": "",
                      "name": "sensor_presence",
                      "prop_set_ref": "",
                      "props": {
                        "is_secure": true,
                        "is_unsecure": false
                      }
                    } ] 
                    break;  
                case "lumi.sensor_switch":
                result = [
                    {
                      "address": '/rt:dev/rn:zigbee/ad:1/sv:scene_ctrl/ad:'+address,
                      "enabled": true,
                      "groups": [
                        "ch_0"
                      ],
                      "interfaces": [
                        {
                          "intf_t": "out",
                          "msg_t": "evt.scene.report",
                          "val_t": "string",
                          "ver": "1"
                        }
                      ],
                      "location": "",
                      "name": "scene_ctrl",
                      "prop_set_ref": "",
                      "props": {
                        "is_secure": true,
                        "is_unsecure": false
                      }
                    }
                    ]
                    break;     
            }
            break;
        case 4476: // IKEA
            switch(modelId){
                case "TRADFRI bulb E27 opal 1000lm":
                    result = [
                        {
                        "address": '/rt:dev/rn:zigbee/ad:1/sv:out_bin_switch/ad:'+address,
                        "enabled": true,
                        "groups": [
                            "ch_0"
                        ],
                        "interfaces": [
                            {
                              "intf_t": "in",
                              "msg_t": "cmd.binary.set",
                              "val_t": "bool",
                              "ver": "1"
                            },
                            {
                               "intf_t": "out",
                               "msg_t": "evt.binary.report",
                                "val_t": "bool",
                                "ver": "1"
                            }
                        ],
                        "location": "",
                        "name": "out_bin_switch",
                        "prop_set_ref": "",
                        "props": {
                            "is_secure": true,
                            "is_unsecure": false
                        }
                        }
                        ]
                    break; 
            }
            break;
        case 4098: // ELKO 
            switch(modelId) {
                case "ElkoDimmerZHA":
                result = [
                    {
                    "address": '/rt:dev/rn:zigbee/ad:1/sv:out_bin_switch/ad:'+address,
                    "enabled": true,
                    "groups": [
                        "ch_0"
                    ],
                    "interfaces": [
                        {
                          "intf_t": "in",
                          "msg_t": "cmd.binary.set",
                          "val_t": "bool",
                          "ver": "1"
                        },
                        {
                           "intf_t": "out",
                           "msg_t": "evt.binary.report",
                            "val_t": "bool",
                            "ver": "1"
                        }
                    ],
                    "location": "",
                    "name": "out_bin_switch",
                    "prop_set_ref": "",
                    "props": {
                        "is_secure": false,
                        "is_unsecure": true
                    }
                    },
                    {
                        "address": '/rt:dev/rn:zigbee/ad:1/sv:out_lvl_switch/ad:'+address,
                        "enabled": true,
                        "groups": [
                            "ch_0"
                        ],
                        "interfaces": [
                            {
                              "intf_t": "in",
                              "msg_t": "cmd.lvl.set",
                              "val_t": "int",
                              "ver": "1"
                            },
                            {
                               "intf_t": "out",
                               "msg_t": "evt.lvl.report",
                                "val_t": "int",
                                "ver": "1"
                            },
                            {
                                "intf_t": "in",
                                "msg_t": "cmd.binary.set",
                                 "val_t": "bool",
                                 "ver": "1"
                             },
                             {
                                "intf_t": "out",
                                "msg_t": "evt.binary.report",
                                "val_t": "bool",
                                "ver": "1"
                             }
                        ],
                        "location": "",
                        "name": "out_lvl_switch",
                        "prop_set_ref": "",
                        "props": {
                            "is_secure": false,
                            "is_unsecure": true
                        }
                        }
                    ]
                    break;
            }    
    }
    return result

}