barnowl-reel
============

__barnowl-reel__ converts RF decodings from [reelyActive reels](https://www.reelyactive.com/technology/reel/#content) into software-developer-friendly JSON: a real-time stream of [raddec](https://github.com/reelyactive/raddec/) objects which facilitate any and all of the following applications:
- RFID: _what_ is present, based on the device identifier?
- RTLS: _where_ is it relative to the receiving devices?
- M2M: _how_ is its status, based on any payload included in the packet?

__barnowl-reel__ is a lightweight [Node.js package](https://www.npmjs.com/package/barnowl-reel) that can run on resource-constrained edge devices as well as on powerful cloud servers and anything in between.  It is typically run behind a [barnowl](https://github.com/reelyactive/barnowl) instance which is included in the [Pareto Anywhere](https://www.reelyactive.com/pareto/anywhere/) open source middleware suite.


Installation
------------

    npm install barnowl-reel


Hello barnowl-reel!
-------------------

The following code will listen to _simulated_ hardware and output packets to the console:

```javascript
const BarnowlReel = require('barnowl-reel');

let barnowl = new BarnowlReel();

barnowl.addListener(BarnowlReel.TestListener, {});

barnowl.on("raddec", function(raddec) {
  console.log(raddec);
});

barnowl.on("infrastructureMessage", function(message) {
  console.log(message);
});
```

As output you should see a stream of [raddec](https://github.com/reelyactive/raddec/) objects similar to the following:

```javascript
{
  transmitterId: "fee150bada55",
  transmitterIdType: 3,
  rssiSignature: [
    {
      receiverId: "001bc50940810000",
      receiverIdType: 1,
      rssi: -83,
      numberOfDecodings: 1
    },
    {
      receiverId: "001bc50940810001",
      receiverIdType: 1,
      rssi: -91,
      numberOfDecodings: 1
    }
  ],
  packets: [ '421655daba50e1fe0201050c097265656c79416374697665' ],
  timestamp: 1547693457133
}
```

Regardless of the underlying RF protocol and hardware, the [raddec](https://github.com/reelyactive/raddec/) specifies _what_ (transmitterId) is _where_ (receiverId & rssi), as well as _how_ (packets) and _when_ (timestamp).


Is that owl you can do?
-----------------------

While __barnowl-reel__ may suffice standalone for simple real-time applications, its functionality can be greatly extended with the following software packages:
- [advlib](https://github.com/reelyactive/advlib) to decode the individual packets from hexadecimal strings into JSON
- [barnowl](https://github.com/reelyactive/barnowl) to combine parallel streams of RF decoding data in a technology-and-vendor-agnostic way

These packages and more are bundled together as the [Pareto Anywhere](https://www.reelyactive.com/pareto/anywhere) open source middleware suite, which includes several __barnowl-x__ listeners.



Supported Listener Interfaces
-----------------------------

The following listener interfaces are supported.

### UDP

```javascript
barnowl.addListener(BarnowlReel.UdpListener, { path: '0.0.0.0:50000' });
```

### Serial

Manually install the [serialport](https://www.npmjs.com/package/serialport) package, taking care to first meet any [prerequisites for the target platform](https://www.npmjs.com/package/serialport#installation-instructions):

    npm install serialport

```javascript
barnowl.addListener(BarnowlReel.SerialListener, { path: 'auto' });
```

Note that __barnowl-reel v0.2__ is adapted to work with serialport v10.x.  If errors are encountered, try forcing an install of serialport 10 with `npm install serialport@10.4.0`

On Ubuntu, it may be necessary to add the user to the _dialout_ group in order to have the necessary permissions to access the device, which can be accomplished with the command `sudo usermod -a -G dialout $USER` and made to take effect by logging out and back in to the user account.

### Event

Listen for reel data as an EventEmitter's "data" events.  Either Buffer or hexadecimal string data is accepted.

```javascript
barnowl.addListener(BarnowlReel.EventListener,
                    { path: eventEmitterInstance });
```

### Test

Provides a steady stream of simulated reel packets for testing purposes.

```javascript
barnowl.addListener(BarnowlReel.TestListener, {});
```


Pareto Anywhere Integration
---------------------------

__barnowl-reel__ includes a script to forward serial/USB data to a local [Pareto Anywhere](https://www.reelyactive.com/pareto/anywhere/) instance as UDP raddecs with target localhost:50001.  Manually install the serialport dependency with `npm install serialport` and then start this script with the command:

    npm run serial-forwarder


Supported Decoding Options
--------------------------

Each listener interface supports _decodingOptions_ with the following properties:

| Property        | Default | Description                         | 
|:----------------|:--------|:------------------------------------|
| maxReelLength   | 254     | Ignore packets that (spuriously) exceed the given reel length |
| minPacketLength | 0       | Ignore radio packets with less than the given number of bytes length |
| maxPacketLength | 255     | Ignore radio packets with more than the given number of bytes length |

For example, the decoding options for a UDP listener expecting a single reelceiver and BLE packets would be specified as follows:

```javascript
let options = { maxReelLength: 1, minPacketLength: 8, maxPacketLength: 39 };
barnowl.addListener(BarnowlReel.UdpListener,
                    { path: '0.0.0.0:50000', decodingOptions: options });
```

In most cases, explicit _decodingOptions_ are not required.  In cases where the reel serial data stream is susceptible to corruption, explicit _decodingOptions_ can limit occurrences of spurious/missed packets.


Contributing
------------

Discover [how to contribute](CONTRIBUTING.md) to this open source project which upholds a standard [code of conduct](CODE_OF_CONDUCT.md).


Security
--------

Consult our [security policy](SECURITY.md) for best practices using this open source software and to report vulnerabilities.


License
-------

MIT License

Copyright (c) 2014-2022 [reelyActive](https://www.reelyactive.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN 
THE SOFTWARE.
