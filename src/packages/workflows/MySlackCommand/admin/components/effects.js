/* @flow */
import { getACLByUID } from 'provider-aws/db/get';
import { removeUserFromACLbyUID } from 'provider-aws/db/remove';

import bot from 'bot';

import messages from './messages';

const GET_UID_RE = /^<@([^|]*)/;

export default {
  async get() {
    const [user] = bot.state.args;

    const [, uid] = GET_UID_RE.exec(user) || [];

    let userACL;

    if (uid) {
      userACL = (await getACLByUID(uid)) || {};
    } else {
      userACL = {};
    }

    bot.reply(messages.listUser, userACL);
  },
  async remove() {
    const [user] = bot.state.args;

    const [, uid] = GET_UID_RE.exec(user) || [];

    let userACL;

    if (uid) {
      userACL = await getACLByUID(uid);
    }

    if (userACL && !userACL.isSuperAdmin) {
      await removeUserFromACLbyUID(uid);
    }

    bot.reply(messages.removedUser, userACL);
  },
};
