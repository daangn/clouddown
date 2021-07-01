/// <reference types="@cloudflare/workers-types" />

import type {
  AbstractBatch,
  AbstractOptions,
  AbstractOpenOptions,
  AbstractGetOptions,
  ErrorCallback,
  ErrorValueCallback,
} from 'abstract-leveldown';
import { AbstractLevelDOWN } from 'abstract-leveldown';

import type { K, V } from './common';
import { CloudDownError } from './common';
import type { CloudIteratorOptions } from './iterator';
import { CloudIterator } from './iterator';

import * as API from './cloudflare';

type CloudDownOptions = {
  namespace: KVNamespace,

  /**
   * @default "https://api.cloudflare.com/client/v4"
   */
  apiEndpoint?: string,

  /**
   * Fetch implementation
   *
   * @default globalThis.fetch
   */
  fetch?: typeof globalThis['fetch'],

  /**
   * requires to use batch operation
   *
   * @see https://developers.cloudflare.com/workers/runtime-apis/kv#writing-data-in-bulk
   */
  accountId?: string,

  /**
   * requires to use batch operation
   *
   * @see https://developers.cloudflare.com/workers/runtime-apis/kv#writing-data-in-bulk
   */
  namespaceId?: string,

  /**
   * requires to use batch operation
   *
   * @see https://api.cloudflare.com/#getting-started-requests 
   */
  authMethod?: API.AuthMethod,

  /**
   * @see https://developers.cloudflare.com/workers/runtime-apis/kv#cache-ttl
   */
  defaultCacheTtl?: number,
};

export class CloudDOWN extends AbstractLevelDOWN<K, V> {
  #namespace: KVNamespace;
  #apiEndpoint: string;
  #fetch: typeof globalThis['fetch'];
  #accountId?: string;
  #namespaceId?: string;
  #authMethod?: API.AuthMethod;
  #defaultCacheTtl: number;

  constructor(location: string, options: CloudDownOptions) {
    super(location);
    this.#namespace = options.namespace;
    this.#apiEndpoint = options.apiEndpoint || 'https://cloudflare.com/client/v4';
    this.#fetch = options.fetch || globalThis.fetch;
    this.#accountId = options.accountId;
    this.#namespaceId = options.namespaceId;
    this.#authMethod = options.authMethod;
    this.#defaultCacheTtl = options.defaultCacheTtl ?? 60;
  }

  async _open(
    _options: AbstractOpenOptions,
    callback: ErrorCallback,
  ): Promise<void> {
    return void callback(undefined);
  }

  async _close(callback: ErrorCallback): Promise<void> {
    return void callback(undefined);
  }

  async _put(
    key: K,
    value: V,
    options: AbstractOpenOptions & {

      /**
       * To associate some metadata with a key-value pair set metadata to any arbitrary object (must serialize to JSON) in the put options object on a put call.
       */
      metadata?: Record<string, unknown>,
    },
    callback: ErrorCallback,
  ): Promise<void> {
    const { metadata } = options;
    try {
      await this.#namespace.put(key, value, { metadata });
      return void callback(undefined);
    } catch (error) {
      return void callback(error);
    }
  }

  async _get(
    key: K,
    options: AbstractGetOptions & {
      cacheTtl?: number,
    },
    callback: ErrorValueCallback<V | void>,
  ): Promise<void> {
    const {
      asBuffer = true,
      cacheTtl = this.#defaultCacheTtl,
    } = options;

    let value: V | null = null;

    try {
      if (asBuffer) {
        value = await this.#namespace.get(key, { type: 'arrayBuffer', cacheTtl });
      } else {
        value = await this.#namespace.get(key, { type: 'text', cacheTtl });
      }
    } catch (error) {
      return callback(error);
    }

    if (value === null) {
      return callback(new CloudDownError('NotFound'));
    } else {
      return callback(undefined, value);
    }
  }

  async _del(
    key: K,
    _options: AbstractOptions,
    callback: ErrorCallback,
  ): Promise<void> {
    try {
      await this.#namespace.delete(key);
      return void callback(undefined);
    } catch (error) {
      return void callback(error);
    }
  }


  async _batch(
    ops: ReadonlyArray<AbstractBatch<K, V>>,
    _options: AbstractOptions,
    callback: ErrorCallback,
  ): Promise<void> {
    if (!this.#accountId) {
      return void callback(new CloudDownError('accountId must be specified to use batch operation'));
    }
    if (!this.#namespaceId) {
      return void callback(new CloudDownError('namespaceId must be specified to use batch operation'));
    }
    if (!this.#authMethod) {
      return void callback(new CloudDownError('authMethod is required to use batch operation'));
    }

    const puts: Array<{ key: K, value: V }> = [];
    const dels: Array<string> = [];
    for (const op of ops) {
      switch (op.type) {
        case 'put': {
          puts.push({ key: op.key, value: op.value });
          break;
        }
        case 'del': {
          dels.push(op.key);
          break;
        }
      }
    }

    try {
      const request = API.makeRequest({
        apiEndpoint: this.#apiEndpoint,
        authMethod: this.#authMethod,
      });
      await Promise.all([
        this.#fetch(request.bulkWrite({
          accountId: this.#accountId,
          namespaceId: this.#namespaceId,
          data: puts,
        })),
        this.#fetch(request.bulkDelete({
          accountId: this.#accountId,
          namespaceId: this.#namespaceId,
          keys: dels,
        })),
      ]);
    } catch (error) {
      return void callback(error);
    }
  }

  _iterator(options: CloudIteratorOptions): CloudIterator {
    throw new CloudDownError('TODO');
  }
}
