# `useLoadData`

A React hook that simplifies complex data loading requirements.

## Usage

The most simple usage is to pass a single argument, which should be an asynchronous function. This function will get executed immediately upon component initialization:

```TypeScript
import {useLoadData} from 'react-hooks';

export const DataComponent: React.FC = () => {
  const {isError, isInProgress, result} = useLoadData(async () => fetch(...));

  if (isError) {
    return <>An error occurred</>;
  } else if (isInProgress) {
    return <>Loading...</>;
  } else {
    return <>{result}</>;
  }
};
```

However where `useLoadData` really shines is when dealing with complex data dependencies. For example, consider the following endpoints needed to retrieve and display the products that a user has purchased:
- `/api/config`: fetches URL paths that are needed to construct other API calls
- `/api/user/:username`:  fetches information about the current user (depends on response from config endpoint)
- `/api/content`: fetches content from CMS such as button labels and error messages
- `/api/products/:userId`: fetches the products for the user (depends on response from config and user info endpints)

In order to minimize page loading time, the above endpoints should be called in an optimal order. As soon as one endpoint's dependencies have finished successfully, that endpoint should be called. We also need to make sure we show some sort of loading indicator while any endpoints are in progress, and we need to show an error indicator if any have failed.

Luckily, `useLoadData` makes it easy to specify dependencies, and will make sure that all data fetching function are called in the most optimal way:

```TypeScript
import {useLoadData} from 'react-hooks';
import {useCache} from 'some-library';

export const DataComponent: React.FC<{userId: string}> = ({userId}) => {
  const loadedConfig = useLoadData(async () => fetch('/api/config'));

  const loadedUserProfile = useLoadData(
    async (config) => fetch(`/api/${config.userProfilePath}`),  // `config` comes from the dependency on `loadedConfig`
    [loadedConfig]    // Specify an array of dependencies.  These can be any primitive or object, or can be the result of another `useLoadData` call.
  );                  // These dependencies will be passed as arguments to the data fetching function.

  const loadedContent = useLoadData(
    async (config) => fetch(`/api/${config.contentPath}`),
    [loadedConfig]
  );
  const loadedProducts = useLoadData(
    async (config, userProfile) => fetch(`/api/${config.productsPath}`, {userId: userProfile.userId}),
    [loadedConfig, loadedUserProfile]
  );

  // We only need to examine the content and product API calls for error/in progress.  More on this below.
  if (loadedContent.isError || loadedProducts.isError) {
    return <>An error occurred</>;
  } else if (loadedContent.isInProgress || loadedProducts.isInProgress) {
    return <>Loading...</>;
  } else {
    return (
      <ProductList
        content={loadedContent.result}
        products={loadedProducts.result}
      />;
    );
  }
}
```

In the above example, we are only checking the `loadedContent` and `loadedProducts` results for errors and in-progress. Why are we not checking the other "loaded" variables? Two reasons:

1. The content and products are what we actually need to render our component. If any of the dependencies are in-progress or have thrown exceptions, that will be manifested in the `isError` and `isInProgress` properties of content and products.
2. If using TypeScript, checking the `isError` and `isInProgress` properties will give TypeScript enough information to assert whether or not `result` is available. In the above example, if we assume that the `content` and `products` properties of the `ProductList` component are required, then if you _don't_ check the status of content and products, TypeScript will actually emit a build-time error! So by using the `if`/`else if`/`else` pattern with TypeScript, you can rely on TypeScript to let you know whether or not you have the appropriate `isError`/`isInProgress` checks in place.


You can also pass initial data. If initial data is present, then the callback function will not be called, and instead the initial data will be returned. This is mostly useful if you know you might have the data cached somewhere already. Additionally, you can pass a callback that will get executed after the data fetching function finishes and will receive the result (or the initial data, if provided).

```TypeScript
import {useLoadData} from 'react-hooks';
import {useCache} from 'some-library';

export const DataComponent: React.FC = () => {
  const cache = useCache();                             // retrieve data from a cache
  const {isError, isInProgress, result} = useLoadData(
    async () => fetch(...),
    [],                                                 // pass dependancy array, empty in this example
    cache.get('demo-data'),                             // pass cached data as initial data
    (err, res) => cache.set('demo-data', res)           // pass "onDataLoaded" callback to allow caching result or error
  );

  if (isError) {
    return <>An error occurred</>;
  } else if (isInProgress) {
    return <>Loading...</>;
  } else {
    return <>{result}</>;
  }
}
```

