/**
 * A class representing a hash map with various utility methods.
 *
 * @template T - The type of the values in the hash.
 */
class Hash<T> {
  [key: string]: unknown;
  private data: Record<string, T>;

  /**
   * Creates an instance of the Hash class.
   *
   * @template T - The type of the values in the hash.
   * @param {Record<string, T>} obj - The object to initialize the hash with.
   *
   * @returns {Proxy<Hash<T>>} A proxy that intercepts property access.
   *
   * The constructor initializes the `data` property by iterating over the keys of the provided object.
   * If a key starts with a colon (':'), it removes the colon from the key.
   * If the value associated with a key is an object (but not an array), it recursively creates a new Hash instance.
   * Otherwise, it assigns the value directly.
   *
   * The returned proxy intercepts property access:
   * - If the property name starts with a colon, it returns the corresponding value from `data` without the colon.
   * - If the property name exists in the target, it returns the corresponding value from the target.
   * - Otherwise, it returns the corresponding value from `data`.
   */
  constructor(obj: Record<string, T>) {
    this.data = {};

    for (const key in obj) {
      const cleanedKey = key.startsWith(':') ? key.slice(1) : key;
      const value = obj[key];

      this.data[cleanedKey] =
        value && typeof value === 'object' && !Array.isArray(value)
          ? (new Hash(value as Record<string, unknown>) as unknown as T)
          : value;
    }

    return new Proxy(this, {
      get(target, prop: string | symbol) {
        if (typeof prop === 'string' && prop.startsWith(':')) {
          return target.data[prop.slice(1)];
        } else if (typeof prop === 'string' && prop in target) {
          return (target as Hash<T>)[prop];
        }
        return target.data[prop as string];
      },
    });
  }

  /**
   * Retrieves the value associated with the specified key.
   *
   * @param key - The key whose associated value is to be returned.
   * @returns The value associated with the specified key, or `undefined` if the key does not exist.
   */
  get(key: string): T | undefined {
    return this.data[key];
  }

  /**
   * Checks if the given key exists in the data.
   *
   * @param key - The key to check for existence.
   * @returns `true` if the key exists, otherwise `false`.
   */
  has(key: string): boolean {
    return key in this.data;
  }

  /**
   * Converts the current Hash instance to a plain object.
   *
   * @returns {Record<string, T>} A plain object representation of the Hash instance.
   * If a value in the Hash is another Hash instance, it recursively converts it to a plain object.
   */
  toObject(): Record<string, T> {
    return Object.keys(this.data).reduce((acc, key) => {
      acc[key] =
        this.data[key] instanceof Hash
          ? (this.data[key].toObject() as unknown as T)
          : this.data[key];
      return acc;
    }, {} as Record<string, T>);
  }

  /**
   * Merges the current Hash object with another object.
   *
   * @param obj - The object to merge with the current Hash.
   * @returns A new Hash instance containing the merged key-value pairs.
   */
  merge(obj: Record<string, T>): Hash<T> {
    return new Hash({ ...this.toObject(), ...obj });
  }

  /**
   * Retrieves the keys of the data object.
   *
   * @returns {string[]} An array of strings representing the keys of the data object.
   */
  keys(): string[] {
    return Object.keys(this.data);
  }

  /**
   * Retrieves all the values stored in the hash.
   *
   * @returns {T[]} An array containing all the values in the hash.
   */
  values(): T[] {
    return Object.values(this.data);
  }

  /**
   * Applies a callback function to each key-value pair in the hash and returns a new hash with the results.
   *
   * @template U - The type of the values in the new hash.
   * @param {function(T, string): U} callback - The function to apply to each key-value pair. It receives the value and key as arguments and should return the new value.
   * @returns {Hash<U>} A new hash with the results of applying the callback function to each key-value pair.
   */
  map<U>(callback: (value: T, key: string) => U): Hash<U> {
    const mapped = Object.entries(this.data).reduce((acc, [key, value]) => {
      acc[key] = callback(value, key);
      return acc;
    }, {} as Record<string, U>);
    return new Hash(mapped);
  }

  /**
   * Filters the entries of the hash based on a provided callback function.
   *
   * @param callback - A function that takes a value of type `T` and a key of type `string`,
   * and returns a boolean indicating whether the entry should be included in the filtered result.
   * @returns A new `Hash` instance containing only the entries that satisfy the callback condition.
   */
  filter(callback: (value: T, key: string) => boolean): Hash<T> {
    const filtered = Object.entries(this.data).reduce((acc, [key, value]) => {
      if (callback(value, key)) acc[key] = value;
      return acc;
    }, {} as Record<string, T>);
    return new Hash(filtered);
  }

