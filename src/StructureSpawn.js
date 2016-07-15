/*
* @Author: Robert D. Cotey II <coteyr@coteyr.net>
* @Date:   2016-06-26 05:53:53
* @Last Modified by:   Robert D. Cotey II <coteyr@coteyr.net>
* @Last Modified time: 2016-07-15 01:03:40
*/

'use strict';

StructureSpawn.prototype.tick = function() {
  Log.debug('Ticking Spawn: ' + this.name + ' Mode: ' + this.memory.mode + " - " + this.memory.refresh_count);
  this.promoteCreeps();
  this.assignMode();
  this.spawnCreeps();
  this.doWork();
  this.doErSpawn();
  this.refreshData();
  Memory.stats["room." + this.room.name + ".spawnQueue"] = _.size(this.memory.spawn_queue)


}
StructureSpawn.prototype.promote = function(from, to) {
  Log.warn("Promoting " +  from + " to " + to)
    Finder.findCreeps(from, this.room.name).forEach(function(creep) {
      creep.memory.role = to
      creep.setMode('idle')
    })
}

StructureSpawn.prototype.setMaximums = function() {
  if(_.size(this.room.find(FIND_CONSTRUCTION_SITES)) > 0) {
    this.memory.max_builders = 1
    this.memory.max_upgraders = 0
  } else {
    this.memory.max_builders = 0
    this.memory.max_upgraders = 1
  }
  this.memory.max_carriers = (this.memory.max_miners) * 1
  var sources = _.size(this.room.find(FIND_SOURCES))
  if (this.room.controller && this.room.controller.my && this.room.controller.level >= 4) {
    this.memory.max_harvesters = 0
    this.memory.max_miners = sources
  } else {
    this.memory.max_harvesters = sources
    this.memory.max_miners = 0
  }
}

StructureSpawn.prototype.promoteCreeps = function() {
  if(this.harvesters() >  this.maxHarvesters()) {
    this.promote('harvester', 'carrier')
  }

  if(this.builders() > this.maxBuilders()) {
    this.promote('builder', 'harvester')
  }
}
StructureSpawn.prototype.spawnACreep = function(role, body)  {
  this.room.cleanCreeps()
  Log.info("Spawning A " + role + " in " + this.room.name)
  if(this.memory.creeper) {
    Memory.creeper += 1
  } else {
    Memory.creeper = 1
  }
  var result = this.createCreep(body, role + "_" + Memory.creeper, {role: role, mode: 'idle', home: this.room.name})
  if(result !== role + "_" + Memory.creeper) {
    Log.error('Problem Spawning Creep: ' + result)
    Log.error(role + ": " + JSON.stringify(body))
  }
}
StructureSpawn.prototype.refreshData = function() {
  if(!this.memory.refresh_count || this.memory.refresh_count <= 0) {
    var roles = [
    { role: 'exo-attacker',  arrayName: 'attack',  multiplyer: 10, priority: 10, body: [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE] },
    { role: 'exo-builder',   arrayName: 'build',   multiplyer: 4,  priority: 30, body: [WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE] },
    { role: 'exo-harvester', arrayName: 'harvest', multiplyer: 4,  priority: 20, body: [WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE] },
    { role: 'exo-claimer',   arrayName: 'claim',   multiplyer: 1,  priority: 10, body: [CLAIM, CLAIM, MOVE, MOVE] },
    { role: 'exo-reserver',  arrayName: 'reserve', multiplyer: 1,  priority: 10, body: [CLAIM, CLAIM, MOVE, MOVE] },
    { role: 'exo-theif',     arrayName: 'steal',   multiplyer: 2,  priority: 20, body: [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE]}
    ]
    var spawn = this
    roles.forEach(function(role) {
      spawn.setExoCount(role.role)
      spawn.setMaxExoCount(role.role, role.arrayName, role.multiplyer)
    })

    this.memory.refresh_count = 10;
    this.setMaximums()
    this.setHarvesters()
    this.setMiners()
    this.setCarriers()
    this.setUpgraders()
    this.setBuilders()
  }
  this.memory.refresh_count -= 1;
}

StructureSpawn.prototype.assignMode = function() {
  if(!this.memory.mode) {
    Log.warn("No current mode for Spawn " + this.name)
    this.setMode('idle')
  }
  if(!this.memory.mode || this.memory.mode === 'idle') {
    if (this.energy < this.energyCapacity) {
      this.setMode('wait-energy')
    } else {
      this.setMode('idle')
    }
  } else if (this.memory.mode === 'spawning' && this.spawning === null ) {
      this.setMode('idle')
  }
  /*if (this.room.energyAvailable >= 300 && (this.miners() <= 0 || this.carriers() <= 0)) {
    this.setMode('er-spawn')
  }*/
}

