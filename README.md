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
- Controller : Select the openHAB controller

*Messages injected in NodeRED flows (1 channel):*

Channel 1:
The input message with addition of :
- <kbd>msg.payload</kbd> : the item object (name, label, state, ...)
- <kbd>msg.payload_in</kbd> : copy of incoming message's payload

## Release notes

#### v1.0.0

- *paletteLabel* defined for all nodes
- Initial implementation


