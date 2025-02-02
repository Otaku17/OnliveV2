import 'dotenv/config';

import { Server } from '@logic/server';
import { database_connection } from '@tasks/database';

const PORT = 8080;

async function main() {
  await database_connection();
  //await server.start();
}

main();

// Créer une instance du serveur
const server = new Server(PORT);

export { server };
