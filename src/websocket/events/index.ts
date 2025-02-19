import { EventHandlers } from '@src/types';
import errorHandler from './error';
import playerCreateHandler from './player/playerCreate';
import playerDeleteHandler from './player/playerDelete';
import pingHandler from './ping';
import pongHandler from './pong';
import giftListHandler from './gift/giftList';
import giftClaimHandler from './gift/giftClaim';
import gtsAddHandler from './gts/gtsAdd';
import gtsTradeHandler from './gts/gtsTrade';
import gtsAllListHandler from './gts/gtsAllList';

/**
 * An object containing event handlers for various websocket events.
 *
 * @type {EventHandlers}
 */
const events: EventHandlers = {
  error: errorHandler,
  playerCreate: playerCreateHandler,
  playerDelete: playerDeleteHandler,
  ping: pingHandler,
  pong: pongHandler,
  giftList: giftListHandler,
  giftClaim: giftClaimHandler,
  gtsAdd: gtsAddHandler,
  gtsTrade: gtsTradeHandler,
  gtsAllList: gtsAllListHandler,
};

export default events;
