/// <reference types="@cloudflare/workers-types" />

import type { AbstractIteratorOptions } from 'abstract-leveldown';
import { AbstractIterator } from 'abstract-leveldown';

import type { K, V } from './common';
import type { CloudDOWN } from './db';

export interface CloudIteratorOptions extends AbstractIteratorOptions {
};

export class CloudIterator extends AbstractIterator<K, V> {
  constructor(db: CloudDOWN, options: CloudIteratorOptions) {
    super(db);
  }

  _next() {
  }

  _seek(target: K) {
  }

  _end() {
  }
}
