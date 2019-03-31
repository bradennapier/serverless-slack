/* @flow */
import type { Bot$Interface } from 'types/bot';

import slack from 'engine-slack/slack';
import * as utils from './utils';

function handleDeferredExecution(result) {
  if (bot.state.isWorker) {
    // we do not want to allow defer from defer as it will loop
    console.error('\n\nCRITICAL ERROR: bot.defer was called from inside worker function!\n\n');
    return;
  }
  // Defer request to the worker thread,
  // respond as quickly as possible to
  // the caller.  We don't send to worker
  // queue until next tick to avoid situations
  // where the queue responds before the
  // return.
  process.nextTick(() => {
    bot.utils.addToWorkerQueue(bot.request);
  });

  if (result === bot.defer) {
    return;
  }

  return {
    text: `Please hodl while I analyze the results :parrot_smart: ${
      bot.request.command ? `of: \`${bot.request.command} ${bot.request.text}\`` : ''
    }`,
  };
}

const bot: Bot$Interface = {
  /* Used to defer execution to the worker thread and return
     the appropriate response to slack to inform the api. */
  defer: Symbol.for('@bot/defer'),

  // we need to FlowIgnore these as they will always
  // be defined during run but don't want to require
  // existence checks on every use of the properties.

  // $FlowIgnore
  state: {},
  // $FlowIgnore
  request: {},

  /*
    Our parsed workflows are presented here once
    we run bot.build(workflows).  They are given
    as two maps that are flat

    Map{
      'path.to.value' => Command | Effect | Workflow
    }
  */
  workflows: {},

  utils,

  setup(request, config) {
    Object.assign(bot, {
      request,
      state: {
        config,
        isWorker: Boolean((request && request.isWorker) || false),
        path: [],
        args: [],
        aclUser: undefined,
      },
    });
  },

  /**
   * This is a top level function that resets the bot for handling
   * a new request.
   *
   * @param {*} state
   */
  async run(request, config) {
    bot.setup(request, config);

    const result = await utils.parseRequest(bot);

    if (!result) {
      return 'Unknown Result?';
    }

    if (result === bot.defer) {
      return handleDeferredExecution(result);
    }

    const isHelpRequest = bot.state.args[bot.state.args.length - 1] === 'help';

    if (typeof result === 'object') {
      if (Array.isArray(result.errors) && result.errors.length > 0) {
        return result;
      }
      if (
        (isHelpRequest && result.meta)
        || (typeof result.execute !== 'function'
          && result.execute !== bot.defer
          && result.meta
          && result.meta.hint)
      ) {
        return {
          attachments: [
            {
              color: isHelpRequest ? '#25e019' : '#ff1c1c',
              fields: [
                !isHelpRequest
                  ? {
                    title: 'Invalid Command',
                    value: bot.request.command
                      ? `${bot.request.command} ${bot.request.text}`
                      : 'Unknown Command',
                  }
                  : undefined,
                result.meta.title
                  ? {
                    title: 'Command',
                    value: result.meta.title,
                  }
                  : undefined,
                result.meta.hint
                  ? {
                    title: 'Description',
                    value: result.meta.hint,
                  }
                  : undefined,
                result.meta.example
                  ? {
                    title: 'Example',
                    value: result.meta.example,
                  }
                  : undefined,
                Array.isArray(result.subcommands)
                  ? {
                    title: 'Authorized Scopes',
                    value: bot.state.aclUser
                      ? result.subcommands
                        .map(cmd =>
                          (bot.state.aclUser.isAdmin || bot.state.aclUser.scopes.includes(cmd)
                            ? `\`${cmd}\``
                            : undefined))
                        .filter(Boolean)
                        .join(', ') || 'None'
                      : 'None',
                  }
                  : undefined,
              ],
              footer: 'King IDEX',
            },
          ],
        };
      }

      if (typeof result.execute === 'function') {
        // Execute the function
        return result.execute();
      }

      if (result.execute === bot.defer) {
        return handleDeferredExecution(result);
      }
    }

    return result;
  },

  /* Should be called at the startup of the process with the
     bot workflows that will be parsed and used for this bot. */
  build(workflows) {
    bot.workflows = bot.utils.parseWorkflows(bot, workflows);
  },

  /**
   * Receives a Bot$Dialog$Creator (a dialog or a function taking
   * arguments and returning a dialog), creates the dialog if
   * needed by calling the creator with the given arguments, then
   * calls the Slack API with the produced dialog.
   *
   * @param {Bot$Dialog | (...args[]) => Bot$Dialog} dialogCreator
   * @param {Array<any>} args
   */
  async dialog(dialogCreator, ...args) {
    const dialog = typeof dialogCreator === 'function' ? dialogCreator(...args) : dialogCreator;

    if (typeof dialog !== 'object') {
      throw new Error('[ERROR] | [BOT] | Invalid Dialog Received');
    }

    await slack.openDialog(bot.request, dialog);
  },

  /**
   * Executes a given `messageID` and passes the messageCreator
   * any provided arguments.
   *
   * @param {*} workflow
   * @param {*} messageID
   * @param  {...any} args
   */
  async send(messageCreator, ...args) {
    const message = typeof messageCreator === 'function' ? messageCreator(...args) : messageCreator;
    if (typeof message !== 'object') {
      throw new Error('[ERROR] | [BOT] | Invalid Message Received during a bot.send() call');
    }
    const promises = [];
    if (Array.isArray(message.channel)) {
      message.channel.forEach(channel => {
        if (message.ts && message.channel) {
          if (message.delete) {
            promises.push(slack.deleteMessage({ ...message, channel }));
          } else {
            promises.push(slack.updateMessage({ ...message, channel }));
          }
        } else {
          promises.push(slack.sendMessage({ ...message, channel }));
        }
      });
    } else if (message.ts && message.channel) {
      if (message.delete) {
        promises.push(slack.deleteMessage(message));
      } else {
        promises.push(slack.updateMessage(message));
      }
    } else {
      promises.push(slack.sendMessage(message));
    }

    return Promise.all(promises);
  },

  async reply(replyCreator, ...args) {
    const message = typeof replyCreator === 'function' ? replyCreator(...args) : replyCreator;

    // TODO: Instead of logging this should post to a given channel for general errors in slack.
    if (!bot.request.response_url) {
      console.error(
        'ERROR: Response URL not found in request but tried to send a Reply! ',
        bot.request,
        message,
      );
    }

    if (typeof message !== 'object') {
      throw new Error('[ERROR] | [BOT] | Invalid Message Received during a bot.send() call');
    }

    await slack.reply(bot.request, message);
  },
};

export default bot;
