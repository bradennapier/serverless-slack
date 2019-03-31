/* @flow */
import bot from 'bot';

import dialogs from './dialogs';

export default Object.freeze({
  add: {
    meta: {
      title: 'Add Administrator',
      hint: 'Adds a new user into the ACL System',
      example: '`/MySlackCommand admin add`',
    },
    execute() {
      // will open a dialog box asking for more information from the user
      // so that we can add it to the DynamoDB table as required.
      bot.dialog(dialogs.addToACL);
    },
  },
  get: {
    meta: {
      title: 'Get User Details',
      hint: 'Gets a users details and approved scopes',
      example: '`/MySlackCommand admin get @username`',
    },
    execute: bot.defer,
  },
  remove: {
    meta: {
      title: 'Remove User from ACL',
      hint: 'Removes access to the bot completely for a given user',
      example: '`/MySlackCommand admin remove @username`',
    },
    execute: bot.defer,
  },
});
