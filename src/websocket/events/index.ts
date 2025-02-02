import { EventHandlers } from '@src/types';
import errorHandler from './error';
import greetHandler from './greet';
import playerCreateHandler from './player/playerCreate';
import playerDeleteHandler from './player/playerDelete';
import pingHandler from './ping';
import pongHandler from './pong';

/**
 * An object containing event handlers for various websocket events.
 *
 * @type {EventHandlers}
 */
const events: EventHandlers = {
  greet: greetHandler,
  error: errorHandler,
  playerCreate: playerCreateHandler,
  playerDelete: playerDeleteHandler,
  ping: pingHandler,
  pong: pongHandler,
};

export default events;
