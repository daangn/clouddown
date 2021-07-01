import type { K, V } from './common';

export type AuthMethod = (
  | {
    method: 'API_TOKEN',
    apiToken: string,
  }
  | {
    method: 'API_KEY',
    apiKey: string,
    email: string,
  }
);

interface MakeAuthHeaders {
  (props: {
    authMethod: AuthMethod,
  }): Record<string, string>; 
}

/**
 * @see https://api.cloudflare.com/#getting-started-requests
 */
export const makeAuthHeaders: MakeAuthHeaders = ({
  authMethod,
}) => {
  type Headers = Record<string, string>;

  switch (authMethod.method) {
    case 'API_KEY': {
      return {
        'X-Auth-Key': authMethod.apiKey,
        'X-Auth-Email': authMethod.email,
      } as Headers;
    }
    case 'API_TOKEN': {
      return {
        'Authorization': `Bearer ${authMethod.apiToken}`,
      } as Headers;
    }
  }
};

interface MakeUrl {
  (props: {
    apiEndpoint: string,
  }): {

    /**
     * @see https://api.cloudflare.com/#accounts-account-details
     */
    account(props: {
      accountId: string,
    }): string;

    namespace(props: {
      accountId: string,
      namespaceId: string,
    }): string;

    /**
     * @see https://api.cloudflare.com/#workers-kv-namespace-write-multiple-key-value-pairs
     * @see https://api.cloudflare.com/#workers-kv-namespace-delete-multiple-key-value-pairs
     */
    namespaceBulk(props: {
      accountId: string,
      namespaceId: string,
    }): string;
  };
}

export const makeUrl: MakeUrl = ({
  apiEndpoint,
}) => {
  return {
    account({ accountId }) {
      return new URL(
        `accounts/${accountId}`,
        apiEndpoint,
      ).href;
    },
    namespace({ accountId, namespaceId }) {
      return new URL(
        this.account({ accountId }) + `/storage/kv/namespaces/${namespaceId}`,
        apiEndpoint,
      ).href;
    },
    namespaceBulk({ accountId, namespaceId }) {
      return new URL(
        this.namespace({
          accountId,
          namespaceId,
        }) + `/bulk`,
        apiEndpoint,
      ).href;
    },
  };
};

interface MakeRequest {
  (props: {
    apiEndpoint: string,
    authMethod: AuthMethod,
  }): {

    /**
     * @see https://api.cloudflare.com/#workers-kv-namespace-write-multiple-key-value-pairs
    */
    bulkWrite(props: {
      accountId: string,
      namespaceId: string,
      data: Array<{
        key: string,
        value: V,
      }>
    }): Request,

    /**
     * @see https://api.cloudflare.com/#workers-kv-namespace-delete-multiple-key-value-pairs
    */
    bulkDelete(props: {
      accountId: string,
      namespaceId: string,
      keys: string[],
    }): Request,
  };
}

export const makeRequest: MakeRequest = ({
  apiEndpoint,
  authMethod,
}) => {
  const url = makeUrl({ apiEndpoint });
  const headers = makeAuthHeaders({ authMethod });

  return {
    bulkWrite({ accountId, namespaceId, data }) {
      return new Request(url.namespaceBulk({ accountId, namespaceId }), {
        method: 'PUT',
        headers: new Headers({
          ...headers,
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(data),
      });
    },
    bulkDelete({ accountId, namespaceId, keys }) {
      return new Request(url.namespaceBulk({ accountId, namespaceId }), {
        method: 'DELETE',
        headers: new Headers({
          ...headers,
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(keys),
      });
    },
  };
};
