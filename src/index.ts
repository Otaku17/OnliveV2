import 'dotenv/config';
import '@tasks/logger';

import { Server } from '@logic/server';
import { database_connection } from '@tasks/database';
import { Player } from './models/player';
import { Gift } from './models/gift';
import { ensureToken } from './tasks/token';
import { resolve } from 'path';

const PORT = 8080;
let server: Server;

async function main() {
  await ensureToken(resolve('./.env'));
  await database_connection();
  server = new Server(PORT);

  await Player.clearExpiredPlayers(
    process.env.DAYS_PLAYER_INACTIVE as unknown as number
  );
  await Player.clearOldFriendRequests(
    process.env.DAYS_FRIEND_INACTIVE_REQUEST as unknown as number
  );
  await Gift.clearExpiredGifts();
}

main();

export { server };
