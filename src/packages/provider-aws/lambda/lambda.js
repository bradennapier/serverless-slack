/* @flow */

import AWS from 'aws-sdk';

const { APP_AWS_REGION } = process.env;

export const Lambda = new AWS.Lambda({
  region: APP_AWS_REGION,
});
