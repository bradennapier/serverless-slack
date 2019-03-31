/* @flow */
import formatObject from 'utils/format-object';

const { DB_TABLE_ACL_NAME } = process.env;

if (!DB_TABLE_ACL_NAME) {
  console.error(
    '[ERROR] | DB_TABLE_ACL_NAME is not defined as an environment variable, DB_TABLE_ACL_NAME will not operate',
  );
  throw new Error(
    '[ERROR] | DB_TABLE_ACL_NAME is not defined as an environment variable, DB_TABLE_ACL_NAME will not operate',
  );
}

export default {
  meta: {
    TableName: DB_TABLE_ACL_NAME,
  },
  primary: {
    Key: (params: {}, ...objects: Array<{}>) =>
      formatObject(
        {},
        {
          uid: 'uid',
        },
        ...objects,
      ),
  },
};
