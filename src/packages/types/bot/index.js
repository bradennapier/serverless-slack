/* @flow */
import * as utils from 'bot/utils';
import type { Runner$RuntimeConfig } from 'aws-lambda-runner';
import type { Slack$Payloads, Slack$RequestResponse } from '../slack';
import type { Bot$Workflow$Children as Bot$Workflows } from './workflows';
import type { Bot$Dialog$Creator } from './components/dialog';
import type { Bot$Message$Creator } from './components/message';

export type {
  Bot$Workflow$Children as Bot$Workflows,
  Bot$Component$Dialogs,
  Bot$Component$Commands,
  Bot$Workflow$Segment,
} from './workflows';

export type { Bot$Dialog } from './components/dialog';
export type { Bot$Message } from './components/message';

export type Bot$Interface = {|
  defer: Symbol,
  request: Slack$Payloads,
  utils: typeof utils,
  state: {
    config: Runner$RuntimeConfig,
    isWorker: boolean,
    [key: string]: any,
  },
  workflows: any,
  setup(request?: Slack$Payloads, config: Runner$RuntimeConfig): void,
  run(request: Slack$Payloads, config: Runner$RuntimeConfig): Promise<Slack$RequestResponse>,
  build(workflows: Bot$Workflows): void,
  dialog(dialogCreator: Bot$Dialog$Creator, ...args: any[]): Promise<void>,
  send(messageCreator: Bot$Message$Creator, ...args: any[]): Promise<void>,
  reply(replyCreator: Bot$Message$Creator, ...args: any[]): Promise<void>,
|};