## API

The `useLoadData` hook accepts the following arguments:

| Name                  | Type                             | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Default Value |
| --------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `fetchData`           | `([...args]) => T`               | A function that will be executed once dependent `useLoadData` calls have been resolved. Any dependencies will be passed as arguments to this function.                                                                                                                                                                                                                                                                                                                      |               |
| `fetchDataArgs`       | `args[]` _(optional)_            | An array of arguments to pass to the `fetchData` function. Typically these will be the result of another `useLoadData` call, although they could be anything. If they are a `useLoadData` result, then `fetchData` will not be called until each of these dependencies is resolved. Once the `useLoadData` dependency is resolved, _only the result_ will be passed to `fetchData`, so inside of `fetchData` you do NOT need to access `.result` on the injected arguments. |               |
| `data`                | `T` _(optional)_                 | Optional data to use rather than fetching the data. If a value is provided here, then the `fetchData` function will not be called, and the data will be used as the `result` property on the return object.                                                                                                                                                                                                                                                |               |
| `onComplete`        | `(err?: unknown, res?: T) => void` _(optional)_ | A function that will be called once `fetchData` is complete. The function will either receive the result of `fetchData` or the error that occured. If the `data` argument was passed, then `onComplete` will be called immediately with `data`.                                                                                                                                                                                                                                                            |               |
|`config`| `{fetchWhenDepsChange?: boolean; maxRetryCount?: number}` _(optional)_ | <ul><li> **fetchWhenDepsChange:** Whether to re-execute `fetchData` when any of the `fetchDataArgs` changes. ***Setting this to `true` should generally be the exception rather than the rule.*** Passing `true` here will add additional, likely unexpected complexities. `useLoadData` is optimized for fetching _initial_ data.</li><li> **maxRetryCount:** How many times the `retry` function which is returned can be called.</li></ul> | {fetchWhenDepsChange: false, maxRetryCount: 2}                              
                                                                                                                                                                  
The return value from `useLoadData` contains the following properties:

| Name           | Type                   | Description                                                                                                                                                  |
| -------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `isInProgress` | `boolean`              | Whether the `fetchData` function or any `fetchDataArgs` are currently executing                                                                              |
| `isError`      | `boolean`              | Whether the `fetchData` function or any `fetchDataArgs` failed with an error                                                                                 |
| `error`        | `unknown \| undefined` | If `isError` is `true`, this property will contain the exception that was thrown                                                                             |
| `result`       | `T \| undefined`       | If both `isError` and `isInProgress` are `false`, then this property will contain the value returned from `fetchData`                                        |
| `retry`        | `() => void`           | A function that can be called to re-trigger `fetchData`. For example, this might be used if your UI needs a "Try Again" button in the event of API failures. |
| `isMaxRetry`   | `boolean`              | A boolean that indicates whether the number of times the `retry` function has been called exceeds the allowed threshold                                      |

**Supported Argument Overloads**: Due to the variety of usecases and scenarios for `useLoadData`, it supports a variety of different overloads to minimize the number of arguments to pass. These include:

Overload 1: 
```Typescript
const loadedData = useLoadData(
  fetchData,
  config // optional
)
```

Overload 2: 
```Typescript
const loadedData = useLoadData(
  fetchData,
  fetchDataArgs,
  config // optional
)
```
Overload 3: 
```Typescript
const loadedData = useLoadData(
  fetchData,
  fetchDataArgs,
  onComplete,
  config // optional
)
```

Overload 4: 
```Typescript
const loadedData = useLoadData(
  fetchData,
  fetchDataArgs,
  onComplete,
  data // optional
  config // optional
)
```


**Notes for TypeScript**: One of the most useful features of `useLoadData` is how the `result` property on the return value is typed. If you use an `if`/`else if`/`else` statement to check the error and in-progress status of a `useLoadData` result, TypeScript will be able to assert that `result` is defined in the final `else`:

```TypeScript
const {isError, isInProgress, result} = useLoadData(...);

if (isError) {
  // The type of `result` is `T | undefined`
} else if (isInProgress) {
  // The type of `result` is still `T | undefined`
} else {
  // The type of `result` is just `T`! This is because TypeScript knows that `isError` is false,
  // and `isInProgress` is false, therefore `result` must be defined.  This means there is no need
  // to do any additional truthiness checks on `result` in this `else` block.
}
```
