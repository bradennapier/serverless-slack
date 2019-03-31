/* @flow */

import bot from 'bot';
import * as scopes from '../../../index';

const VALID_SCOPES = Object.freeze(Object.keys(scopes));

export default {
  addToACL() {
    if (bot.request.type !== 'dialog_submission') {
      throw new Error('addToBlacklist validator expects the request type to be dialog_submission');
    }
    const { submission } = bot.request;

    const errors = [];

    const invalidScopes = [];

    submission.scopes.split(',').forEach(_scope => {
      const scope = _scope.trim().toLowerCase();
      if (!VALID_SCOPES.includes(scope)) {
        invalidScopes.push(scope);
      }
    });

    if (invalidScopes.length > 0) {
      errors.push({
        name: 'scopes',
        error: `Scopes may only include: "${VALID_SCOPES.join(', ')}"`,
      });
    }

    if (errors.length > 0) {
      return { errors };
    }
  },
};
