import { z } from 'zod';
import createEventHandler from '@logic/createEventHandler';
import { Player } from '@models/player';

const PlayerCreateData = z.object({
  player_id: z.string(),
  name: z.string(),
  is_girl: z.boolean(),
  charset_base: z.string().optional(),
});

/**
 * Handles the 'playerCreate' event by validating the provided data and creating a new player.
 *
 * @param data - The data received from the 'playerCreate' event.
 * @returns An object indicating the success or failure of the player creation process.
 *
 * @example
 * // Example data object
 * const data = {
 *   player_id: '12345',
 *   name: 'John Doe',
 *   is_girl: false
 * };
 *
 * // Example response on success
 * {
 *   success: true,
 *   message: 'Player John Doe created successfully',
 *   friend_code: 'ABCDE12345'
 * }
 *
 * // Example response on failure
 * {
 *   success: false,
 *   message: 'Invalid player data'
 * }
 *
 * // Example response on error
 * {
 *   success: false,
 *   message: 'Failed to create player'
 * }
 */
const playerCreateHandler = createEventHandler('playerCreate', async (data) => {
  const validatedData = PlayerCreateData.safeParse(data);

  if (!validatedData.success) {
    return { success: false, message: 'Invalid player data' };
  }

  try {
    const _data = await Player.create({
      id: validatedData.data.player_id,
      name: validatedData.data.name,
      isGirl: validatedData.data.is_girl,
    });

    return {
      success: true,
      message: `Player ${validatedData.data.name} created successfully`,
      friend_code: _data.friendCode,
    };
  } catch (error) {
    console.error('Error creating player:', error);
    return { success: false, message: 'Failed to create player' };
  }
});

export default playerCreateHandler;
