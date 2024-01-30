# `useOptionalDependecy`

A React hook that safely optionalizes retry responses.

## Usage
`useOptionalDependency` is designed to be used in tandem with [useLoadData](../useLoadData/). This hook will safely optionalize a [retry response objects](https://github.optum.com/optumrx-skyline/shared-component-library/blob/master/packages/common/types/load-data-response/RetryResponse.ts), meaning an optional dependency that returns type `T` will be typed as `T | null` when passed into `fetchData`, and will always be treated as _null_ by `useLoadData` if the dependency errors. The advantage here being that `useLoadData` will still wait upon the optional dependency to resolve (successfully or unsucessfully), and more significantly, does not hold up a dependency chain while still exposing an error.  

```Typescript
import React from 'react';
import {useLoadData} from '@Optum/react-hooks';

export const MyComponent = (props) => {
 const loadedUserProfile = useLoadData(fetchUserProfile); // loadedUserProfile will be of type RetryResponse<Profile>

 const optionalizedUserProfile = useOptionalDependency(loadedUserProfile);
 const loadedResults = useLoadData(
    async (userProfile) => { // userProfile will be of type Profile | null due to being optionalized
        if(!userProfile) {
            return fetchResultsWithoutProfile()
        } else {
            return fetchResults(userProfile)
        }
    }, 
    [optionalizedUserProfile]
 );

}
```

## API

`useOptionalDependency` takes the following arguments:

| Name | Type   | Description |
|-|-|-|
| `dependency` | `RetryResponse<T>` | return value from `useLoadData` to be optionalized |


The return value of `useOptionalDependency` is `OptionalDependency<T>`, where `T` is the type of the result.
