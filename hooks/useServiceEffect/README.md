# `useServiceEffect`

A React hook that simplifies making state driven service calls.

## Usage
`useService` is designed to be used in tandem with state. This hook will trigger a service call, `service` when the stateful flag, `isPending` becomes true. 

Suppose the parent of a component has some state:

```Typescript
{
    hasPendingSearch: false
    isInProgress: false,
    isError: false,
    searchResults: undefined,
    error: undefined
    // ... other state fields
}

```
and our component looks something like this:

```Typescript
import React from 'react';
import {useServiceEffect} from 'react-hooks';


export const MyComponent = ({
    hasPendingSearch, // stateful boolean flag indicating when to trigger search
    onSearch, // service calling function, returns promise of search results
    onInitiateSearch, // sets hasPendingSearch to false, isInProgress to true
    onSearchResolved, // callback function called with search results, sets isInProgress to false, sets searchResults
    onSearchRejected // callback function when error is thrown, sets isInProgress to false, sets isError to true, and error to the thrown error
}) => {
    useServiceEffect(
        hasPendingSearch,
        onSearch,
        onSearchResolved,
        onSearchRejected,
        onInitiateSearch
    )

    // ... rest of component
}
```

As soon as `hasPendingSearch` changes to true, useServiceEffect will call `onInitiateSearch`, thereby setting `hasPendingSearch` back to _false_ and `isInProgress` to _true_.  Then, it will try and invoke `onSearch`. If it resolves successfully, the returned data will be passed into `onSearchResolved`, which sets `isInProgress` to _false_ and populate `searchResults` with returned _data_. If an error were to occcur, `onSearchRejected` would be called instead, setting `isInProgress` to _false_, `isError` to _true_, and populate `error` with the thrown _error_. 


## API

`useServiceEffect` takes the following arguments:

| Name | Type   | Description | Default Value |
|-|-|-|-|
| `isPending` | `boolean` | flag which triggeres service calling behavior when changed to _true_ |
| `service` | `() => Promise<T>` | service calling function
| `onServiceCallResolved` | `(data: T) => void`_(optional)_ | callback function called when `service` successfully resolves |
|`onServiceCallRejected` | `(error: unknown) => void` _(optional)_ | callback function called when error is thrown in `service` |
| `onInitiateServiceCall` | `() => void` _(optional)_ | function which gets called directly before attempting to invoke `service` |
| `dependencies` | `unknown[]` _(optional)_ | additional dependencies, aside from `isPending`, that can be passed. When any of these change, `service` will be reinvoked | `[]` |


**Note:`useServiceEffect` does not have a return value.**