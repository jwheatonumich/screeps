#!/bin/sh
# @Author: Robert D. Cotey II <coteyr@coteyr.net>
# @Date:   2016-06-26 05:59:51
# @Last Modified by:   Robert D. Cotey II <coteyr@coteyr.net>
# @Last Modified time: 2016-10-26 20:09:44
rm main.js
cat src/* >> main.js
cp main.js /home/coteyr/.config/Screeps/scripts/screeps.com/default/
cp screeps-profiler.js /home/coteyr/.config/Screeps/scripts/screeps.com/default/

node ./upload.js

cp main.js /home/coteyr/.config/Screeps/scripts/games_coteyr_net___21050/default/
cp screeps-profiler.js /home/coteyr/.config/Screeps/scripts/games_coteyr_net___21050/default/
cp msgpack.min.js /home/coteyr/.config/Screeps/scripts/games_coteyr_net___21050/default/
cp buffer.js /home/coteyr/.config/Screeps/scripts/games_coteyr_net___21050/default/
