/// <reference types="@cloudflare/workers-types" />

import { Router, listen } from 'worktop';
import levelup from 'levelup';
// import type { Triple, TripleKey } from 'levelgraph';
// import levelgraph from 'levelgraph';

import { CloudDOWN } from '../src';

declare var NAMESPACE: KVNamespace;

const API = new Router();

const leveldown = new CloudDOWN('NAMESPACE', { namespace: NAMESPACE });
const db = levelup(leveldown);
// const graph = levelgraph(db);

API.add('GET', '/key/:key', async (req, res) => {
  const key = req.params.key;

  try {
    const value = await db.get(key, { asBuffer: false });
    return res.send(200, value);
  } catch (error) {
    if (error.message === 'NotFound') {
      return res.send(201, null);
    }
    return res.send(500, error);
  }
});

API.add('PUT', '/key/:key', async (req, res) => {
  const key = req.params.key;

  try {
    var value = await req.body.text();
  } catch (error) {
    return res.send(400, error);
  }

  try {
    await db.put(key, value);
  } catch (error) {
    return res.send(500, error);
  }
});

API.add('DELETE', '/key/:key', async (req, res) => {
  const key = req.params.key;

  try {
    await db.del(key);
  } catch (error) {
    return res.send(500, error);
  }
});

// API.add('GET', '/graph', async (req, res) => {
//   try {
//     var key = await req.body.json<TripleKey>();
//   } catch (error) {
//     return res.send(400, error);
//   }
// 
//   try {
//     const triples = await new Promise<Array<Triple>>((resolve, reject) => {
//       graph.get(key, (error, value) => {
//         if (error) {
//           reject(error);
//           return;
//         }
//         resolve(value);
//       });
//     });
//     return res.send(200, triples);
//   } catch (error) {
//     return res.send(500, error);
//   }
// });
// 
// API.add('PUT', '/graph', async (req, res) => {
// });
// 
// API.add('DELETE', '/graph', async (req, res) => {
// });

listen(API.run);
