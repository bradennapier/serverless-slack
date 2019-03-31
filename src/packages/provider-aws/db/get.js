/* @flow */
import { invokeObject } from 'utils/invoke-object';
import _ from 'lodash';
import { DOC } from './dynamodb';

import BotAclTable from './tables/BOT_ACL';

export function getACLByUID(uid: string, extraParams?: Object = {}) {
  if (!uid) {
    throw new Error('[ERROR] | [DB] | Failed to get ACL, uid is required');
  }

  return DOC.get(
    _.merge(
      { ...extraParams },
      invokeObject(
        {
          ...BotAclTable.meta,
          ...BotAclTable.primary,
        },
        {},
        { uid },
      ),
    ),
  )
    .promise()
    .then(result => Object.freeze(result.Item))
    .catch(err => {
      console.error('[DYNAMODB ERROR]: Failed to Get ACL by UID: ', uid);
      console.error(err);
      throw err;
    });
}
