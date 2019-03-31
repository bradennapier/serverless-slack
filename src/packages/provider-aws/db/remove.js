/* @flow */
import { invokeObject } from 'utils/invoke-object';

import _ from 'lodash';
import { DOC } from './dynamodb';

import BotAclTable from './tables/BOT_ACL';

export function removeUserFromACLbyUID(
  uid: string,
  { ReturnValues = 'ALL_OLD', ...extraParams }: Object = {},
) {
  if (!uid) {
    throw new Error(`Failed to remove from ACL Table: Invalid Arguments, no uid given: ${uid}`);
  }

  const params = _.merge(
    { ReturnValues, ...extraParams },
    invokeObject(
      {
        ...BotAclTable.meta,
        ...BotAclTable.primary,
      },
      {},
      { uid },
    ),
  );

  return DOC.delete(params)
    .promise()
    .then(result => result.Attributes)
    .catch(err => {
      console.error('[DYNAMODB ERROR]: Failed to delete from ACL Table: ', uid);
      console.error(err);
      throw err;
    });
}
