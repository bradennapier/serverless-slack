# Project Packages

These packages are provided as shared yet internal modules that may be used in any component or other package. They allow us to use
absolute imports `import bot from 'bot'` and may be used in any cases where we need to share code in multiple places.

Webpack will then package and conduct tree-shaking on each function to ensure only used code is actually included in each function that is packaged.
