/* @flow */
import bot from 'bot';
import slack from 'engine-slack/slack';

import { addUserToACL } from 'provider-aws/db/update';

import messages from './messages';

export default {
  async addToACL() {
    if (bot.request.type !== 'dialog_submission') {
      throw new Error('addToBlacklist event expects the request type to be dialog_submission');
    }
    const { submission } = bot.request;

    const row = {
      ...submission,
      isAdmin: submission.isAdmin === 'true',
      scopes: submission.scopes.split(',').map(v => v.trim().toLowerCase()),
      creator: bot.request.user.name,
      created: Date.now(),
    };

    if (row.isAdmin === false) {
      delete row.isAdmin;
    } else if (row.isAdmin === true) {
      delete row.scopes;
    }

    const { user } = await slack.getUserByID(submission.uid);

    row.username = user.name;

    await addUserToACL(row);

    await bot.send(messages.dmNotifyUser, row);
  },
};
