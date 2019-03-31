/* @flow */
// import bot from 'lib/bot';

const footer = 'Slackbot Admin';

export default {
  listUser: (record: Object = {}) => ({
    link_names: true,
    attachments: [
      {
        color: '#36a64f',
        fields: [
          {
            title: 'User Existed',
            value: record.uid ? 'Yes' : 'No',
          },
          {
            title: 'Admin',
            value: record.isAdmin ? 'Yes' : 'No',
          },
          Array.isArray(record.scopes)
            ? {
              title: 'Scopes',
              value: record.scopes.map(scope => `\`${scope}\``).join(', '),
            }
            : undefined,
          record.creator
            ? {
              title: 'Added By',
              value: record.creator,
            }
            : undefined,
        ],
        footer,
      },
    ],
  }),
  removedUser: (record: Object = {}) => ({
    link_names: true,
    attachments: [
      {
        color: '#36a64f',
        text: 'Successfully Removed User from ACL Table',
        fields: [
          {
            title: 'User Existed',
            value: record.uid ? 'Yes' : 'No',
          },
          {
            title: 'Admin',
            value: record.isAdmin ? 'Yes' : 'No',
          },
          Array.isArray(record.scopes)
            ? {
              title: 'Scopes',
              value: record.scopes.map(scope => `\`${scope}\``).join(', '),
            }
            : undefined,
          record.creator
            ? {
              title: 'Added By',
              value: record.creator,
            }
            : undefined,
        ],
        footer,
      },
    ],
  }),
  dmNotifyUser: (record: Object = {}) => ({
    channel: record.uid,
    link_names: true,
    attachments: [
      {
        fallback: 'You have been added or modified as a user to the Slackbot',
        text: 'You have been added or modified as a user to the Slackbot.',
        color: '#fdfa30',
        fields: [
          record.isAdmin
            ? {
              title: 'Admin',
              value: 'Yes',
            }
            : undefined,
          Array.isArray(record.scopes)
            ? {
              title: 'Scopes',
              value: record.scopes.map(scope => `\`${scope}\``).join(', '),
            }
            : undefined,
          {
            title: 'Added By',
            value: record.creator,
          },
        ],
        footer,
      },
    ],
  }),
};