  /**
   * Iterates over each key-value pair in the data object and executes the provided callback function.
   *
   * @param callback - A function to execute for each key-value pair. It receives the value and key as arguments.
   */
  forEach(callback: (value: T, key: string) => void): void {
    Object.entries(this.data).forEach(([key, value]) => callback(value, key));
  }

  /**
   * Reduces the entries of the data object to a single value using the provided callback function.
   *
   * @template U - The type of the accumulated value.
   * @param callback - A function that is called for each entry in the data object. It receives the accumulated value, the current entry's value, and the current entry's key as arguments.
   * @param initialValue - The initial value to start the accumulation with.
   * @returns The accumulated value after processing all entries in the data object.
   */
  reduce<U>(
    callback: (acc: U, value: T, key: string) => U,
    initialValue: U
  ): U {
    return Object.entries(this.data).reduce(
      (acc, [key, value]) => callback(acc, value, key),
      initialValue
    );
  }

  /**
   * Extracts the values associated with the specified key from an array of objects.
   *
   * @template K - The type of the key to pluck from each object.
   * @param {K} key - The key whose values are to be extracted.
   * @returns {any[]} An array of values corresponding to the specified key from each object in the data.
   */
  pluck<K extends keyof T>(key: K): any[] {
    return Object.values(this.data)
      .map((value) =>
        value && typeof value === 'object' ? (value as any)[key] : undefined
      )
      .filter((value) => value !== undefined);
  }

  /**
   * Creates a new instance of the Hash class with the same data as the current instance.
   *
   * @returns {Hash<T>} A new Hash instance containing the same data as the current instance.
   */
  clone(): Hash<T> {
    return new Hash(this.toObject());
  }

  /**
   * Converts the current object to a hash string representation.
   *
   * The method serializes the object into a string format, handling nested objects,
   * arrays, and instances of the `Hash` class. The serialization format uses a
   * Ruby-like syntax for hashes and arrays.
   *
   * @returns {string} The serialized hash string representation of the object.
   */
  toHash(): string {
    const serializeValue = (value: any): string => {
      if (value instanceof Hash) {
        return `{ ${Object.entries(value.toObject())
          .map(([key, val]) => `:${key} => ${serializeValue(val)}`)
          .join(', ')} }`;
      }

      if (Array.isArray(value)) {
        return `[${value.map(serializeValue).join(', ')}]`;
      }

      if (typeof value === 'object') {
        return `{ ${Object.entries(value)
          .map(([key, val]) => `:${key} => ${serializeValue(val)}`)
          .join(', ')} }`;
      }

      if (typeof value === 'string') {
        return `"${value}"`;
      }

      return String(value); // Pour les autres types (numériques, booléens, etc.)
    };

    const serializedObj = Object.entries(this.data)
      .map(([key, value]) => `:${key} => ${serializeValue(value)}`)
      .join(', ');

    return `{ ${serializedObj} }`;
  }

  /**
   * Converts a Ruby hash string representation into a TypeScript `Hash` object.
   *
   * @param rubyString - The Ruby hash string to convert.
   * @returns A `Hash` object containing the parsed values from the Ruby hash string.
   *
   * The function handles the following conversions:
   * - `'true'` to `true`
   * - `'false'` to `false`
   * - `'nil'` to `null`
   * - Numeric strings to `number`
   * - Nested hashes and arrays
   * - String values (removing surrounding quotes)
   *
   * Example:
   * ```typescript
   * const rubyString = "{ 'key1' => 'value1', 'key2' => 'true', 'key3' => '123' }";
   * const hash = Hash.fromRuby(rubyString);
   * console.log(hash); // Hash { key1: 'value1', key2: true, key3: 123 }
   * ```
   */
  static fromRuby(rubyString: string): Hash<unknown> {
    const parseValue = (value: string): any => {
      if (value === 'true') return true;
      if (value === 'false') return false;
      if (value === 'nil') return null;
      if (/^\d+$/.test(value)) return parseInt(value, 10);

      if (value.startsWith('{') && value.endsWith('}')) {
        return Hash.fromRuby(value.slice(1, -1));
      }

      if (value.startsWith('[') && value.endsWith(']')) {
        return value
          .slice(1, -1)
          .split(',')
          .map((val) => parseValue(val.trim()));
      }

      return value.slice(1, -1);
    };

    const cleanedString = rubyString.replace(/\s+/g, '').slice(1, -1);

    const entries = cleanedString
      .split(/, ?(?=:)/)
      .map((pair) => pair.split('=>').map((val) => val.trim()));

    const obj: Record<string, any> = {};

    for (const [key, value] of entries) {
      obj[key.slice(1)] = parseValue(value);
    }

    return new Hash(obj);
  }
}
