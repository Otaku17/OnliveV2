import { WebSocketServer, WebSocket, Data } from 'ws';
import {
  EventHandler,
  EventHandlers,
  EventData,
  EventResponse,
} from '@src/types';
import events from '@events/index';
import { verify } from 'jsonwebtoken';
import { Player } from '@root/src/models/player';

const SECRET_KEY = process.env.SECRET_KEY as string;

/**
 * The OServer class provides a WebSocket server implementation that allows
 * for handling connections, registering event handlers, emitting events to
 * specific clients, and broadcasting events to all connected clients.
 *
 * @remarks
 * This class uses the `ws` library to create and manage WebSocket connections.
 *
 * @example
 * ```typescript
 * const server = new Server(8080);
 *
 * server.on('greet', (data, ws) => {
 *   console.log(`Received greeting: ${data}`);
 *   server.emit(ws, 'response', 'Hello, client!');
 * });
 *
 * server.broadcast('announcement', 'Server is live!');
 * ```
 *
 * @public
 * @author Ota
 */
export class Server {
  private wss: WebSocketServer;
  private eventHandlers: EventHandlers;
  private clients: Map<string, WebSocket> = new Map();

  /**
   * Creates an instance of the WebSocket server and sets up event listeners for client connections.
   *
   * @param port - The port number on which the WebSocket server will listen.
   *
   * The constructor initializes a new WebSocketServer instance with the specified port.
   *
   * Additionally, it logs a message indicating that the WebSocket server has started and is listening on the specified port.
   */
  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.eventHandlers = events;

    this.wss.on('connection', async (ws, request) => {
      const token = request.headers['authorization'] as string;

      try {
        verify(token, SECRET_KEY);

        if (token !== process.env.TOKEN_SERVER) {
          return this.rejectConnection(
            ws,
            'ERR_VALID_TOKEN',
            'Access denied. The token is no longer valid.'
          );
        }
      } catch (error) {
        return this.rejectConnection(
          ws,
          'ERR_MISSING_TOKEN',
          'Missing authentication token'
        );
      }

      const playerId = request.headers['player-id'] as string;

      if (!playerId || this.clients.has(playerId)) {
        const errorData = {
          ERR_MISSING_PLAYER_ID: {
            message: 'Missing player_id in connection request',
            code: 'ERR_MISSING_PLAYER_ID',
          },
          ERR_ALREADY_CONNECTED: {
            message: 'Player is already connected',
            code: 'ERR_ALREADY_CONNECTED',
          },
        };

        const error =
          errorData[
            !playerId ? 'ERR_MISSING_PLAYER_ID' : 'ERR_ALREADY_CONNECTED'
          ];

        return this.rejectConnection(ws, error.code, error.message);
      }

      this.clients.set(playerId, ws);
      console.log(`Player ${playerId} connected`);

      await Player.setPlayerConnectionStatus(playerId, true);

      ws.on('message', (message) => this.handleMessage(message, ws));

      ws.on('close', async () => {
        for (const [id, client] of this.clients.entries()) {
          if (client === ws) {
            this.clients.delete(id);
            console.log(`Player ${id} disconnected`);
            await Player.setPlayerConnectionStatus(playerId, false);
            break;
          }
        }
      });
    });

    console.log(`WebSocket server started on ws://localhost:${port}`);
  }

  /**
   * Registers an event handler for a specific event.
   *
   * @param event - The name of the event to listen for.
   * @param handler - The function to handle the event when it is triggered.
   */
  public on(event: string, handler: EventHandler): void {
    this.eventHandlers[event] = handler;
  }

  /**
   * Emits an event to the specified WebSocket connection.
   *
   * @param ws - The WebSocket connection to send the event to.
   * @param event - The name of the event to emit.
   * @param data - The data to send with the event.
   */
  public emit(ws: WebSocket, event: string, data: EventResponse): void {
    ws.send(JSON.stringify({ event, data }));
  }

  /**
   * Broadcasts an event with the given data to all connected WebSocket clients.
   *
   * @param event - The name of the event to broadcast.
   * @param data - The data to send with the event.
   */
  public broadcast(event: string, data: EventResponse): void {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ event, data }));
      }
    });
  }

  /**
   * Retrieves the client ID associated with the given WebSocket instance.
   *
   * @param ws - The WebSocket instance to search for.
   * @returns The client ID if found, otherwise `undefined`.
   */
  public getClientId(ws: WebSocket): string | undefined {
    for (const [id, client] of this.clients.entries()) {
      if (client === ws) {
        return id;
      }
    }

    return undefined;
  }

  /**
   * Retrieves the WebSocket connection associated with a given player ID.
   *
   * @param playerId - The unique identifier of the player.
   * @returns The WebSocket connection for the specified player, or `undefined` if no connection exists.
   */
  public getClientWebsocket(playerId: string): WebSocket | undefined {
    return this.clients.get(playerId);
  }

  /**
   * Gets the number of connected clients.
   *
   * @returns {number} The current number of clients connected to the server.
   */
  get clientsCount(): number {
    return this.clients.size;
  }

  /**
   * Gets the IDs of all connected clients.
   *
   * @returns {string[]} An array of client IDs.
   */
  get clientsIds(): string[] {
    return Array.from(this.clients.keys());
  }

  /**
   * Checks if a given player ID is already present in the clients map.
   *
   * @param playerId - The unique identifier of the player to check.
   * @returns {boolean} `true` if the player ID is not present, `false` otherwise.
   */
  public isClientIdAvailable(playerId: string): boolean {
    return !this.clients.has(playerId);
  }

  /**
   * Gets the list of WebSocket clients connected to the server.
   *
   * @returns {WebSocket[]} An array of WebSocket instances representing the connected clients.
   */
  get clientsWebsockets(): WebSocket[] {
    return Array.from(this.clients.values());
  }

  public setClientsWebsocket(playerId: string, ws: WebSocket): void {
    this.clients.set(playerId, ws);
  }

  /**
   * Handles incoming WebSocket messages by parsing the message and delegating
   * the event handling to the appropriate handler.
   *
   * @param message - The incoming message data from the WebSocket.
   * @param ws - The WebSocket connection instance.
   *
   * @throws Will log an error if the message format is invalid.
   */
  private handleMessage(message: Data, ws: WebSocket): void {
    try {
      const { event, data } = JSON.parse(message.toString());

      this.handleEvent(event, data, ws);
    } catch (error) {
      console.error('Invalid message format', error);
    }
  }

  /**
   * Handles incoming events by invoking the corresponding event handler.
   *
   * @param event - The name of the event to handle.
   * @param data - The data associated with the event.
   * @param ws - The WebSocket connection through which the event was received.
   * @returns A promise that resolves when the event has been handled.
   *
   * @throws Will log an error if the event handler throws an error.
   * @remarks
   * If no handler is found for the given event, a warning will be logged.
   */
  private async handleEvent(
    event: string,
    data: EventData,
    ws: WebSocket
  ): Promise<void> {
    const handler = this.eventHandlers[event];

    if (handler) {
      try {
        await handler(data, ws);
      } catch (error) {
        console.error(`Error handling event ${event}:`, error);
      }
    } else {
      console.warn(`No handler for event: ${event}`);
    }
  }

  private rejectConnection(ws: WebSocket, code: string, message: string): void {
    ws.send(JSON.stringify({ event: 'error', data: { error: code, message } }));
    ws.close();
  }
}
