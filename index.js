var fs = require('fs');
var lame = require('../');
var Speaker = require('speaker');

fs.createReadStream("foo1.mp3")
  .pipe(new lame.Decoder)
  .on('format', console.log)
  .pipe(new Speaker);