StructureSpawn.prototype.doWork = function() {
  if(this.memory.mode === 'idle' || this.memory.mode === 'wait-energy') {
    this.spawnFromQueue()
  }
  if (this.memory.mode === 'wait-energy') {
    this.doWaitEnergy();
  }
  /*if (this.memory.mode === 'er-spawn') {
    this.doErSpawn();
  }*/
}



StructureSpawn.prototype.doWaitEnergy = function() {
  if(this.energy < this.energyCapacity) {
    if (this.memory.call_for_energy) {
      this.memory.call_for_energy = this.memory.call_for_energy + 25
    } else {
      this.memory.call_for_energy = 1
    }
  }
}

StructureSpawn.prototype.doErSpawn = function() {
  if (Finder.findRealCreepCount('harvester', this) === 0 && this.maxHarvesters > 0) {
    Log.info("ER Spawn Harvester")
    this.spawnACreep('harvester', [MOVE, MOVE, CARRY, CARRY, WORK])
  } else if (Finder.findRealCreepCount('miner', this) === 0) {
    Log.info("ER Spawn Miner")
    this.spawnACreep('miner', [MOVE, MOVE, CARRY, CARRY, WORK])
  } else if (Finder.findRealCreepCount('carrier', this) === 0) {
    Log.info("ER Spawn Carrier")
    this.spawnACreep('carrier', [MOVE, MOVE, CARRY, CARRY])
  } else {
    this.setMode('idle')
  }

}

StructureSpawn.prototype.spawnCreeps = function() {
  // What kind of creep
  if (this.harvesters() < this.maxHarvesters()) {
    this.spawnHarvester();
  }
  if (this.builders() < this.maxBuilders()) {
    this.spawnBuilder();
  }
  if (this.miners() < this.maxMiners()) {
    this.spawnMiner();
  }
  if (this.carriers() < this.maxCarriers()) {
    this.spawnCarrier()
  }
  if (this.upgraders() < this.maxUpgraders()) {
    this.spawnUpgrader()
  }
  var roles = [
    { role: 'exo-attacker',  arrayName: 'attack',  multiplyer: 10, priority: 10, body: [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE] },
    { role: 'exo-builder',   arrayName: 'build',   multiplyer: 4,  priority: 30, body: [WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE] },
    { role: 'exo-harvester', arrayName: 'harvest', multiplyer: 4,  priority: 20, body: [WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE] },
    { role: 'exo-claimer',   arrayName: 'claim',   multiplyer: 1,  priority: 10, body: [CLAIM, CLAIM, MOVE, MOVE] },
    { role: 'exo-reserver',  arrayName: 'reserve', multiplyer: 1,  priority: 10, body: [CLAIM, CLAIM, MOVE, MOVE] },
    { role: 'exo-theif',     arrayName: 'steal',   multiplyer: 2,  priority: 20, body: [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE]}
  ]
  var spawner = this
  roles.forEach(function(role) {
    if (spawner.getExoCount(role.role) < spawner.getMaxExoCount(role.role)) {
      // this.spawnExoClaimer()
      spawner.spawnExoCreep(role.role, role.body, role.priority)
    }
  })
}

StructureSpawn.prototype.addToSpawnQueue = function(role, body,  priority) {
  if(!this.memory.spawn_queue) {
    this.memory.spawn_queue = []
  }
  if(!this.spawning) {
    var array = this.memory.spawn_queue
    array.push({role: role, body: body, priority: priority})
    this.memory.spawn_queue = array
    Log.warn("Spawn Queue is now " + _.size(array) + " long")
    Log.warn("Added a " + role)
  }
}

StructureSpawn.prototype.spawnFromQueue = function() {
  var array = this.memory.spawn_queue
  if (array) {
    array = _.sortBy(array, function(a) {
      a.priority;
    })
    if(array.length > 0) {

      var creep = array[0] //shift()
      Log.info("Trying to Spawn a " + creep.role + " in " + this.room.name)
      if (this.canCreateCreep(creep.body) === 0 && !this.spawning){ // && this.canCreateCreep(creep.body)){
        array.shift()
        this.spawnACreep(creep.role, creep.body)

      } else if(this.canCreateCreep(creep.body) == ERR_INVALID_ARGS) {
        array.shift()
        Log.error("Invalid Creep Body Detected")
      }
    }
    this.memory.spawn_queue = array
  }
}
