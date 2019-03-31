/* @flow */

import { invokeObject } from 'utils/invoke-object';
import { getUpdateExpression } from 'utils/dynamodb-update-expression';

import _ from 'lodash';
import { DOC } from './dynamodb';

import BotAclTable from './tables/BOT_ACL';

export function addUserToACL(
  { uid, ...row }: Object,
  prevACL?: Object,
  { ReturnValues = 'NONE', ...extraParams }: Object = {},
) {
  if (!uid) {
    throw new Error(
      `Failed to Update IDEX ACL Table: Invalid Arguments, no uid given: ${uid} ${JSON.stringify(
        row,
        null,
        2,
      )}`,
    );
  }

  const params = _.merge(
    { ReturnValues, ...extraParams },
    invokeObject(
      {
        ...BotAclTable.meta,
        ...BotAclTable.primary,
        ...getUpdateExpression(row, prevACL),
        ReturnValues,
      },
      row,
      { uid },
    ),
  );

  return DOC.update(params)
    .promise()
    .then(result => result.Attributes)
    .catch(err => {
      console.error('[DYNAMODB ERROR]: Failed to ACL Table:', uid, row);
      console.error(err);
      throw err;
    });
}
