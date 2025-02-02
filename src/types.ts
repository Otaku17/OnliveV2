import { WebSocket } from 'ws';

/**
 * Represents a generic event data object where keys are strings and values can be of any type.
 *
 * @interface EventData
 * @property {unknown} [key: string] - A property of the event data object with a string key and a value of any type.
 */
export interface EventData {
  [key: string]: unknown;
}

/**
 * Represents a response from an event handler.
 *
 * This interface allows for dynamic properties where the key is a string
 * and the value can be of any type.
 *
 * @interface EventResponse
 * @property {unknown} [key: string] - A property of the event response with a string key and a value of any type.
 */
export interface EventResponse {
  [key: string]: unknown;
}

/**
 * Type definition for an event handler function.
 *
 * @param data - The event data to be processed by the handler.
 * @param ws - The WebSocket instance associated with the event.
 */
export type EventHandler = (data: EventData, ws: WebSocket) => Promise<void>;

/**
 * A dictionary of event handlers where the key is the event name and the value is the corresponding event handler.
 *
 * @interface EventHandlers
 * @property {EventHandler} [event] - The event handler for the specified event.
 */
export interface EventHandlers {
  [event: string]: EventHandler;
}
