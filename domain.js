var FORMAT = {
    JSON: { value: 0, name: 'JSON', description: 'JSON'},
    CSV: { value: 1, name: 'CSV', description: 'CSV'}
}

class AtagVersion {
    constructor(version, timestamp) {
        this._version = version;
        this._timestamp = timestamp;
    }

    get version() { return this._version; }
    set version(value) { this._version = value; }
    get timestamp() { return this._timestamp; }
    set timestamp(value) { this._timestamp = value; }
}

class UdpMessage {
    constructor(senderAddress, message) {
        this._senderAddress = senderAddress;
        this._message = message;
    }

    get senderAddress() { return this._senderAddress; }
    set senderAddress(value) { this._senderAddress = value; }
    get message() { return this._message; }
    set message(value) { this._message = value; }
}

class PortalCredentials {
    constructor(emailAddress, password) {
        this._emailAddress = emailAddress;
        this._password = password;
    }

    get emailAddress() { return this._emailAddress; }
    set emailAddress(value) { this._emailAddress = value; }
    get password() { return this._password; }
    set password(value) { this._password = value; }
}

class DeviceInfo {
    constructor(name, ip, mac) {
        this._name = name;
        this._ip = ip;
        this._mac = mac;
    }

    get name() { return this._name; }
    set name(value) { this._name = value; }
    get ip() { return this._ip; }
    set ip(value) { this._ip = value; }
    get mac() { return this._mac; }
    set mac(value) { this._mac = value; }
}

class AtagConfiguration {
    constructor() {
        this._temperature = 0;
        this._email = '';
        this._password = '';
        this._debug = false;
        this._format = FORMAT.JSON;
        this._hostName = '';
        this._skipAuthRequest = false;
        this._dump = false;
        this._mac = '';
    }

    get temperature() { return this._temperature; }
    set temperature(value) { this._temperature = value; }
    get email() { return this._email; }
    set email(value) { this._email = value; }
    get password() { return this._password; }
    set password(value) { this._password = value; }
    get debug() { return this._debug; }
    set debug(value) { this._debug = value; }
    get format() { return this._format; }
    set format(value) { this._format = value; }
    get hostName() { return this._hostName; }
    set hostName(value) { this._hostName = value; }
    get skipAuthRequest() { return this._skipAuthRequest; }
    set skipAuthRequest(value) { this._skipAuthRequest = value; }
    get dump() { return this._dump; }
    set dump(value) { this._dump = value; }
    get mac() { return this._mac; }
    set mac(value) { this._mac = value; }

    isLocal() {
        return length(this.email) == 0;
    }
}

class AtagOneInfo {
    constructor(deviceAddress, deviceId) {
        this._deviceAddress = (deviceAddress !== undefined) ? deviceAddress : '';
        this._deviceId = (deviceId !== undefined) ? deviceId : '';
    }

    get deviceAddress() { return this._deviceAddress; }
    set deviceAddress(value) { this._deviceAddress = value; }
    get deviceId() { return this._deviceId; }
    set deviceId(value) { this._deviceId = value; }
}

module.exports = {
    FORMAT: FORMAT,
    AtagVersion: AtagVersion,
    UdpMessage: UdpMessage,
    PortalCredentials: PortalCredentials,
    DeviceInfo: DeviceInfo,
    AtagConfiguration: AtagConfiguration,
    AtagOneInfo: AtagOneInfo
}