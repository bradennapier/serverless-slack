/* @flow */
// This will generally be split into folders for organization, but each slash command should be handled here.

/**
 * `bot` handles each request and contains all the data we need about the request, arguments, and other state.  It takes advantage
 * of how AWS Lambda operates to provide this in a guaranteed and safe way.
 *
 * bot.request, bot.state, bot.reply, bot.send are all available and will use the state of the current request to make sure
 * they do the right thing!
 */
import bot from 'bot';

import admin from './MySlackCommand/admin';

// handle /MySlackCommand ...args in slack
export const MySlackCommand = {
  meta: {
    title: 'MySlackCommand ',
    hint: 'How easy is this?! To see this run `/MySlackCommand help`',
  },
  children: {
    // full example for permission system to allow setting which users can access
    // specific functionality.
    admin,
    // each child is the next argument in the command that should have handling
    example: {
      // handle /MySlackCommand example ...args
      meta: {
        title: 'Example Slash Command',
        path: 'example',
        hint: 'An example slash command.  See this hint by running `/MySlackCommand example help`',
        example: '`/MySlackCommand example ...args`',
      },
      components: {
        commands: {
          run: {
            meta: {
              title: 'Example Run',
              hint:
                'An example command help information here see this by running `/MySlackCommand example run help`',
              example: '`/MySlackCommand example run test`',
            },
            /**
             * We can see various values here.  If we return `bot.defer` it will instead push to our SQS Queue and run
             * this commands `effects` function.
             *
             * If a function is provided, it will be run and its return value will be used as the slack response.  You
             * may do things like open dialogs, etc here as well.
             */
            async execute() {
              const { args } = bot.state;
              // args: Gives us an array of arguments provided to the command.
              await bot.dialog({
                title: 'Example Dialog',
                // provide the path to run to handle the dialog results
                callback_id: 'MySlackCommand.example.run',
                submit_label: 'Submit',
                state: JSON.stringify({ args }),
                elements: [
                  {
                    label: 'Enter Text',
                    type: 'text',
                    name: 'data',
                    hint: 'Enter something here so it can execute properly',
                  },
                ],
              });
              return `Ran Example: ${args[0] || 'NOTHING'}!`;
            },
          },
          async: {
            meta: {
              title: 'Async Example',
              hint:
                'This will run via our worker instead of directly `/MySlackCommand example async help`',
              example: '`/MySlackCommand example async`',
            },
            execute: bot.defer,
          },
        },
      },
      effects: {
        async async() {
          /**
           * This will automatically be deferred and executed within our `worker` function after the SQS Queue executes the
           * job.  We now can do things which may take more time to complete, using the `bot` request to properly send messaging
           * based on the request parameters.
           *
           * Replies can be direct message payloads or functions.  Functions are useful when positioning them elsewhere and importing.
           */
          await bot.reply({
            // link_names: true,
            // attachments: [],
            // blocks: [],
          });
        },
      },
      events: {
        async run() {
          /**
           * This will be run by the bot when our dialog executed during the `/MySlackCommand example run` command is submitted.
           */
          const { submission } = bot.request;
          const { args } = JSON.parse(bot.request.state);
          await bot.reply({
            text: `Cool Submission Bro! "${submission.data}" with args "${args.join(' ')}"`,
          });
        },
      },
      validators: {
        run() {
          /**
           * If validators are provided, they will be run against the matching dialog submission to make sure
           * the submitted data is valid, providing the appropriate errors within the dialog interface if needed.
           */
          const { submission } = bot.request;
          if (submission.data.length < 5) {
            return {
              errors: [
                {
                  name: 'data',
                  error: 'Give me more than 5 characters of text please!',
                },
              ],
            };
          }
        },
      },
    },
  },
};
