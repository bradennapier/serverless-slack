/* @flow */

export type Slack$VerificationToken = string;
export type Slack$TeamID = string;
export type Slack$ResponseURL = string;

export type Slack$Message = {};

export type Slack$RequestResponse = void | string | Slack$Message;

export type Slack$SharedLinkDescriptor = {|
  +url: string,
  +domain: string,
|};

export type Slack$TeamDescriptor = {|
  +id: string,
  +domain: string,
|};

export type Slack$UserDescriptor = {|
  +id: string,
  +name: string,
|};

export type Slack$ChannelDescriptor = {|
  +id: string,
  +name: string,
|};

export type Slack$ActionsDescriptor = {|
  +name: string,
  +type: 'button',
  +value: string,
|};

/*
{
    "token": "bgdsfsdfds",
    "team_id": "sdfsdf",
    "api_app_id": "sdfsdf",
    "event": {
        "type": "link_shared",
        "user": "<masked>",
        "channel": "<masked>",
        "message_ts": "<masked>",
        "links": [
            {
                "url": "https://etherscan.io/address/0xa7a7899d944fe658c4b0a1803bab2f490bd3849e",
                "domain": "etherscan.io"
            }
        ],
        "is_app_in_channel": true
    },
    "type": "event_callback",
    "authed_teams": [
        "asdasd"
    ],
    "event_id": "asdsadsa",
    "event_time": 1532496353
}
*/
export type Slack$Event$Link = {|
  +type: 'event_callback',
  +token: Slack$VerificationToken,
  +team_id: Slack$TeamID,
  +api_app_id: string,
  +event: {
    +type: 'link_shared',
    +user: string,
    +channel: string,
    +message_ts: string,
    +links: Array<Slack$SharedLinkDescriptor>,
    +is_app_in_channel: boolean,
  },
  +authed_teams: string[],
  +event_id: string[],
  +event_time: number,
  isWorker?: true,
|};

/*
{
    "type": "dialog_submission",
    "token": "<masked>",
    "action_ts": "<masked>",
    "team": {
        "id": "<masked>",
        "domain": "<masked>"
    },
    "user": {
        "id": "<masked>",
        "name": "<masked>"
    },
    "channel": {
        "id": "<masked>",
        "name": "privategroup"
    },
    "submission": {
        "minutes": "15",
        "privateReason": "This is a test",
        "publicReason": null
    },
    "callback_id": "support.start",
    "response_url": "<masked>"
}

*/

export type Slack$Event$DialogSubmission$Submission = {
  [inputID: string]: any,
};

export type Slack$Event$DialogSubmission = {|
  +type: 'dialog_submission',
  +token: Slack$VerificationToken,
  +action_ts: string,
  +team: Slack$TeamDescriptor,
  +user: Slack$UserDescriptor,
  +channel: Slack$ChannelDescriptor,
  +submission: Slack$Event$DialogSubmission$Submission,
  +callback_id: string,
  +response_url: string,
  state?: any,
  isWorker?: true,
|};

/*
  If your app finds any errors with the submission, respond
  with an application/json payload within the body of a 200
  OK response - the requests between your app and Slack are
  still OK after all, so don't use any kind of error response.

  This payload should be an errors array containing 1 or more
  objects that include:

  name  - a string which specifies the corresponding dialog
          element that is being rejected. This must match the
          name used to create that element.
  error - a string which describes why that element is being
          rejected.
*/
export type Slack$Event$DialogSubmission$ValidationErrorResponse = {|
  errors: Array<{|
    name: string,
    error: string,
  |}>,
|};

export type Slack$Event$UrlVerification = {|
  +type: 'url_verification',
  +challenge: string,
  isWorker?: true,
|};

