import { set } from 'mongoose';
import { Schema, Document, model, Model } from 'mongoose';

/**
 * Represents a player in the system.
 *
 * @interface IPlayer
 * @extends {Document}
 *
 * @property {string} id - The unique identifier for the player.
 * @property {string} name - The name of the player.
 * @property {boolean} [isGirl] - Optional flag indicating if the player is a girl.
 * @property {string} [charsetBase] - Optional base character set for the player.
 * @property {string} [greeting] - Optional greeting message from the player.
 * @property {string} friendCode - The friend code of the player.
 * @property {string[]} friends - List of friend IDs associated with the player.
 * @property {Date} lastConnection - The date and time of the player's last connection.
 * @property {boolean} isConnect - Flag indicating if the player is currently connected.
 */
interface IPlayer extends Document {
  id: string;
  name: string;
  isGirl?: boolean;
  charsetBase?: string;
  greeting?: string;
  friendCode: string;
  friends: string[];
  lastConnection: Date;
  isConnect: boolean;
  isLinked: boolean;
}

/**
 * Interface representing the player model.
 * Extends the base Model interface with additional player-specific methods.
 */
interface IPlayerModel extends Model<IPlayer> {
  /**
   * Ensures that a player exists with the given data.
   * If the player does not exist, it will be created.
   *
   * @param playerData - Partial data of the player to ensure.
   * @returns A promise that resolves to an object containing:
   * - `success`: A boolean indicating if the operation was successful.
   * - `player`: The player object if the operation was successful.
   * - `message`: An optional message providing additional information.
   */
  ensurePlayer(
    playerData: Partial<IPlayer>
  ): Promise<{ success: boolean; player?: IPlayer; message?: string }>;

  /**
   * Sets the connection status of a player.
   *
   * @param playerId - The ID of the player whose connection status is to be set.
   * @param isConnected - A boolean indicating the player's connection status.
   * @returns A promise that resolves to the updated player object.
   */
  setPlayerConnectionStatus(
    playerId: string,
    isConnected: boolean
  ): Promise<IPlayer>;

  /**
   * Sets the linked status of a player.
   *
   * @param playerId - The unique identifier of the player.
   * @param isLinked - A boolean indicating whether the player is linked (true) or not (false).
   * @returns A promise that resolves to the updated player object.
   */
  setPlayerLinkedStatus(playerId: string, isLinked: boolean): Promise<IPlayer>;

  /**
   * Deletes multiple documents from the collection where the `lastConnection` field
   * is less than or equal to the current time.
   *
   * @returns {Promise<number>} A promise that resolves to the result of the delete operation.
   */
  clearExpiredPlayers(days: number): Promise<number>;
}

/**
 * Schema definition for the Player model.
 *
 * @typedef {Object} IPlayer
 * @property {string} id - Unique identifier for the player. Required and must be unique.
 * @property {string} name - Name of the player. Required.
 * @property {boolean} isGirl - Indicates if the player is a girl. Defaults to true.
 * @property {string} [charsetBase] - Optional charset base for the player.
 * @property {string} [greeting] - Optional greeting message for the player.
 * @property {string} friendCode - Unique friend code for the player. Defaults to a random string.
 * @property {string[]} friends - List of friend IDs. Defaults to an empty array.
 * @property {Date} lastConnection - Timestamp of the player's last connection. Defaults to the current date and time.
 * @property {boolean} isConnect - Indicates if the player is currently connected. Defaults to false.
 */
const SPlayer = new Schema<IPlayer>({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  name: { type: String, required: true },
  isGirl: { type: Boolean, default: true },
  charsetBase: { type: String },
  greeting: { type: String },
  friendCode: {
    type: String,
    default: function () {
      return Math.random().toString(36).substring(2, 10);
    },
    unique: true,
  },
  friends: { type: [String], default: [] },
  lastConnection: { type: Date, default: Date.now },
  isConnect: { type: Boolean, default: false },
});

/**
 * Ensures a player exists in the database. If the player does not exist, it creates a new player.
 *
 * @function ensurePlayer
 * @memberof SPlayer
 * @param {Partial<IPlayer>} userData - Partial data of the player to ensure.
 * @returns {Promise<{ success: boolean; user?: IPlayer; message?: string }>} - Result of the operation.
 */
SPlayer.statics.ensurePlayer = async function (
  playerData: Partial<IPlayer>
): Promise<{ success: boolean; player?: IPlayer; message?: string }> {
  const existingPlayer = await this.exists({ id: playerData.id });

  if (existingPlayer) {
    return { success: false, message: 'Player already exists' };
  }

  try {
    const newPlayer = await this.create(playerData);
    return {
      success: true,
      player: newPlayer,
      message: 'Player created successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: `Error creating player: ${error}`,
    };
  }
};

/**
 * Updates the connection status of a player and sets the last connection time to the current date and time.
 *
 * @function setPlayerConnectionStatus
 * @memberof SPlayer
 * @param {string} playerId - The unique identifier of the player.
 * @param {boolean} isConnected - The new connection status of the player.
 * @returns {Promise<IPlayer | null>} - The updated player document, or null if no player was found.
 */
SPlayer.statics.setPlayerConnectionStatus = async function (
  playerId: string,
  isConnected: boolean
): Promise<IPlayer> {
  return this.findOneAndUpdate(
    { id: playerId },
    { isConnect: isConnected, lastConnection: new Date() },
    { new: true }
  );
};

/**
 * Deletes multiple documents from the collection where the `lastConnection` field
 * is less than or equal to the current time.
 *
 * @returns {Promise<number>} A promise that resolves to the result of the delete operation.
 */
SPlayer.statics.clearExpiredPlayers = async function (
  days: number
): Promise<number> {
  const now = new Date();
  now.setDate(now.getDate() - days);

  try {
    const result = await this.deleteMany({
      lastConnection: { $lte: now },
    });
    console.log(
      `${result.deletedCount} expired players removed (last connection before ${
        now.toISOString().split('T')[0]
      }).`
    );
    return result.deletedCount || 0;
  } catch (error) {
    console.error('Error clearing expired players:', error);
    return 0;
  }
};

/**
 * Updates the linked status of a player in the database.
 *
 * @param playerId - The unique identifier of the player.
 * @param isLinked - A boolean indicating whether the player is linked or not.
 * @returns A promise that resolves to the updated player object.
 */
SPlayer.statics.setPlayerLinkedStatus = async function (
  playerId: string,
  isLinked: boolean
): Promise<IPlayer> {
  return this.findOneAndUpdate(
    { id: playerId },
    { isLinked: isLinked },
    { new: true }
  );
};

/**
 * Represents the Player model.
 *
 * @constant
 * @type {Model<IPlayer, IPlayerModel>}
 * @param {string} name - The name of the model.
 * @param {Schema} schema - The schema definition for the model.
 */
const Player = model<IPlayer, IPlayerModel>('Player', SPlayer);

export { Player, IPlayer };
