import { readFile, writeFile } from 'fs/promises';
import { sign } from 'jsonwebtoken';

const TOKEN_SERVER_KEY = 'TOKEN_SERVER';
const TOKEN_API_KEY = 'TOKEN_API';
const SECRET_KEY_SERVER = process.env.SECRET_KEY;
const SECRET_KEY_API = process.env.SECRET_KEY_API;

async function ensureToken(pathDir: string): Promise<void> {
  try {
    const envFileContent = await readFile(pathDir, 'utf-8');
    let tokenUpdated = false;

    if (!process.env[TOKEN_SERVER_KEY] && SECRET_KEY_SERVER) {
      const tokenServer = sign({ server: 'online_v2' }, SECRET_KEY_SERVER);
      process.env[TOKEN_SERVER_KEY] = tokenServer;
      tokenUpdated = true;

      let envContent = envFileContent;
      const tokenPatternServer = new RegExp(`^${TOKEN_SERVER_KEY}=.*$`, 'm');

      if (tokenPatternServer.test(envFileContent)) {
        envContent = envFileContent.replace(
          tokenPatternServer,
          `${TOKEN_SERVER_KEY}=${tokenServer}`
        );
      } else {
        envContent += `\n${TOKEN_SERVER_KEY}=${tokenServer}`;
      }

      await writeFile(pathDir, envContent, 'utf8');
    }

    if (!process.env[TOKEN_API_KEY] && SECRET_KEY_API) {
      const tokenApi = sign({ api: 'pocketnet' }, SECRET_KEY_API);
      process.env[TOKEN_API_KEY] = tokenApi;
      tokenUpdated = true;

      let envContent = await readFile(pathDir, 'utf-8');
      const tokenPatternApi = new RegExp(`^${TOKEN_API_KEY}=.*$`, 'm');

      if (tokenPatternApi.test(envContent)) {
        envContent = envContent.replace(
          tokenPatternApi,
          `${TOKEN_API_KEY}=${tokenApi}`
        );
      } else {
        envContent += `\n${TOKEN_API_KEY}=${tokenApi}`;
      }

      await writeFile(pathDir, envContent, 'utf8');
    }

    if (tokenUpdated) {
      console.warn(`
        =======================================================================
        ⚠️  Important Notice: New authentication tokens have been generated. ⚠️
      
        - The API token is used for handling HTTP requests.
        - The Server token is used for managing WebSocket connections for the game client.
      
        For the API and server to function properly, please restart the server now.
      
        The new tokens can be found in the .env file located at the root of 
        the server. These tokens are required for making requests.
      
        Failure to restart the server will prevent the processing of API 
        requests and WebSocket connections.
      
        Thank you for your prompt attention to this matter.
        =======================================================================
      `);

      process.exit(1);
    }
  } catch (error) {
    console.error(`Failed to ensure tokens: ${error}`);
  }
}

export { ensureToken };
