var player = require('play-sound')(opts = {})
var exec = require('child_process').exec;
var util = require('util');

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
  console.log("Started App");
  var bleno = require('bleno');

  var BlenoPrimaryService = bleno.PrimaryService;
  var BlenoCharacteristic = bleno.Characteristic;
  var BlenoDescriptor = bleno.Descriptor;

  var WriteOnlyCharacteristic = function() {
    WriteOnlyCharacteristic.super_.call(this, {
      uuid: 'fffffffffffffffffffffffffffffff4',
      properties: ['write', 'writeWithoutResponse']
    });
  };

  util.inherits(WriteOnlyCharacteristic, BlenoCharacteristic);

  WriteOnlyCharacteristic.prototype.onWriteRequest = function(data, offset, withoutResponse, callback) {
    console.log('WriteOnlyCharacteristic write request: ' + data.toString('hex') + ' ' + offset + ' ' + withoutResponse);

    player.play('foo1.mp3', function(err){
      if (err) throw err
    })

    callback(this.RESULT_SUCCESS);
  };

  function MainService() {
    MainService.super_.call(this, {
      uuid: 'fffffffffffffffffffffffffffffff0',
      characteristics: [
        new WriteOnlyCharacteristic()
      ]
    });
  }

  util.inherits(MainService, BlenoPrimaryService);

  bleno.on('stateChange', function(state) {
    console.log('on -> stateChange: ' + state + ', address = ' + bleno.address);

    if (state === 'poweredOn') {
      bleno.startAdvertising('Light Sound', ['fffffffffffffffffffffffffffffff0']);
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
//
// exec("/usr/bin/hciattach /dev/ttyAMA0 bcm43xx 921600 noflow -", function(err, stdout){
//   console.log("Error on the outer", err);
//   console.log(stdout);
//
//   exec("hciconfig hci0 up", function(err1, stdout1){
//     console.log("Error inner !!!!", err1);
//     console.log(stdout1);
//
//     console.log('bleno - echo');
//
//
//
//   });
// });

startBluetooth();
