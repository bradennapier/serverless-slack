/* @flow */
import { SQS } from './sqs';

const { WORKER_QUEUE_URL } = process.env;

export function addToWorkerQueue(body: Object): Promise<any> {
  return SQS.sendMessage({
    MessageBody: JSON.stringify(body),
    QueueUrl: WORKER_QUEUE_URL,
  })
    .promise()
    .then(r => {
      console.log('Successfully Published to Worker Queue!', r);
      return r;
    })
    .catch(err => {
      console.error('[ERROR] | Failed to Publish to Worker Queue! ', err);
    });
}
