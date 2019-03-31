/* @flow */

/* https://api.slack.com/dialogs */
export type Bot$Dialog$Creator = ((...args: any[]) => Bot$Dialog) | Bot$Dialog;

export type Bot$Dialog = {
  /* User-facing title of this entire dialog.
     Can be up to 24 characters */
  title: string,
  /* An identifier strictly for you to recognize submissions
     of this particular instance of a dialog. Use something
     meaningful to your app. 255 characters maximum. */
  callback_id?: string,
  /* Default is false. When set to true, we'll notify your
     request URL whenever there's a user-induced dialog
     cancellation. */
  notify_on_cancel?: boolean | false,
  /* An optional string that will be echoed back to your app
     when a user interacts with your dialog. Use it as a
     pointer to reference sensitive data stored elsewhere. */
  state?: string,
  /* User-facing string for whichever button-like thing
     submits the form, depending on form factor. */
  submit_label?: string | 'Submit',
  /* Up to 5 form elements are allowed per dialog. */
  elements: Array<void | Slack$Dialog$Elements>,
};

/* https://api.slack.com/dialogs#elements */
export type Slack$Dialog$Elements = Slack$Dialog$Element$Text | Slack$Dialog$Element$Select;

export type Slack$Dialog$Element$Common = {|
  /* Label displayed to user. Required.
     24 character maximum. */
  label: string,
  /* Name of form element. Required. No more
       than 300 characters. */
  name: string,
  /* Provide true when the form element is not required.
         By default, form elements are required. */
  optional?: 'true',
  /* Helpful text provided to assist users in answering
         a question. Up to 150 characters. */
  hint?: string,
  /* A default value for this field. Up to 150 characters. */
  value?: string,
  /* A string displayed as needed to help guide users in
         completing the element. 150 character maximum. */
  placeholder?: string,
|};

export type Slack$Dialog$Element$Text = {|
  ...Slack$Dialog$Element$Common,
  +type: 'text' | 'textarea',
  subtype?: 'email' | 'number' | 'tel' | 'url',
  /* 0-150 (defaults 0) (0-3000 for textarea) */
  min_length?: number,
  /* 1-150 (1-3000 for textarea) */
  max_length?: number,
|};

export type Slack$Dialog$Element$Select =
  | Slack$Dialog$Element$Select$Options
  | Slack$Dialog$Element$Select$OptionsGroups
  | Slack$Dialog$Element$Select$DataSource$External
  | Slack$Dialog$Element$Select$DataSource;

export type Slack$Dialog$Element$Select$Option = {|
  label: string,
  value: string,
|};

export type Slack$Dialog$Element$Select$OptionGroup = {|
  label: string,
  options: Array<Slack$Dialog$Element$Select$Option>,
|};

export type Slack$Dialog$Element$Select$Common = {|
  ...Slack$Dialog$Element$Common,
  +type: 'select',
|};

export type Slack$Dialog$Element$Select$DataSource = {
  ...Slack$Dialog$Element$Select$Common,
  /* In addition to the static select menu, you can also
     generate a data set for a menu on the fly. Make dialog
     select menus more dynamic by specifying one of these four
     data_source types:
     (for options or options groups leave empty)
  */
  +data_source: 'users' | 'channels' | 'conversations',
  min_query_length?: number,
};

export type Slack$Dialog$Element$Select$DataSource$External = {|
  ...Slack$Dialog$Element$Select$Common,
  +data_source: 'external',
  /* Provides a default selected value for dynamic select
    menus with a data_source of type external. This should
    be an array containing a single object that specifies
    the default label and value.

    ? To set default options for other types use value with
    ? the value of the options in the list
  */
  selected_options?: [Slack$Dialog$Element$Select$Option],
  min_query_length?: number,
|};

export type Slack$Dialog$Element$Select$Options = {|
  ...Slack$Dialog$Element$Select$Common,
  /* Provide up to 100 options. Either options or
     option_groups is required for the static and external.
     options[].label is a user-facing string for this option.
     75 characters maximum. Required.

     options[].value is a string value for your app. If an
     integer is used, it will be parsed as a string. 75
     characters maximum. Required. */
  +options: Array<Slack$Dialog$Element$Select$Option>,
|};

export type Slack$Dialog$Element$Select$OptionsGroups = {|
  ...Slack$Dialog$Element$Select$Common,
  /* An array of objects containing a label and a list of
     options. Provide up to 100 option groups. Either
     options or option_groups is required for the static and
     external.

     options_groups[].label is a user-facing string for this
     option. 75 characters maximum. Required.

     options_groups[].options is an array that contains a list
     of options. It is formatted like the options array (see
     options). */
  +options_groups: Array<Slack$Dialog$Element$Select$OptionGroup>,
|};
