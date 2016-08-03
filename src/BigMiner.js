/*
* @Author: Robert D. Cotey II <coteyr@coteyr.net>
* @Date:   2016-06-28 02:56:12
* @Last Modified by:   Robert D. Cotey II <coteyr@coteyr.net>
* @Last Modified time: 2016-08-03 18:58:02
*/

'use strict';

Creep.prototype.assignBigMinerTasks = function() {
  if(this.freshCreep()) this.killSmallMiners() // first tick
  if(this.modeIs('idle')) {
    if(this.hasRoom()) this.setMode('big-mine')
    if(this.isFull()) this.setMode('send')
  }
}

Creep.prototype.doBigMine = function() {
  if(this.needsTarget()) this.setTarget(Finder.findLargestSource(this.room.name))
  if(this.hasTarget()) {
    var target = this.target()
    this.getCloseAndAction(target, this.harvest(target), 1)
    if(target.energy < 20 && target.ticksToRegeneration > 20) {
      this.clearTarget()
      this.doBigSend()
    }
  }
  if(this.isFull()) {
    this.setMode('big-send')
    this.doBigSend()
  }
}

Creep.prototype.killSmallMiners = function() {
  Finder.findCreeps('miner', this.room.name).forEach(function(creep){
    creep.setMode('recycle')
  })
}

Creep.prototype.doBigSend = function() {
  var containers = Targeting.findCloseContainer(this.pos, 1)
  if (_.size(containers) > 0) {
    this.setMode('big-mine')
    this.dumpResources(containers[0])
  } else {
    this.setMode('idle')
  }
}
