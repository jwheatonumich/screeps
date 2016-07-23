/*
* @Author: Robert D. Cotey II <coteyr@coteyr.net>
* @Date:   2016-06-26 20:09:07
* @Last Modified by:   Robert D. Cotey II <coteyr@coteyr.net>
* @Last Modified time: 2016-07-22 18:03:23
*/

'use strict';

Creep.prototype.setupExoCarrierMemory = function() {
  this.chooseExoTarget('carry')
}

Creep.prototype.assignTravelExoCarrierTasks = function() {
  if(this.carry.energy >= this.carryCapacity && this.memory.mode !== 'transition') {
    this.setMode('go-home')
  } else if (this.memory.mode !== 'transition') {
    this.setMode('leave')
  }
}

Creep.prototype.assignHomeExoCarrierTasks = function() {
  if(this.memory.mode !== 'transition') {
    if(this.carry.energy <= 0) {
      this.setMode('leave');
    } else {
      this.setMode('transfer');
    }
  }
}

Creep.prototype.assignRemoteExoCarrierTasks = function() {
  if(this.memory.mode === 'transition' || this.memory.mode != 'idle') {
    // this.setMode('mine')
  } else {
    if (this.carry.energy < this.carryCapacity) {
      this.setMode('pickup')
    } else if (this.carry.energy >= this.carryCapacity) {
      this.setMode('go-home')
    }
  }
}


Creep.prototype.doLeave = function() {
  this.gotoRoom(this.memory.exo_target)
}
