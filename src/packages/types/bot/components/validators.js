/* @flow */

type ValidationErrorType = {|
  name: string,
  error: string,
|};

export type Bot$Validator$Execute = () => { errors: Array<ValidationErrorType> } | void;
