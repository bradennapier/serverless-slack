/* @flow */
import SQSClient from 'serverless-sqs-client';

const { APP_AWS_REGION } = process.env;

export const SQS = SQSClient({
  region: APP_AWS_REGION,
});
