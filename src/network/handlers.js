/**
 * Message handlers for server events
 */

class MessageHandlers {
  constructor(gameScene) {
    this.gameScene = gameScene;
  }

  handlePlayerJoined(data) {
    console.warn('Player joined:', data.playerId);
    // Add player to game world
    if (this.gameScene) {
      this.gameScene.addPlayer(data);
    }
  }

  handlePlayerLeft(data) {
    console.warn('Player left:', data.playerId);
    // Remove player from game world
    if (this.gameScene) {
      this.gameScene.removePlayer(data.playerId);
    }
  }

  handlePlayerMoved(data) {
    // Update player position
    if (this.gameScene) {
      this.gameScene.updatePlayerPosition(data);
    }
  }

  handleNpcSpawned(data) {
    console.warn('NPC spawned:', data.npcId);
    if (this.gameScene) {
      this.gameScene.addNpc(data);
    }
  }

  handleNpcDespawned(data) {
    if (this.gameScene) {
      this.gameScene.removeNpc(data.npcId);
    }
  }

  handleCombatUpdate(data) {
    if (this.gameScene) {
      this.gameScene.updateCombat(data);
    }
  }

  handleInventoryUpdate(data) {
    console.warn('Inventory updated', data);
    // TODO: Update inventory UI
  }

  handleChatMessage(data) {
    console.warn('Chat message:', data.message);
    // Display chat message in UI
  }

  handleError(data) {
    console.error('Server error:', data.message);
  }
}

module.exports = MessageHandlers;
