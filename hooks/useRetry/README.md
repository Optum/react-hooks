# `useRetry`

A React hook that simplifies retrying failed service calls.

## Usage
`useRetry` is designed to be used in tandem with [useLoadData](../useLoadData/). This hook will trigger `retry` from errored [retry response objects](../../types/RetryResponse.ts), and only those responses. 


```Typescript
import React from 'react';
import {useLoadData, useRetry} from 'react-hooks';


export const MyComponent = (props) => {
 const loadedContent = useLoadData(fetchContent);
 const loadedUserProfile = useLoadData(fetchUserProfile);
 const loadedResults = useLoadData(fetchResults);

 const retry = useRetry(loadedContent, loadedUserProfile, loadedResults);

 if(
    loadedContent.isInProgress ||
    loadedUserProfile.isInProgress ||
    loadedResults.IsInProgress
 ) {
    return <div>Loading your page</div>
 } else if(
    loadedContent.isError ||
    loadedUserProfile.isError ||
    loadedResults.isError
) {
        return <button onClick={retry}>Retry</button>
    }
    else {
        return ...
    }
}
```

## API

`useRetry` takes the following arguments:

| Name | Type   | Description |
|-|-|-|
| `...apis` | `RetryResponse[]` | any number of retry responses returned from instances of `useLoadData` |


The return value of `useRetry` is a function `() => void` that triggers the **retry** property of errored RetryResponses.