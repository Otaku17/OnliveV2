import createEventHandler from '@logic/createEventHandler';
import { Player } from '@root/src/models/player';
import { server } from '@src/index';

/**
 * Handles the 'playerDelete' event.
 *
 * @param event - The name of the event.
 * @param handler - The asynchronous function to handle the event.
 * @returns An object indicating the success or failure of the player deletion operation.
 */
const playerDeleteHandler = createEventHandler(
  'playerDelete',
  async (_, ws) => {
    const player = server.getClientId(ws);

    if (!player) {
      return { success: false, message: 'Player not found' };
    }

    try {
      const result = await Player.deleteOne({ id: player });

      if (result.deletedCount === 0) {
        return {
          success: true,
          message: 'Player deletion interrupted, no player found',
        };
      }

      return { success: true, message: 'Player deleted successfully' };
    } catch (error) {
      console.error('Error deleting player:', error);
      return { success: false, message: 'Failed to delete player' };
    }
  }
);

export default playerDeleteHandler;
