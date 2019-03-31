/* @flow */
/**
 * Endpoint: /webhook
 *
 * @summary
 *  This is the starting point for our slack commands.  Slack will execute this endpoint
 *  as the "webhook" endpoint.  It will then be validated using the recommended slack
 *  validation procedures before executing our function.
 */
import type { Slack$Payloads } from 'types/slack';

import runner from 'aws-lambda-runner';
import SecretsPlugin from 'aws-runner-plugin-secrets-manager';
import SlackValidatorPlugin from 'aws-runner-plugin-slack';

import bot from 'bot';
import * as workflows from 'workflows';

bot.build(workflows);

const isProduction = process.env.APP_STAGE === 'prod';
const isDevelopment = !isProduction;

const { SLACK_SECRETS_ID, SLACK_COMMAND_DEVELOPMENT, SLACK_COMMAND_PRODUCTION } = process.env;

if (!SLACK_SECRETS_ID) {
  throw new Error('Invalid Environment, expected SLACK_SECRETS_ID');
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
      // asynchronous plugin resolution
      [
        // synchronous plugin resolution
        /**
         * Will capture our secrets from secrets manager and cache them for
         * future executions.  This greatly reduces cost and latency.
         */
        SecretsPlugin({
          secrets: SLACK_SECRETS_ID,
        }),
        /**
         * Once our secrets are captured, we can then use them in other
         * plugins.  By using a `Set`, we can resolve multiple in parallel.
         */
        new Set([
          // asynchronous plugin resolution
          /**
           * Slack payloads include a set of validation rules that allow us
           * to make sure this request is coming from slack and not from some
           * other source.
           */
          SlackValidatorPlugin({
            slackSecretsID: SLACK_SECRETS_ID,
          }),
        ]),
      ],
    ]),
  },
  async (body, config) => {
    const request: Slack$Payloads = config.state.slackPayload;
    // if slash command is /dev we switch to /idex
    if (request.command === SLACK_COMMAND_DEVELOPMENT) {
      request.command = SLACK_COMMAND_PRODUCTION;
    }
    if (isDevelopment) {
      console.log('Slack Payload: ', JSON.stringify(request, null, 2));
    }
    try {
      if (config.request.isProxy) {
        switch (config.request.method) {
          case 'POST': {
            const result = await bot.run(request, config);
            return result;
          }
          default: {
            throw new Error('Invalid Request Method');
          }
        }
      }
      throw new Error('Internal Server Error');
    } catch (err) {
      /**
       * Whenever an error occurs during execution we want to catch it and let the user know
       * that something did not work as expected.
       */
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
  },
);
