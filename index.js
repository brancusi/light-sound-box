var player = require('play-sound')(opts = {})
var exec = require('child_process').exec;
var util = require('util');

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

function SampleService() {
  SampleService.super_.call(this, {
    uuid: 'fffffffffffffffffffffffffffffff0',
    characteristics: [
      new WriteOnlyCharacteristic()
    ]
  });
}

util.inherits(SampleService, BlenoPrimaryService);

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
      new SampleService()
    ]);
  }
});

bleno.on('advertisingStop', function() {
  console.log('on -> advertisingStop');
});

bleno.on('servicesSet', function(error) {
  console.log('on -> servicesSet: ' + (error ? 'error ' + error : 'success'));
});


// { timeout: 300 } will be passed to child process
// var audio = player.play('foo.mp3', { timeout: 300 }, function(err){
//   if (err) throw err
// })

// configure arguments for executable if any
// player.play('foo.mp3', { afplay: ['-v', 1 ] /* lower volume for afplay on OSX */ }, function(err){
//   if (err) throw err
// })

// access the node child_process in case you need to kill it on demand
// var audio = player.play('foo.mp3', function(err){
//   if (err && !err.killed) throw err
// })
// audio.kill()

exec("/usr/bin/hciattach /dev/ttyAMA0 bcm43xx 921600 noflow -", function(err, stdout){
  console.log(err);
  console.log(stdout);

  exec("hciconfig hci0 up", function(err1, stdout1){
    console.log(err1);
    console.log(stdout1);

    bleno.on('stateChange', function(state) {
      console.log('on -> stateChange: ' + state + ', address = ' + bleno.address);

      if (state === 'poweredOn') {
        bleno.startAdvertising('test', ['fffffffffffffffffffffffffffffff0']);
      } else {
        bleno.stopAdvertising();
      }
    });
  });
});
