import createEventHandler from '@logic/createEventHandler';
import { server } from '@root/src';
import { Gift } from '@root/src/models/gift';
import { z } from 'zod';

/**
 * Schema for validating gift claim data.
 *
 * This schema defines the structure of the gift claim data object,
 * which includes the following optional properties:
 *
 * - `id`: A string representing the unique identifier of the gift claim.
 * - `code`: A string representing the code associated with the gift claim.
 */
const GiftClaimData = z.object({
  id: z.string().optional(),
  code: z.string().optional(),
});

/**
 * Handles the 'giftClaim' event.
 *
 * @param data - The data received from the client.
 * @param ws - The WebSocket connection of the client.
 * @returns An object indicating the success or failure of the gift claim operation.
 *
 * The function performs the following steps:
 * 1. Validates the received data using `GiftClaimData.safeParse`.
 * 2. If validation fails, returns an error message.
 * 3. Retrieves the player associated with the WebSocket connection.
 * 4. If the player is not found, returns an error message.
 * 5. Attempts to claim the gift for the player using `Gift.claimGift`.
 * 6. If the gift claim is successful, returns the result.
 * 7. If an error occurs during the gift claim, logs the error and returns an error message.
 */
const giftClaimHandler = createEventHandler('giftClaim', async (data, ws) => {
  const validatedData = GiftClaimData.safeParse(data);

  if (!validatedData.success) {
    return { success: false, message: 'Invalid gift claimed data' };
  }

  const player = server.getClientId(ws);

  if (!player) {
    return { success: false, message: 'Player not found' };
  }

  try {
    const result = await Gift.claimGift(player, validatedData.data);
    return result;
  } catch (error) {
    console.error('Error claim gift:', error);
    return { success: false, message: 'Failed to claiming the gift' };
  }
});

export default giftClaimHandler;
