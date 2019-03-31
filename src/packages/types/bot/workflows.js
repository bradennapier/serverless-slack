/* @flow */
import type { Bot$Dialog$Creator, Bot$Command, Bot$Validator$Execute } from './components';

/* Workflows are deeply nested objects that follow a common
   schema along the way, making sure that we can automatically
   handle help requests and provide the right information to
   the channel at the right time. */
export type Bot$Workflow$Children = {
  [childID: string]: Bot$Workflow$Segment,
};

export type Bot$Component$Dialogs = {
  [dialogID: string]: Bot$Dialog$Creator,
};

export type Bot$Component$Commands = {
  [commandID: string]: Bot$Command,
};

export type Bot$Component$Validators = {
  [validatorID: string]: Bot$Validator$Execute,
};

export type Bot$Workflow$Components = {|
  /* dialogs provide interactive forms that the
     user can fill out
     @see https://api.slack.com/dialogs */
  dialogs?: Bot$Component$Dialogs,
  /* messages are selectors that are used to build messages
     that will be sent to slack
  */
  messages?: any,
  /*
    When we receive an event callback with a `callback_id` property it will get
    executed within the events object.  These events are generally asynchronous
    and will perform some action(s) and reply using the `response_url` property
    and a pre-defined message or dialog (from the properties above).

    For example, when a dialog is executed and the user submits their results
    a path to the appropriate event would be given.  This event receive the
    users inputs from the dialog, performs any required actions, and optionally
    may post updates to the user along the way.
  */
  events?: any,
  commands: Bot$Component$Commands,

  validators?: Bot$Component$Validators,

  /*
    Asynchronous Effects are executed in their own "worker thread" (lambda call)
    when we need to reply to a user in a time that may taken more than 3 seconds
    (slack maximum for synchronous replies).

    These are automatically executed if the matching value in "requests" returns
    a `bot.defer`.
  */
  effects?: {
    [effectID: string]: () => void | Promise<void>,
  },
|};

export type Bot$Workflow$Segment = {|
  meta: Bot$Workflow$Meta,
  /* Nest the command further with new children */
  children?: Bot$Workflow$Children,
  /* Provide commands, interactions, and options at this level */
  components?: Bot$Workflow$Components,
  subcommands?: Array<string>,
|};

export type Bot$Workflow$Meta = {|
  /* What should the label (title/header) be for this command? */
  title: string,
  /* What is the path / command at this level? If not provided we use the key
     in the object that was used to reach the command */
  path?: string,
  /* When the user requests help at this level, this will
     be displayed.  This should be provided at every
     level.  We will automatically provide the user with
     the available commands (children).

     Note: Slack Markdown is accepted here */
  hint: string,
  /* Optionally provide an example command to include with the output */
  example?: string,
|};
