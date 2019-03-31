/* @flow */
import AWS from 'aws-sdk';

import { tryJSONParse } from 'utils/string';
import type { AWS$Secrets } from './types';

/*
  Instead of using environment variables we are utilizing the
  AWS Secrets Manager to allow us to safely and securely store
  our secrets and data.

  We can capture any of our secrets by name by calling the
  getSecretByName function and resolve its return promise.

  If utilizing the k/v store styling, we return a parsed
  object representing the values.  If a JSON.parse() call
  fails, we return the raw value received.

  ? NOTE: This requires the appropriate permissions are avaialble
  ?       to read/decrypt the requested secret(s).
*/

/*
  We store each requested secret as a cache so that multiple requests
  do not require additional request/decrypt requests since Secrets Manager
  charges for each decrypt request that is made.
*/
const cache: $Shape<AWS$Secrets> = {};

export function getSecretByName<S: $Keys<AWS$Secrets>>(
  client: any,
  SecretId: S,
  refresh?: boolean = false,
): Promise<$ElementType<AWS$Secrets, S>> {
  return new Promise((resolve, reject) => {
    if (!refresh && cache[SecretId]) {
      return resolve(cache[SecretId]);
    }
    client.getSecretValue(
      { SecretId },
      (err, data: { SecretString: string, SecretBinary: $ElementType<AWS$Secrets, S> }) => {
        let secret: $ElementType<AWS$Secrets, S>;
        if (err) {
          if (err.code === 'ResourceNotFoundException') reject(new Error(`The requested secret ${SecretId} was not found`));
          else if (err.code === 'InvalidRequestException') reject(new Error(`The request was invalid due to: ${err.message}`));
          else if (err.code === 'InvalidParameterException') reject(new Error(`The request had invalid params: ${err.message}`));
          else {
            reject(
              new Error(
                `An unknown error occurred while requesting secret credentials: ${err.message}`,
              ),
            );
          }
          return;
        }
        // Decrypted secret using the associated KMS CMK
        // Depending on whether the secret was a string or binary, one of these fields will be populated
        if (data.SecretString !== '') {
          secret = tryJSONParse(data.SecretString);
          if (typeof secret !== 'object') {
            reject(new Error('Invalid secret returned'));
          }
        } else {
          secret = data.SecretBinary;
        }
        cache[SecretId] = Object.freeze(secret);

        return resolve(cache[SecretId]);
      },
    );
  });
}

/**
 * Requests a secret by the given key.  If the secret has already been requested
 * during this lifecycle it will always return the cached value instead.
 *
 * @author Braden Napier
 * @date 2018-08-15
 * @export
 * @template S
 * @template $Keys
 * @example
 *
 * getSecretByName('slack_prod')
 * .then(sec => {
 *   console.log('secret', sec);
 * })
 * .catch(err => {
 *   console.error(err);
 * });
 */
type Secrets$Config = {|
  region: string,
|};

export default function secretsManagerFactory(config: Secrets$Config) {
  const client = new AWS.SecretsManager({
    endpoint: `https://secretsmanager.${config.region}.amazonaws.com`,
    region: config.region,
  });

  return Object.freeze({
    getSecretByName: <S: $Keys<AWS$Secrets>>(secretID: S, refresh?: boolean = false) =>
      getSecretByName(client, secretID, refresh),
  });
}
