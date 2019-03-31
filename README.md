# serverless-slack

> **UNFINISHED**

This boilerplate is an example of a powerful way to build a slackbot using AWS, Serverless, SQS, etc that makes adding new commands and handling extremely easy. It works by providing [`workflow`](./src/packages/workflows) objects which help us to automatically build the slack command functionality. This includes `help`, `validation`, `messaging`, and more.

This is not usable yet. It is being ripped out and cleaned up from a huge internal project which

# Webpack

We use `serverless-webpack` to build our functions using webpack. This allows us to provide a `monorepo`-like environment while gaining the benefits of tree-shaking to make sure our functions only include the functions and packages they require to run.
