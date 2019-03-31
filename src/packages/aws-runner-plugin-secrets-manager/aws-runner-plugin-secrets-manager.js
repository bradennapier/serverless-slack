/* @flow */
import type { Runner$PluginInterface } from 'aws-lambda-runner';
import type { AWS$Secrets } from './types';

import secretsClientFactory from './aws-secrets';

/*
  aws-runner-plugin-secrets-manager

  This plugin is utilized to handle the capturing of secrets from our
  AWS Secrets Manager based on the user configuration.
*/
type Plugin$Settings = {|
  // where to store in our config.state object?
  stateID: 'secrets' | string,
  // what secrets should be retrieved?
  secrets: $Keys<AWS$Secrets> | Array<$Keys<AWS$Secrets>> | Set<$Keys<AWS$Secrets>>,
  region: string,
|};

type Plugin$RequiredSettings = $Shape<Plugin$Settings> & {|
  secrets: $PropertyType<Plugin$Settings, 'secrets'>,
|};

async function getSecrets<+S: $PropertyType<Plugin$Settings, 'secrets'>>(aws, secrets: S) {
  const response: $Shape<AWS$Secrets> = {};
  const promises = [];

  const getSecret = name =>
    aws.getSecretByName(name).then(value => {
      if (value) {
        response[name] = value;
        return;
      }
      throw new Error(`Failed to get secret ${name}`);
    });

  if (Array.isArray(secrets) || secrets instanceof Set) {
    secrets.forEach(secret => {
      promises.push(getSecret(secret));
    });
  } else {
    promises.push(getSecret(secrets));
  }

  await Promise.all(promises);

  return response;
}

const getPluginSettings = (settings: Plugin$RequiredSettings): Plugin$Settings => ({
  stateID: settings.stateID || 'secrets',
  secrets: settings.secrets,
  region: settings.region || (process.env.AWS_REGION: any),
});

const RunnerPluginSecretsFactory = (
  requiredSettings: Plugin$RequiredSettings,
): Runner$PluginInterface => {
  const settings = getPluginSettings(requiredSettings);
  const aws = secretsClientFactory({
    region: settings.region,
  });
  return Object.freeze({
    async onExecute(data: mixed, config) {
      const { state } = config;
      state[settings.stateID] = await getSecrets(aws, settings.secrets);
    },
  });
};

export default RunnerPluginSecretsFactory;
