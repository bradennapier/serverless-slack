/* @flow */
import AWS from 'aws-sdk';
import https from 'https';

const { APP_AWS_REGION } = process.env;

export const DB = new AWS.DynamoDB({
  region: APP_AWS_REGION,
  httpOptions: {
    agent: new https.Agent({ ciphers: 'ALL', secureProtocol: 'TLSv1_method' }),
  },
});

export const DOC = new AWS.DynamoDB.DocumentClient(
  {
    region: APP_AWS_REGION,
    httpOptions: {
      agent: new https.Agent({
        ciphers: 'ALL',
        secureProtocol: 'TLSv1_method',
      }),
    },
    convertEmptyValues: true,
  },
  DB,
);
