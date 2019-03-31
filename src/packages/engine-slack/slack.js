/* @flow */
import type { AWS$Secrets$Slack } from 'types/secrets';
import type { Slack$Payloads } from 'types/slack';
import type { Bot$Dialog, Bot$Message } from 'types/bot/components';

import bot from 'bot';

import { request, rawRequest, getRequest } from './request';

export default Object.freeze({
  reply(body: Slack$Payloads, response: Bot$Message) {
    if (!body.response_url) {
      throw new Error(
        'Slack Reply requires that "response_url" is included in the body of the original message',
      );
    }
    return rawRequest(body.response_url, response);
  },
  openDialog(body: Slack$Payloads, dialog: Bot$Dialog) {
    if (!body.token || !body.trigger_id) {
      throw new Error('Slack Dialog requires a token and trigger_id but one was missing.');
    }
    return request(
      'dialog.open',
      {
        token: body.token,
        trigger_id: body.trigger_id,
        dialog: JSON.stringify(dialog),
      },
      body,
    );
  },
  sendMessage(message: Bot$Message) {
    return request('chat.postMessage', message);
  },
  updateMessage(message: Bot$Message) {
    return request('chat.update', message);
  },
  deleteMessage(message: Bot$Message) {
    return request('chat.delete', message);
  },
  addReaction(reaction: Object) {
    return request('reactions.add', reaction);
  },
  getUserByID(uid: string) {
    const { slackSecrets }: { slackSecrets: AWS$Secrets$Slack } = bot.state.config.state;
    return getRequest('users.info', {
      token: slackSecrets.oauth_token,
      user: uid,
    });
  },
});
