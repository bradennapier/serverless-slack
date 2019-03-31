/* @flow */

import * as scopes from '../../../index';

export default Object.freeze({
  addToACL: {
    title: 'Add User Permissions',
    callback_id: 'MySlackCommand.admin.addToACL',
    submit_label: 'Add',
    elements: [
      {
        label: 'User',
        type: 'select',
        name: 'uid',
        data_source: 'users',
        hint: 'User to Add',
      },
      {
        label: 'Set as Administrator?',
        type: 'select',
        name: 'isAdmin',
        value: 'false',
        options: [
          {
            label: 'Yes',
            value: 'true',
          },
          {
            label: 'No',
            value: 'false',
          },
        ],
        hint: 'Should this user be set as an Administrator?',
      },
      {
        label: 'Scopes to Allow',
        name: 'scopes',
        type: 'text',
        hint: 'For non-admins, what commands are they allowed to access?',
        value: Object.keys(scopes).join(', '),
      },
    ],
  },
});
