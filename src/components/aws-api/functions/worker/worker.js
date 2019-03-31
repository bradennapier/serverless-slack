/* @flow */
/**
 * Endpoint: /worker
 *
 * @summary
 *  This endpoint is run by our SQS Queue and allows us to take more time to
 *  process a request.  It will be triggered whenever a given workflow returns
 *  `bot.defer` and will include one or more requests to be handled.
 */
import type { Slack$Payloads } from 'types/slack';
import runner from 'aws-lambda-runner';

import resolveSequentially from 'utils/resolve-sequentially';

import SecretsPlugin from 'aws-runner-plugin-secrets-manager';

import bot from 'bot';
import * as workflows from 'workflows';

bot.build(workflows);

const { SLACK_SECRETS_ID, SLACK_COMMAND_PRODUCTION, SLACK_COMMAND_DEVELOPMENT } = process.env;

const isProduction = process.env.APP_STAGE === 'prod';
const isDevelopment = !isProduction;

if (!SLACK_SECRETS_ID) {
  throw new Error('Invalid Environment, expected SLACK_SECRETS_ID');
}

/**
 * Each job from our SQS Queue will be run sequentially.
 */
async function runRequest(request, config) {
  try {
    await bot.run(request, config);
  } catch (err) {
    await Promise.all([
      request.response_url
        && bot
          .reply({
            text: `*ERROR During Request:* ${err.message}`,
          })
          .catch(() => {}),
      bot
        .send({
          channel: 'idex-bot',
          text: `*ERROR During Request: *${err.message}\n\n${JSON.stringify(request)}\n${
            err.stack
          }`,
        })
        .catch(() => {}),
    ]);
  }
}

export default runner(
  {
    settings: {
      log: isDevelopment,
    },
    plugins: new Set([
      SecretsPlugin({
        secrets: SLACK_SECRETS_ID,
      }),
    ]),
  },
  async (body = {}, config) => {
    // we normalize the slackSecrets value since we need to dynamically adjust this
    const { state } = config;
    state.slackSecrets = state.secrets[SLACK_SECRETS_ID];

    if (Array.isArray(body.Records) && body.Records.length > 0) {
      await resolveSequentially(
        body.Records.map(job => {
          const request: Slack$Payloads = JSON.parse(job.body);
          /**
           * We set `isWorker` to `true` which will indicate to the bot that
           * it is ok for it to execute the asynchronous handlers for each given
           * command.
           */
          request.isWorker = true;
          if (request.command === SLACK_COMMAND_DEVELOPMENT) {
            request.command = SLACK_COMMAND_PRODUCTION;
          }
          return () => runRequest(request, config);
        }),
      );
    }
  },
);
