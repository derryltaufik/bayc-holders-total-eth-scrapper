to run:

```
npm run start
```

Currently, the code uses public nodes to fetch the data.

This causes performance issue when calling 10000 read operations, even after implementing parallel call. Some providers even set the rate limit after x amount of calls.

To fix this issue, edit the provider in the config.js file to use a more sophisticated private node.