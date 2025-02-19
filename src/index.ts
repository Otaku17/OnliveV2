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

  await Player.clearExpiredPlayers(30);
  await Gift.clearExpiredGifts();
}

main();

export { server };
