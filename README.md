# node-red-contrib-atag-one
## Description

Nodes facilitating the automation of the *Atag One* ( <https://www.atag-one.com> ) with Node-RED ( <http://nodered.org> ).

## Installation

```
$ cd ~/.node-red
$ npm install node-red-contrib-atag-one
```

## Nodes

##### - atagone-controller

Configuration node for communication with an Atag One thermostat.

*Configuration:*
- Name : Specify a name for the configuration node
- IP : Specify the ip address

##### - atagone-get

Gets the status of an Atag One thermostat on an input message.

*Configuration:*
- Name : Optionally specify a name
- Controller : Select the Atag One controller

*Messages injected in NodeRED flows (1 channel):*

Channel 1:
The state of the thermostat:
- <kbd>msg.payload.burningHours</kbd> : Total burning hours
- <kbd>msg.payload.roomTemp</kbd> : The temperature measured by th thermostat
- <kbd>msg.payload.outsideTemp</kbd> : The outside temperature
- <kbd>msg.payload.hotWaterTemp</kbd> : The temperature of the hot water outlet
- <kbd>msg.payload.chWaterTemp</kbd> : The temperature of the heating water
- <kbd>msg.payload.chReturnWaterTemp</kbd> : The temperature of the returned water by the heating infrastructure
- <kbd>msg.payload.hotWaterPressure</kbd> : The pressure for hot water 
- <kbd>msg.payload.chWaterPressure</kbd> : The pressure for the heating infrastructure
- <kbd>msg.payload.setTemp</kbd> : The target temperature currently set
- <kbd>msg.payload.chTimeToTemp</kbd>: The time needed to get to the set temperature

## Release notes

#### v1.0.2

- Added static bootstap CSS file

#### v1.0.1

- Added documentation

#### v1.0.0

- *paletteLabel* defined for all nodes
- Initial implementation
