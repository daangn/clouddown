export type K = string;
export type V = string | ArrayBuffer;

export class CloudDownError extends Error {
  name = 'CloudDownError';
}