/*
{
    "type": "interactive_message",
    "actions": [
        {
            "name": "support.start.accept",
            "type": "button",
            "value": "support.start.accept"
        }
    ],
    "callback_id": "support.start",
    "team": {
        "id": "<masked>",
        "domain": "<masked>"
    },
    "channel": {
        "id": "<masked>",
        "name": "privategroup"
    },
    "user": {
        "id": "<masked>",
        "name": "<masked>"
    },
    "action_ts": "<masked>",
    "message_ts": "<masked>",
    "attachment_id": "1",
    "token": "<masked>",
    "is_app_unfurl": false,
    "original_message": {
        "type": "message",
        "user": "<masked>",
        "text": "",
        "bot_id": "<masked>",
        "attachments": [
            {
                "callback_id": "support.start",
                "fallback": "A maitenance window is being requested.",
                "text": "Before the window starts, at least one support member must acknowledge.  This should be done once we have prepared the public for the window.",
                "pretext": " A maitenance window is being requested.",
                "title": "Title!",
                "footer": "BOT",
                "id": 1,
                "color": "daa038",
                "fields": [
                    {
                        "title": "Timeframe",
                        "value": "15 Minutes",
                        "short": true
                    },
                    {
                        "title": "Private Reason",
                        "value": "This is a test",
                        "short": false
                    },
                    {
                        "title": "Public Reason",
                        "value": "Ask if more details are required",
                        "short": false
                    }
                ],
                "actions": [
                    {
                        "id": "1",
                        "name": "support.start.acknowledge",
                        "text": "Acknowledge Window",
                        "type": "button",
                        "value": "support.start.acknowledge",
                        "style": "primary"
                    },
                    {
                        "id": "2",
                        "name": "support.start.accept",
                        "text": "Accept Window",
                        "type": "button",
                        "value": "support.start.accept",
                        "style": "primary",
                        "confirm": {
                            "text": "This will indicate that the team can turn off trades, withdrawals, etc.  Are you ready?",
                            "title": "Are you sure?",
                            "ok_text": "Yes",
                            "dismiss_text": "No"
                        }
                    }
                ]
            }
        ],
        "ts": "<masked>"
    },
    "response_url": "<masked>",
    "trigger_id": "<masked>"
}
*/

export type Slack$Event$InteractiveMessage = {|
  +type: 'interactive_message',
  +token: Slack$VerificationToken,
  +actions: Array<Slack$ActionsDescriptor>,
  +callback_id: string,
  +team: Slack$TeamDescriptor,
  +channel: Slack$ChannelDescriptor,
  +user: Slack$UserDescriptor,
  +action_ts: string,
  +message_ts: string,
  +attachment_id: string,
  +is_app_unfurl: boolean,
  +original_message: Slack$Message,
  +response_url: Slack$ResponseURL,
  +trigger_id: string,
  isWorker?: true,
|};

/*
  A list of options can be loaded from an external URL and
  used in your dialog menus.

  @see https://api.slack.com/dialogs#elements
{
  "type": "dialog_suggestion",
  "token": "<masked>",
  "action_ts": "<masked>",
  "team": {
    "id": "<masked>",
    "domain": "hooli-hq"
  },
  "user": {
    "id": "<masked>",
    "name": "gbelson"
  },
  "channel": {
    "id": "<masked>",
    "name": "triage-platform"
  },
  "name": "external_data",
  "value": "",
  "callback_id": "bugs"
}
*/
export type Slack$Event$DialogOptions = {|
  +type: 'dialog_suggestion',
  +name: 'external_data',
  +token: Slack$VerificationToken,
  +action_ts: string,
  +team: Slack$TeamDescriptor,
  +user: Slack$UserDescriptor,
  +channel: Slack$ChannelDescriptor,
  +value: string,
  +callback_id: string,
  isWorker?: true,
|};

/*
{
    "token": "<masked>",
    "team_id": "<masked>",
    "team_domain": "<masked>",
    "channel_id": "<masked>",
    "channel_name": "privategroup",
    "user_id": "<masked>",
    "user_name": "<masked>",
    "command": "/SlackCommand",
    "text": "support start",
    "response_url": "<masked>",
    "trigger_id": "<masked>"
}
*/

export type Slack$Command$Slash = {|
  +type?: void,
  +token: Slack$VerificationToken,
  +team_id: Slack$TeamID,
  +team_domain: string,
  +channel_id: string,
  +channel_name: string,
  +user_id: string,
  +user_name: string,
  +command: string,
  +text: string,
  +response_url: Slack$ResponseURL,
  +trigger_id: string,
  isWorker?: true,
|};

/*
  It is not currently clear when this will occur, but the various
  slack libraries implement this logic so we do as well.

  In the libs they return this as the value without looking at
  any other data when they discover a payload in the object.

  @see https://github.com/slackapi/node-slack-interactive-messages/blob/master/src/http-handler.js#L45
*/
export type Slack$Payload$String = {|
  +payload: string,
|};

export type Slack$Payloads =
  | Slack$Command$Slash
  | Slack$Event$Link
  | Slack$Event$DialogSubmission
  | Slack$Event$InteractiveMessage
  | Slack$Event$UrlVerification;

// export type Slack$Payloads = Slack$Events;
