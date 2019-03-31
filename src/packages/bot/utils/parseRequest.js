/* @flow */
import type { Bot$Interface } from 'types/bot';
import { getACLByUID } from 'provider-aws/db/get';
import { trimLeft } from './string';

type Request$Parsed = Object | Symbol | string | void;

export async function parseRequest(bot: Bot$Interface): Promise<Request$Parsed> {
  const { request, state } = bot;
  if (request.type) {
    switch (request.type) {
      case 'url_verification': {
        /*
          url_verification events pose a challenge
          to confirm the bot is responding as it is
          expected to respond.  We directly reply to
          these events when they are received rather than
          any kind of parsing of our workflows.
        */
        return {
          challenge: request.challenge,
        };
      }
      case 'event_callback': {
        console.error('EVENT_CALLBACK NOT YET FINISHED!');
        break;
      }
      /* Events are all handled the same way and the workflow
         at the expected path is expected to handle the
         appropriate actions themselves. */

      case 'dialog_submission':
      case 'interactive_message': {
        if (!state.isWorker) {
          /* If a validator exists, run the validator fn - if it returns an empty response, return bot.defer.
             otherwise return bot.defer */
          const validator = bot.workflows.validators.get(request.callback_id);
          return validator ? validator.execute() || bot.defer : bot.defer;
        }
        return bot.workflows.events.get(request.callback_id);
      }
      default: {
        console.warn(
          '[UNHANDLED EVENT] | Received an unhandled event from the Slack API: ',
          request.type,
          JSON.stringify(request, null, 2),
        );
        return `Unknown Request Method ${request.type} received :parrot_confused:`;
      }
    }
  } else if (request.command && request.response_url) {
    /* Slash Commands are parsed by finding the
       closest matching command and sending the
       given command any arguments if included
       as part of the execution of the function. */
    state.path.push(trimLeft(request.command, '/'), ...request.text.split(' '));

    let joinedDescriptorPath = state.path.join('.');
    let map;

    if (state.isWorker) {
      map = bot.workflows.effects;
    } else {
      map = bot.workflows.commands;
    }

    while (state.path.length > 0 && !map.has(joinedDescriptorPath)) {
      state.args.unshift(state.path.pop());
      joinedDescriptorPath = state.path.join('.');
    }

    const isHelpRequest = state.args[state.args.length - 1] === 'help';

    const acl = await getACLByUID(request.user_id);
    state.aclUser = acl;

    if (!state.isWorker) {
      const scope = state.path[1];

      if (!scope && !isHelpRequest) {
        throw new Error(
          `Invalid Command, unknown scope while trying to execute \`${request.command} ${
            request.text
          }\``,
        );
      }

      if (scope) {
        if (!acl || (!acl.isAdmin && (!Array.isArray(acl.scopes) || !acl.scopes.includes(scope)))) {
          await bot.send({
            channel: '<TODO>',
            link_names: true,
            attachments: [
              {
                text: 'Unauthorized Command Attempted @here',
                color: '#ff0606',
                fields: [
                  {
                    title: 'Requested by User',
                    value: request.user_name || 'Unknown User',
                  },
                  {
                    title: 'Command Scope',
                    value: scope,
                  },
                ],
              },
            ],
          });
          throw new Error(
            `You are not authorized to access scope "${scope}", please contact an administrator if you believe you should have access.`,
          );
        }
      }
    }

    return map.get(joinedDescriptorPath);
  }
}
