type RequireOnlyOne<T, Keys extends keyof T = keyof T> = (
  & Pick<T, Exclude<keyof T, Keys>>
  & {
    [K in Keys]-?: (
      & Required<Pick<T, K>>
      & Partial<Record<Exclude<Keys, K>, undefined>>
    )
  }[Keys]
);

declare module 'levelgraph' {
  import type { ErrorValueCallback, ErrorCallback } from 'abstract-leveldown';
  import type { LevelUp } from 'levelup';
  
  type OneOrMany<T> = T | T[];

  export type Triple = {
    subject: string,
    predicate: string,
    object: string,
  };

  export type TripleKey = RequireOnlyOne<Triple>; 

  type OperationProperty = {
    limit?: number,
    offset?: number,
    revers?: boolean,
  };

  interface Levelgraph {
    get(key: TripleKey & OperationProperty, callback: ErrorValueCallback<Array<Triple>>): void;
    put(triples: OneOrMany<Triple>, callback: ErrorCallback): void;
  }

  export default function levelgraph(levelup: LevelUp): Levelgraph;
}
