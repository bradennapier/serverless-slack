/* @flow */
import type { Bot$Message } from '../index';
import type { Bot$Workflow$Meta } from '../workflows';

type Bot$Defer = Symbol;

export type Bot$Command$Execute = (
  ...args: Array<string>
) => Promise<Bot$Defer | void | Bot$Message> | Bot$Defer | void | Bot$Message;

export type Bot$Command = {
  meta: Bot$Workflow$Meta,
  execute: Bot$Defer | Bot$Command$Execute,
};
