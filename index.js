require('dotenv').config();

const spawn = require('child_process').spawn;
const exec = require('child_process').exec;
const util = require('util');
const GPIO = require('pi-pins');
const Rx = require('rxjs/Rx');

const pin = GPIO.connect(21);
const DEVICE_ID = process.env.DEVICE_ID;
const SOUND_MAP = {"fff0": "sound1.mp3", "fff1": "sound2.mp3", "fff2": "sound3.mp3"}
const MY_SOUND = SOUND_MAP[DEVICE_ID];

let playback = undefined;

function startup() {
  // Force volume to normal level. Fix issue with 3.5mm jack RPi 3
  exec("amixer -- sset PCM,0 -0.77dB");
  startBluetooth();
}

function startBluetooth() {
  exec("/usr/bin/hciattach /dev/ttyAMA0 bcm43xx 921600 noflow -", function(err, stdout){
    if(err) {
      // Keep trying to start bluetooth
      console.log("Error starting bluetooth");
      startBluetooth();
    } else {
      startRadio();
    }
  });
}

function startRadio() {
  exec("hciconfig hci0 up", function(err, stdout1){
    if(err) {
      // Keep trying to start the radio
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

  const bleno = require('bleno');
  const BlenoPrimaryService = bleno.PrimaryService;
  const BlenoCharacteristic = bleno.Characteristic;
  const BlenoDescriptor = bleno.Descriptor;

  const WriteOnlyCharacteristic = function() {
    WriteOnlyCharacteristic.super_.call(this, { uuid: 'fff1', properties: ['write', 'writeWithoutResponse']});
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
    if (state === 'poweredOn') {
      bleno.startAdvertising('Light Sound', [DEVICE_ID]);
    } else {
      bleno.stopAdvertising();
    }
  });

  bleno.on('advertisingStart', function(error) {
    if (!error) {
      bleno.setServices([new MainService()]);
    }
  });
}

startup();
