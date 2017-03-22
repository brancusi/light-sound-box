var player = require('play-sound')(opts = {})
var exec = require('child_process').exec;



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

    console.log('bleno - echo');

    var bleno = require('bleno');

    var BlenoPrimaryService = bleno.PrimaryService;

    var EchoCharacteristic = require('./char');

    bleno.on('stateChange', function(state) {
      console.log('on -> stateChange: ' + state);

      if (state === 'poweredOn') {
        bleno.startAdvertising('echo', ['ec00']);
      } else {
        bleno.stopAdvertising();
      }
    });

    bleno.on('advertisingStart', function(error) {
      console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));

      if (!error) {
        bleno.setServices([
          new BlenoPrimaryService({
            uuid: 'ec00',
            characteristics: [
              new EchoCharacteristic()
            ]
          })
        ]);
      }
    });



  });
});
