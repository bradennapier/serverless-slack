/* @flow */
/**
 * Endpoint: /message
 *
 * @summary
 *  This endpoint can be used to allow various sources to conduct messaging on behalf
 *  of the bot user.
 */
import runner from 'aws-lambda-runner';

import SecretsPlugin from 'aws-runner-plugin-secrets-manager';

import bot from 'bot';
import * as workflows from 'workflows';

bot.build(workflows);

const { SLACK_SECRETS_ID, SLACK_INTERNAL_KEY } = process.env;

const isProduction = process.env.APP_STAGE === 'prod';
const isDevelopment = !isProduction;

if (!SLACK_SECRETS_ID || !SLACK_INTERNAL_KEY) {
  throw new Error('Invalid Environment, expected SLACK_SECRETS_ID and SLACK_INTERNAL_KEY');
}

export default runner(
  {
    settings: {
      log: isDevelopment,
    },
    response: {
      headers: {
        'Content-Type': 'application/json',
      },
    },
    plugins: new Set([
      [
        SecretsPlugin({
          secrets: SLACK_SECRETS_ID,
        }),
      ],
    ]),
  },
  async (body, config) => {
    const { secret, payload } = body;

    if (secret !== SLACK_INTERNAL_KEY || typeof payload !== 'object') {
      throw new Error('Validation Failure');
    }

    const { state } = config;

    /* Need to normalize slackSecrets for stages */
    const { [SLACK_SECRETS_ID]: slackSecrets } = state.secrets;
    state.slackSecrets = slackSecrets;

    bot.setup(undefined, config);

    return bot.send(payload);
  },
);
