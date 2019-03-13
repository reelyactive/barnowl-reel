barnowl-reel
============

Interface [reelyActive reels](https://reelyactive.github.io/reel-overview.html) to [barnowl](https://github.com/reelyactive/barnowl) open source software.  We believe in an open Internet of Things.


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


License
-------

MIT License

Copyright (c) 2014-2019 [reelyActive](https://www.reelyactive.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN 
THE SOFTWARE.
