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

Listen for reel data as an EventEmitter's "data" events.

```javascript
barnowl.addListener(BarnowlReel.EventListener,
                    { path: eventEmitterInstance });
```

### Test

Provides a steady stream of simulated reel packets for testing purposes.

```javascript
barnowl.addListener(BarnowlReel.TestListener, {});
```


License
-------

MIT License

Copyright (c) 2014-2018 [reelyActive](https://www.reelyactive.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN 
THE SOFTWARE.
