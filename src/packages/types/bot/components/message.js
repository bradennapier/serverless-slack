/* @flow */

export type Bot$Message$Creator = ((...args: any[]) => Bot$Message) | Bot$Message;

export type Bot$Message$Field = {|
  title: string,
  value: string,
  short?: boolean,
|};

export type Bot$Message$Attachment = {|
  fallback?: string,
  pretext?: string,
  text?: string,
  color?: string,
  fields?: Array<void | Bot$Message$Field>,
  footer?: string,
|};

export type Bot$Message = {|
  response_type?: 'in_channel',
  delete?: boolean,
  ts?: string,
  channel?: string,
  text?: string,
  pretext?: string,
  link_names?: boolean,
  attachments?: Array<void | Bot$Message$Attachment>,
  footer?: string,
|};
