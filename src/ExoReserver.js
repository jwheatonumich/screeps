/*
* @Author: Robert D. Cotey II <coteyr@coteyr.net>
* @Date:   2016-06-26 20:09:07
* @Last Modified by:   Robert D. Cotey II <coteyr@coteyr.net>
* @Last Modified time: 2016-07-16 23:32:15
*/

'use strict';


Creep.prototype.assignTravelExoReserverTasks = function() {
  if(this.memory.mode !== 'transition') {
    this.setMode('leave')
  }
}

Creep.prototype.setupExoReserverMemory = function() {
  this.chooseExoTarget('reserve')
}


Creep.prototype.assignHomeExoReserverTasks = function() {
  this.setMode('leave');
}

Creep.prototype.assignRemoteExoReserverTasks = function() {
  if(this.memory.mode === 'transition') {
    // this.setMode('mine')
  } else {
      if(this.memory.role === 'exo-reserver') {
        this.setMode('reserve')
      } else {
        this.setMode('claim')
      }
  }
}

Creep.prototype.doReserve = function() {
  if(this.moveCloseTo(this.room.controller.pos.x, this.room.controller.pos.y, 1)) {
    this.reserveController(this.room.controller)
  }
}

Creep.prototype.doClaim = function() {
  if(this.moveCloseTo(this.room.controller.pos.x, this.room.controller.pos.y, 1)) {
    this.claimController(this.room.controller)
  }
}

