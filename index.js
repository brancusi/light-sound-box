require('dotenv').config();

var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var util = require('util');
var GPIO = require('pi-pins');
var Rx = require('rxjs/Rx');

var pin = GPIO.connect(21);

let playback = undefined;

const DEVICE_ID = process.env.DEVICE_ID;

const SOUND_MAP = {"fff0": "sound1.mp3", "fff1": "sound2.mp3", "fff2": "sound3.mp3"}

const MY_SOUND = SOUND_MAP[DEVICE_ID];

function startup() {
  exec("amixer -- sset PCM,0 -0.77dB");
  startBluetooth();
}

function startBluetooth() {
  console.log("Starting bluetooth");
  exec("/usr/bin/hciattach /dev/ttyAMA0 bcm43xx 921600 noflow -", function(err, stdout){
    if(err) {
      console.log("Error starting bluetooth");
      startBluetooth();
    } else {
      startRadio();
    }
  });
}

function startRadio() {
  console.log("Starting Radio");
  exec("hciconfig hci0 up", function(err, stdout1){
    if(err) {
      console.log("Error starting radio");
      startRadio();
    } else {
      startApp();
    }
  });
}

function startApp() {
  Rx.Observable
        .interval(10000)
        .startWith(0)
        .subscribe(jsKeys => exec("mpg123 blank.mp3"));

  console.log("Started App");
  var bleno = require('bleno');

  var BlenoPrimaryService = bleno.PrimaryService;
  var BlenoCharacteristic = bleno.Characteristic;
  var BlenoDescriptor = bleno.Descriptor;

  var WriteOnlyCharacteristic = function() {
    WriteOnlyCharacteristic.super_.call(this, {
      uuid: 'fff1',
      properties: ['write', 'writeWithoutResponse']
    });
  };

  util.inherits(WriteOnlyCharacteristic, BlenoCharacteristic);

  WriteOnlyCharacteristic.prototype.onWriteRequest = function(data, offset, withoutResponse, callback) {
    switch (data.toString()) {
      case "1":
        startPlayback();
        break;
      case "0":
        killPlayback();
        break;
      default:

    }

    callback(this.RESULT_SUCCESS);
  };

  function startPlayback() {
    if(playback !== undefined) {
      killPlayback();
    }

    // For testing
    // const index = (Math.floor(Math.random() * 3) + 1) - 1;
    // const song = ["sound1.mp3", "sound2.mp3", "sound3.mp3"][index];
    //
    // playback = spawn('mpg123', ["--loop", 2, song]);

    // For production
    playback = spawn('mpg123', ["--loop", 3, MY_SOUND]);

    pin.mode('high');
  }

  function killPlayback() {
    pin.mode('low');
    if(playback) {
      playback.kill();
    }

    playback = undefined;
  }

  function MainService() {
    MainService.super_.call(this, {
      uuid: DEVICE_ID,
      characteristics: [
        new WriteOnlyCharacteristic()
      ]
    });
  }

  util.inherits(MainService, BlenoPrimaryService);

  bleno.on('stateChange', function(state) {
    console.log('on -> stateChange: ' + state + ', address = ' + bleno.address);

    if (state === 'poweredOn') {
      bleno.startAdvertising('Light Sound', [DEVICE_ID]);
    } else {
      bleno.stopAdvertising();
    }
  });

  // Linux only events /////////////////
  bleno.on('accept', function(clientAddress) {
    console.log('on -> accept, client: ' + clientAddress);

    bleno.updateRssi();
  });

  bleno.on('disconnect', function(clientAddress) {
    console.log('on -> disconnect, client: ' + clientAddress);
  });

  bleno.on('rssiUpdate', function(rssi) {
    console.log('on -> rssiUpdate: ' + rssi);
  });
  //////////////////////////////////////

  bleno.on('mtuChange', function(mtu) {
    console.log('on -> mtuChange: ' + mtu);
  });

  bleno.on('advertisingStart', function(error) {
    console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));

    if (!error) {
      bleno.setServices([
        new MainService()
      ]);
    }
  });

  bleno.on('advertisingStop', function() {
    console.log('on -> advertisingStop');
  });

  bleno.on('servicesSet', function(error) {
    console.log('on -> servicesSet: ' + (error ? 'error ' + error : 'success'));
  });
}

startup();
