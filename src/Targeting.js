/*
* @Author: Robert D. Cotey II <coteyr@coteyr.net>
* @Date:   2016-07-03 11:36:42
* @Last Modified by:   Robert D. Cotey II <coteyr@coteyr.net>
* @Last Modified time: 2016-11-16 15:59:14
*/

'use strict';

var Targeting = {
  getMax(array, filter) {
    var biggest = 0
    var element
    array.forEach(function(a) {
      if(filter(a) > biggest) {
        biggest = filter(a)
        element = a
      }
    })
    return element
  },
  getTransferTarget: function(pos, room) {

    if(room.hasHostiles()) {
      var towers = Finder.findTowers(room.name)
      var tower = Targeting.getMax(towers, function(t) { return t.energyCapacity - t.energy })

      if(Finder.findPresentCreepCount > 10 && tower && tower.hasRoom() && tower.storedEnergy() <= (tower.possibleEnergy() * 0.80)) return tower
      // if(tower && tower.storedEnergy() <= 100) return tower
    }
    if(pos.x < 5 || pos.x > 48 || pos.y < 5 || pos.y > 48) {
      var links = Finder.findLinks(room.name)
      var link = pos.findClosestByRange(links, {filter: function(l) { return l.energy < l.energyCapacity && l.sender() }})
      if(link) return link
    }
    // spawner -> tower -> extensions -> storage
    var spawn = Finder.findSpawn(room.name)
    if(spawn && spawn.hasRoom()) return spawn

    var extension = Targeting.findClosestNotFullExtension(pos, room.name)
    if(extension && extension.hasRoom()) return extension

    var towers = Finder.findTowers(room.name)
    var tower = Targeting.getMax(towers, function(t) { return t.energyCapacity - t.energy })
    if(tower && tower.hasRoom() && tower.storedEnergy() <= (tower.possibleEnergy() * 0.80)) return tower

    var labs = Finder.findLabs(room.name)
    var lab = Targeting.getMax(labs, function(l) { return l.energyCapacity - l.energy})
    if(lab && lab.hasRoom()) return lab

    if(room.storage) return room.storage


  },
  findMostNeedingHeals: function(pos, room) {
    var targets = pos.findInRange(FIND_MY_CREEPS, 10, {
      filter: function(object) {
          return object.hits < object.hitsMax;
      }
    });
    var lowest = 10000
    var target
    targets.forEach(function(creep){
      if(creep.hits < lowest) {
        lowest = creep.hits
        target = creep
      }
    })
    return target
  },
  /*getTransferTarget: function(pos, room) {
    var result;
    var biggest = 0;
    var objects = _.union({}, room.myCreeps(), room.memory.my_spawns, room.memory.my_extensions, room.memory.my_towers, room.memory.my_storages)
    // This may be doable with _.maxBy()
    Object.keys(objects).forEach(function(key, index) {
      var target = Game.getObjectById(objects[key].id);
      if(target.memory) {
        if (target.memory.call_for_energy) {
          if(_.size(_.filter(Game.creeps, {filter: function(c){
            return c.target === target.id
          }})) === 0) {
            if (target.memory.call_for_energy >= biggest) {
              result = target;
              biggest = target.memory.call_for_energy
            }
          }
        } else {
          // target.memory.call_for_energy = 0
          //result = target
           //biggest = 0;
        }
      } else {
       Log.warn("No Memory for: " + target.id)
      }
    }, objects);
    if(!result && room.storage) return room.storage
    return result
  },*/

  nearestHostalCreep: function(pos) {
    var target = pos.findClosestByRange(FIND_HOSTILE_CREEPS)
    return target;
  },
  nearestFriendlyCreep: function(pos){
    var target = pos.findClosestByRange(FIND_MY_CREEPS)
    return target
  },
  nearestTankCreep: function(pos){
    var targets = pos.findInRange(FIND_MY_CREEPS, 5)
    var lowest = 1
    var target
    targets.forEach(function(t){
      if ((t.hits / t.hitsMax) < lowest && t.tookDamage()) {
        lowest = (t.hits / t.hitsMax)
        target = t
      }
    })
    return target
  },

  nearestHostalSpawn: function(pos) {
    var target = pos.findClosestByRange(FIND_HOSTILE_SPAWNS)
    return target
  },

  nearestHostalStructure: function(pos) {
    return this.nearestNonController(pos, FIND_HOSTILE_STRUCTURES)
  },

  nearestStructure: function(pos) {
    return this.nearestNonController(pos, FIND_STRUCTURES)
  },

  nearestHostalRampart: function(pos) {
    var target = pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {filter: function(object){
      return object.structureType === 'rampart'
    }});
    return target
  },

  nearestNonController: function(pos, type) {
    var target = pos.findClosestByPath(type, {
        filter: function(object) {
          return object.structureType !== 'controller' && object.structureType !== 'road';
        }
      });
    return target
  },

  nearestHostalSpread: function(pos) {
    var structures = pos.findClosestByPath(FIND_STRUCTURES, {filter: {
      function(object) {
        // return !_.includes(Memory.ignores, object.id)
      }
    }})
    if (_.size(structures)) {
      Memory.spread_targets.push(structures[0].id)
      return structures[0]
    }
  },


  nearestHostalAnything: function(pos) {
    var target = this.nearestHostalCreep(pos)
    if(target) {
      return target
    }
    target = this.nearestHostalSpawn(pos);
    if(target) {
      return target
    }
    target = this.nearestHostalStructure(pos);
    if (target) {
      return target
    }
    target = this.nearestStructure(pos);
    if (target) {
      return target
    }
  },

  nearByStructures: function(pos) {
    var structures = pos.findInRange(FIND_STRUCTURES, 1)/*, {filter: {
      function(object) {
        return !_.includes(Memory.ignores, object.id)
      }
    }})*/
    if (_.size(structures)) {
      return structures[0]
    }
  },

  findFullMiner: function(pos, room) {
    var creeps = _.filter(Game.creeps, function(creep) {
      return creep.my && creep.memory.mode === 'send' && creep.room.name === room.name
    })
    var miner = pos.findClosestByRange(creeps)
    if (miner) {
      // miner.setMode('broadcast')
    }
    return miner
  },

  findEnergyBuffer: function(pos, room, mode = 'none') {
    Log.info('a')
    let links = _.filter(Finder.unbox(room, 'structures'), (l) => l.structureType === STRUCTURE_LINK && l.receiver() && l.energy > 0)
    if(_.size(links) > 0) return pos.findClosestByRange(links)
    var targets = _.filter(Finder.unbox(room, 'structures'), (s) => s.structureType === STRUCTURE_CONTAINER && s.storedEnergy() > 100)
    var buffer = pos.findClosestByRange(targets)
    Log.info('t')
    if(buffer) return buffer
    if(room.storage) return room.storage
  },

  findEnergySource: function(pos, room, mode) {
      if(!room.carrierReady() && mode !== 'carrier' && mode !== 'exo-carrier') {
        //var targets = Finder.unbox(room, 'sources')
        //return pos.findClosestByRange(targets)
        return Finder.findSourcePosition(room.name, mode)
      } else {
        return Targeting.findEnergyBuffer(pos, room, mode)
      }
  },

  findCloseContainer: function(pos, range) {
    var results = pos.findInRange(FIND_STRUCTURES, range, {filter: {structureType: STRUCTURE_CONTAINER}})
    if(_.size(results) > 0) return results[0]
  },
  findClosestContainer: function(pos, room) {
    var spots = _.filter(Finder.unbox(room, 'structures'), (s) => s.structureType === STRUCTURE_CONTAINER)
    if (_.size(spots) >= 1) {
      return pos.findClosestByRange(spots)
    }
  },

  findClosestConstruction: function(pos){
    return pos.findClosestByRange(FIND_CONSTRUCTION_SITES)
  },

  findClosestRepairTarget: function(pos, room, creep){
    var locations = room.find(FIND_STRUCTURES, {filter: function(structure) {
      if(_.includes(room.demos, structure.id)) return false
      return structure.hits < (structure.hitsMax * 0.75)  && structure.structureType !== 'constructedWall' && structure.structureType !== 'rampart'
      }})
    if(_.size(locations) > 0) {
      return pos.findClosestByRange(locations);
    } else if(room.upgradeWalls()) {
      var smallest = 0
      var targets = room.find(FIND_STRUCTURES, {filter: function(s){
        return s.structureType === 'constructedWall' || s.structureType === 'rampart'
      }})
      var target = null
      targets.forEach(function(t){
        if((t.hitsMax - t.hits) > smallest) {
          target = t
          smallest = t.hitsMax - t.hits
        }
      })
      if(!creep) {
        room.memory.energy_spent_on_walls += 150
      } else {
        room.memory.energy_spent_on_walls += creep.countPart(CARRY) * 50
      }
      return target
    }
  },

  findCloseExtension: function(pos, range){
    if(!range) range = 1
    var canidates = pos.findInRange(FIND_STRUCTURES, range, {filter: function(e){
      return e.structureType === STRUCTURE_EXTENSION && e.hasRoom()
    }})
    if(_.size(canidates) > 0) return canidates[0]
  },
  findStructureUnderneath: function(pos, structureType) {
    var canidates = pos.findInRange(FIND_STRUCTURES, 0, {filter: function(e){
      return e.structureType === structureType
    }})
    if(_.size(canidates) > 0) return canidates[0]
  },
  findRoadUnderneath: function(pos){
    return this.findStructureUnderneath(pos, STRUCTURE_ROAD)
  },
  findRampartUnderneath: function(pos){
    return this.findStructureUnderneath(pos, STRUCTURE_RAMPART)
  },
  findMyCloseCreeps: function(pos, range = 5) {
    return pos.findInRange(FIND_MY_CREEPS, range)
  },
  findClosestNotFullExtension: function(pos, roomName) {
    var canidates = Finder.findExtensions(roomName)
    return pos.findClosestByRange(canidates, {filter: function(e) { return e.hasRoom() }})
  },
  findClosestDroppedEnergy: function(pos, roomName) {
    return pos.findClosestByRange(Finder.findDropedEnergy(roomName))
  },
  findNearestDemo: function(pos, room) {
    let canidates = []
    room.memory.demos.forEach(function(id){
      let object = Game.getObjectById(id)
      if(!object) {
        room.removeDemo(id)
      } else {
        canidates.push(object)
      }
    })
    return pos.findClosestByRange(canidates)
  },
  findReaperTarget: function(pos, room) {
    var miniral = Finder.findMineral(room.name)
    if(miniral && miniral.mineralAmount > 0) {
      return miniral
    }
  },
  nearestDamagedFriendly: function(pos, room) {
    var friends = _.filter(Game.creeps, (creep) => creep.room.name == room.name && creep.hits < creep.hitsMax)
    return pos.findClosestByRange(friends)

  },
  nearestKeeperLair: function(pos, room) {
    var lair = pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {filter: function(s) {return s.structureType === STRUCTURE_KEEPER_LAIR}})
    return lair
  }




}
module.exports = Targeting;
