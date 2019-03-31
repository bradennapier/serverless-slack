/* @flow */
import { Lambda } from './lambda';

export async function lambdaInvoke(
  FunctionName: string,
  data?: mixed,
  InvocationType?: 'RequestResponse' | 'Event' = 'RequestResponse',
) {
  return Lambda.invoke({
    FunctionName,
    InvocationType,
    Payload: JSON.stringify(data),
  })
    .promise()
    .then(result => {
      if (!result) return;
      if (typeof result === 'object' && result.Payload) {
        return JSON.parse(result.Payload);
      }
      return result;
    })
    .catch((err: Error) => {
      console.error(
        '[ERROR] (lambdaInvoke): Could Not Invoke the Lambda ',
        FunctionName,
        err.message,
      );
      throw err;
    });
}

export function asyncInvoke(FunctionName: string, data?: mixed) {
  return lambdaInvoke(FunctionName, data, 'Event');
}

export function syncInvoke(FunctionName: string, data?: mixed) {
  return lambdaInvoke(FunctionName, data, 'RequestResponse');
}
