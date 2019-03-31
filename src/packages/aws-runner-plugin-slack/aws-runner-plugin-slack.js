/* @flow */
import crypto from 'crypto';

import type { Runner$PluginInterface } from 'aws-lambda-runner';

import type { Slack$Payloads } from 'types/slack';

type Slack$Payload$String = {|
  +payload: string,
|};

/*
  Slack Validator Plugin

  ? IMPORTANT: Must receive secrets (be synchronous after retrieval)

  Parses the received payload and confirms that the request is
  valid and should be accepted.  If it determines that a request
  is either invalid or malicious it will throw an error.
*/
type Plugin$Settings = {|
  stateID: 'slackPayload' | string,
  secretsStateID: 'secrets' | string,
  slackSecretsID: string,
  validateToken: boolean | true,
  validateSignature: boolean | true,
  validatePayload: boolean | true,
|};

type Plugin$RequiredSettings = $Shape<Plugin$Settings>;

/**
 * @author Braden Napier
 * @date 2018-08-21
 * @param {Slack$Payloads} payload
 * @param {AWS$Secrets.slack} secrets
 */
function validatePayload(payload, secrets) {
  if (typeof payload !== 'object') {
    throw new TypeError('Invalid Payload');
  }
  if (payload.team_id && secrets.team_id && payload.team_id !== secrets.team_id) {
    throw new TypeError('Invalid TeamID Received');
  }
}

/**
 *
 * @see https://api.slack.com/docs/verifying-requests-from-slack
 * @see https://github.com/slackapi/node-slack-interactive-messages/blob/master/src/http-handler.js#L62
 * @author Braden Napier
 * @date 2018-08-21
 * @param {Runner$RuntimeConfig} config
 * @param {AWS$Secrets.slack} settings
 */
function validateSignature(config, secrets) {
  const receivedSignature = config.request.headers['x-slack-signature'];
  const timestamp = Number(config.request.headers['x-slack-request-timestamp']);
  const rawBody = String(config.request.body);

  if (!receivedSignature || Number.isNaN(timestamp) || !rawBody) {
    throw new Error('Failed to Validate Slack Signature (headers)');
  }

  // Divide current date to match Slack ts format
  // Subtract 5 minutes from current time
  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 60 * 5;

  if (timestamp < fiveMinutesAgo) {
    throw new Error('Failed to Validate Slack Signature (timestamp)');
  }

  const hmac = crypto.createHmac('sha256', secrets.signing_secret.toString());
  const [version, hash] = receivedSignature.split('=');
  hmac.update(`${version}:${timestamp}:${rawBody}`);

  if (hash !== hmac.digest('hex')) {
    throw new Error('Failed to Validate Slack Signature');
  }
}

/**
 *  ! Since this is deprecated by slack, when enabled we do very
 *  ! quick and dirty checks just to be safe, it should never be
 *  ! depended upon, signature validation must be used.
 *
 * https://api.slack.com/docs/verifying-requests-from-slack#verification_token_deprecation
 *
 * @author Braden Napier
 * @date 2018-08-21
 * @param {Slack$Payloads} payload
 * @param {AWS$Secrets.slack} secrets
 * @param {boolean} signatureValidated Was the signature already validated?
 * @deprecated
 */
function validateToken(payload, secrets, signatureValidated) {
  if (!payload.token && !signatureValidated) {
    // when signature validation is disabled, the token must be
    // found or we can not securely accept the payload
    throw new Error('Invalid Slack Verification Token');
  } else if (payload.token && payload.token !== secrets.verification_token) {
    throw new Error('Failed to Validate Slack Verification Token');
  }
}

const getPluginSettings = (settings?: Plugin$RequiredSettings = {}): Plugin$Settings => ({
  /* Since we may further parse the slack payload, we save the parsed payload to the config.state[settings.stateID] */
  stateID: settings.stateID || 'slackPayload',
  /* If a custom stateID is utilized to capture the secrets, provide it here. */
  secretsStateID: settings.secretsStateID || 'secrets',
  slackSecretsID: settings.slackSecretsID || 'slack_development',
  /* Validate signature scheme? */
  validateSignature: settings.validateSignature !== false,
  /* Validate verificationToken in payload? */
  // * This is deprecated but we still parse it by default
  validateToken: settings.validateToken !== false,
  /* Validate payload when applicable? */
  // * Validates various values that are potential such as team_id when
  // * we have it in our secrets
  validatePayload: settings.validatePayload !== false,
});

const RunnerPluginSlackValidatorFactory = (
  requiredSettings?: Plugin$RequiredSettings,
): Runner$PluginInterface => {
  const settings = getPluginSettings(requiredSettings);

  return Object.freeze({
    onExecute(_data: Slack$Payloads | Slack$Payload$String, config) {
      const data = _data || config.request.queries;

      const { [settings.slackSecretsID]: secrets } = config.state[settings.secretsStateID];

      if (typeof secrets !== 'object') {
        throw new Error('Failed to retrieve secrets data, slack request could not be validated.');
      }

      let payload: Slack$Payloads;

      if (typeof data.payload === 'string') {
        payload = (JSON.parse(data.payload): Slack$Payloads);
      } else {
        // Flow is stupid af
        // $FlowIgnore
        payload = data;
      }

      if (typeof payload !== 'object') {
        throw new Error(`Expected payload to be an object but received ${typeof payload}`);
      }

      if (settings.validateSignature) {
        validateSignature(config, secrets);
      }

      if (settings.validatePayload) {
        validatePayload(payload, secrets);
      }

      if (settings.validateToken) {
        validateToken(payload, secrets, settings.validateSignature);
      }

      const { state } = config;

      // save to our stateID in config.state
      state[settings.stateID] = payload;
      state.slackSecrets = secrets;
    },
  });
};

export default RunnerPluginSlackValidatorFactory;
