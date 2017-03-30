# Light Sound Box

Built using Resin.io

This is a music and light box. When the master node sends signals, this will play the linked audio file as well as send __HIGH__ to pin 21.

## ENV Vars
**DEVICE_ID** : The device id, used to map the sound file. Currently, hardcoded to options: fff0, fff1, fff2 - {"fff0": "sound1.mp3", "fff1": "sound2.mp3", "fff2": "sound3.mp3"}
