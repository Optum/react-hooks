# `useRetry`

A React hook that simplifies retrying failed service calls.

## Usage
`useRetry` exposes a wrapped version of [useLoadData](../useLoadData/) that retries any and all errored [retry response objects](../../types/RetryResponse), and only those responses created, from that exposed version of _useLoadData_. 



```Typescript
import React from 'react';
import {useRetry} from '@optum/react-hooks';

export const MyComponent = (props) => {
 const {useLoadData, retry} = useRetry();
 const loadedContent = useLoadData(fetchContent);
 const loadedUserProfile = useLoadData(fetchUserProfile);
 const loadedResults = useLoadData(fetchResults);
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

In addition, a list of any `useLoadData` responses can be passed as arguments (not just responses returned by the wrapped version of `useLoadData`) and when the `retry` function is called, any failed responses will be retried.

```Typescript
import React from 'react';
import {useLoadData, useRetry} from '@optum/react-hooks';

export const MyComponent = (props) => {
 const loadedContent = useLoadData(fetchContent);
 const loadedUserProfile = useLoadData(fetchUserProfile);
 const loadedResults = useLoadData(fetchResults);

 const {retry} = useRetry(
    loadedContent,
    loadedUserProfile,
    loadedResults
 );

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


The return value from `useLoadData` contains the following properties:

| Name           | Type                   | Description                                                                                                                                                  |
| -------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `useLoadData` | `typeof useLoadData`              | Modified version of [useLoadData]('../useLoadData').                                                                             |
| `retry`      | `() => void`              | Retries any retry response created by the _useLoadData_ exposed with this hook in addition to retrying errored retry responses passsed into this hook.                                                  |
| `isMaxRetry`        | `boolean` | True if any retry response either passed or created via the useLoadData exposed in this hook has reached it's _isMaxRetry_                                                                              |


