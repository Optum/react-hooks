# `useLazyLoadData`

_A React hook that optimizes promisable functions while abstracting away complexity with built-in lazy loading, caching, and dependency resolution, without needing to be invoked._

## Rationale
In larger applications, there are often core pieces of data required to render different aspects and features. Suppose, for instance, you are building a shopping application that has _wish list_ and _recommended items_ pages. Chances are, those pages would make _user wish list_ and _recommendations_ calls, respectively. However, in this example, both of these calls (and others) require the response of a _shopping profile_ call.  

A naive implimentation may be:

```ts
import React from 'react';
import {useLoadData} from '@optum/react-hooks';

// Wish List page
export const WishList = (props) => {
    const loadedShoppingProfile = useLoadData(fetchShoppingProfile);
    const loadedWishList = useLoadData((shoppingProfile) => {
        return fetchWishList(shoppingProfile)
    }, [loadedShoppingProfile]);

    ...
}

// Shopping Recommendations page
export const ShoppingRecommendations = (props) => {
    const loadedShoppingProfile = useLoadData(fetchShoppingProfile);
    const loadedRecommendations = useLoadData((shoppingProfile) => {
        return fetchRecommendations(shoppingProfile)
    }, [loadedShoppingProfile]);

    ...
}
```

While this code would function, it would not be optimized. If a user were to navigate back and forth between the _wish list_ and _recommendations_ pages, we would notice `fetchShoppingProfile` invoked each and every time. This could be improved by leveraging the callbacks and intitial data arguments of `useLoadData` to cache and reuse responses. However, doing so relies on the developer remembering to implement/intregrate with the application's cache in addition to having a cohesive and coordinated cache already in place. 

A slightly more fool-proof and optimal way of handling this would be instantiating `loadedShoppingProfile` into a top level context available in both our pages:

```ts
// Shopping Provider at root of application
export const ShoppingProvider = (props) => {
    const loadedShoppingProfile = useLoadData(fetchShoppingProfile);
    return (
        <ShoppingContext.Provider value={{loadedShoppingProfile}}>
            {children}
        </ShoppingContext.Provider>
    );
}

// Wish List page
export const WishList = (props) => {
    const {loadedShoppingProfile} = useShoppingContext();
    const loadedWishList = useLoadData((shoppingProfile) => {
        return fetchWishList(shoppingProfile)
    }, [loadedShoppingProfile]);

    ...
}

// Shopping Recommendations page
export const ShoppingRecommendations = (props) => {
    const {loadedShoppingProfile} = useShoppingContext();
    const loadedRecommendations = useLoadData((shoppingProfile) => {
        return fetchRecommendations(shoppingProfile)
    }, [loadedShoppingProfile]);

    ...
}
```

Moving `loadedShoppingProfile` into a context eliminates the risk of fetching the _shopping profile_ more than once, while removing cognitive overhead for caching. However,`fetchShoppingProfile` will now _always_ be invoked, no matter which page the user lands on. For example, if the application's landing page does not require _shopping profile_, we would be needlessly fetching this data. While an argument could be made that this pattern "prefetches" data for other pages that require it, there is no guarantee a user would ever land on those pages, making this a needlessly costly operation for both front and backend.

**Enter `useLazyLoadData`:**
This is where `useLazyLoadData` truly shines - it simultaneously improves perfomance with behind-the-scene caching and spares developers of that cognitive overhead, all while guaranteeing calls are only made _on demand_.


```ts
// Shopping Provider at root of application
export const ShoppingProvider = (props) => {
    const lazyFetchShoppingProfile = useLazyLoadData(fetchShoppingProfile);
    return (
        <ShoppingContext.Provider value={{lazyFetchShoppingProfile}}>
            {children}
        </ShoppingContext.Provider>
    );
}

// Wish List page
export const WishList = (props) => {
    const {lazyFetchShoppingProfile} = useShoppingContext();
    const loadedShoppingProfile = useLoadData(lazyFetchShoppingProfile);
    const loadedWishList = useLoadData((shoppingProfile) => {
        return fetchWishList(shoppingProfile)
    }, [loadedShoppingProfile]);

    ...
}

// Shopping Recommendations page
export const ShoppingRecommendations = (props) => {
    const {lazyFetchShoppingProfile} = useShoppingContext();
    const loadedShoppingProfile = useLoadData(lazyFetchShoppingProfile);
    const loadedRecommendations = useLoadData((shoppingProfile) => {
        return fetchRecommendations(shoppingProfile)
    }, [loadedShoppingProfile]);

    ...
}
```
With this change, `fetchShoppingProfile` does not get invoked until the user lands on a page that requires it. Additionally, any subsequent page that invokes `lazyFetchShoppingProfile` will directly received the cached result (which is **not** a promise!) rather than making a new shopping profile call. 

---

## Usage
`useLazyLoadData` supports two overloads. Each overload handles a specific usecase, and will be covered seperately in this documentation:
### Overload 1: Basic usage
At bare minimum, `useLazyLoadData` takes in a promisable function, _fetchData_, as it's base parameter, and returns a wrapped version of this function. Call this _lazyFetchData_ for this exmaple. No matter how many quick successive calles to `lazyFetchData` are made, _fetchData_ only is invoked **once**:

```ts
const lazyFetchData = useLazyLoadData(fetchData);

const promise1 = lazyFetchData(); // intitializes a promise
const promise2 = lazyFetchData(); // reuses the same promise intialized in above line

const [data1, data2] = await Promise.all([promise1, promise2]);

const data3 = lazyFetchData(); // data will not be a promise, since the shared promise resolved and the now-cached returned instead!
```

#### Overriding Cache
By default, `useLazyLoadData` will try to either return cached data where available, or reuse a promise if one is currently active. However, sometimes it is necessary to be able to fetch fresh data. Here's how:

```ts
const lazyFetchData = useLazyLoadData(fetchData); 


// lazyFetchData will override cache when passed true
const freshData = await lazyFetchData(true);
```

#### Dependencies
Another strength of `useLazyLoadData` is it's dependency management. Similar to `useLoadData`, the hook takes an array of dependencies. Typically, these dependencies would be partial calls to other promisable functions (for instance, other functions given by `useLazyLoadData`). These dependencies, once resolved, are injected into the _fetchData_ function you passed as argument:

```ts
const lazyFetchDependency = useLazyLoadData(fetchDependency);
const lazyFetchData = useLazyLoadData(([dep]) => { //dep will be the awaited return type of fetchDependancy 
    return fetchData(dep)
}, [lazyFetchDependency]);
const lazyFetchResult = useLazyLoadData(([dep, data]) => {
    return fetchResult(dep, data)
}, [lazyFetchDependency, lazyFetchData]);
```
In this example, both `fetchDependency` and `fetchData` will only be invoked once if `lazyFetchResult` is invoked. Notice how `useLazyLoadData` cleans up what could otherwise turn into messy _await_ statements, and effectively abstracts away complexity involved with making the actual call with how it handles dependencies.


#### Initial Data
Should you already have initial data (either from a cache or SSR), you can pass it into `useLazyLoadData`:


```ts
const lazyFetchNames = useLazyLoadData(fetchNumbers, [], [1,2,3,4]);

lazyFetchNames(); // will return [1,2,3,4]

lazyFetchNames(true); // will override cache and invoke fetchNumbers

```

#### Callback
`useLazyLoadData` allows a callback to be passed. This function will only be invoked if the underlying _fetchData_ function passed successfully resolves, or when initial data is returned:

```ts
const lazyFetchData = useLazyLoadData(fetchData, [], undefined, (res) => setCache(res));

```

### Overload 2: With Arguments
There may be times where you want to be able to pass arguments into the function `useLazyLoadData` exposes (apart from overriding cache). This can be achieved doing the following:


```ts
const lazyFetchDependency = useLazyLoadData(fetchDependency);

/* 
In this example, lazyFetchData accepts arg1 and arg2. 
Arguments are passed after the resolved dependency array
*/
const lazyFetchData = useLazyLoadData(([dep], arg1: string, arg2: number) => {
    const something = doSomething(arg1, arg2)
    return fetchData(dep, something)
},
(arg1, arg2) => arg1, // to be discussed in the next section
[lazyFetchDependency] // dependencies still work as before 
);

lazyFetchData(false, 'argument', 2) // overrideCache always remains the first argument
```

#### Caching by arguments
When enabling arguments for the function `useLazyLoadData` exposes, useLazyLoadData assumes different arguments may yield different results. For this reason, useLazyLoadData will map promises and results (once available) to a serialized version of the arguments passed. As soon as your _fetchData_ function accepts arguments (apart from dependencies), `useLazyLoadData` requires passing a function telling it _how_ to cache with those args: 

```ts
const lazyFetchDependency = useLazyLoadData(fetchDependency);

const lazyFetchData = useLazyLoadData(([dep], arg1: string, arg2: SomeObject) => {
        const something = doSomething(arg1, arg2);
        return fetchData(dep, something);
    }, [lazyFetchDependency], undefined, undefined,
    /* 
    arg1 and arg2 are the same as above.
    In this example, we only wish to cache by a property of arg2
    */
    (arg1, arg2) => (arg2.identifier));
```

#### Dependencies
Dependendies work the same in this overload as in the previous one. See above example for argument positioning.

#### Initial Data
This overload still allows passing _initial data_. However, in this mode, responses are cached by arguments passed (see previous section). Therefore, only passing a response will not be very meaningful. For this reason, this overload's type for _initial data_ is a key-value mapping of responses, where each key is the serialized version of arguments expected to yield the value:

```ts
const lazyFetchAge = useLazyLoadData(async ([], firstName: string, lastName: string) => {
    return await fetchAge(firstName, lastName)
},
(firstName, lastName) => ([firstName, lastName].join('-')),
[],
{
    'John-Smith': 24,
    'Sarah-Jane': 42,
    'Joe-Jonson': 13
});

lazyFetchAge(false, 'John', 'Smith') // fetchAge will not be invoked, as it maps to a provided initial data field
lazyFetchAge(false, 'Sarah', 'Smith') // fetchAge will be invoked, since initial data did not contain key for 'Sarah-Smith'
lazyFetchAge(true, 'John', 'Smith') // fetchAge will be invoked, since cache is overriden
```

#### Callback
The callback in this overload only varies slightly from the other overload. 
In addition to the callback function being passed the result, it will also receive the original arguments used to retrieve said result for convenience:

```ts
const lazyFetchAge = useLazyLoadData(async ([], firstName: string, lastName: string) => {
    return await fetchAge(firstName, lastName)
},
(firstName, lastName) => ([firstName, lastName].join('-')),
[],
undefined,
(res, firstName, lastName) => {
    console.log(`The age of ${firstName} ${lastName} is ${res}`)
});
```

## API
`useLazyLoadData` takes the following arguments:

### Arguments
#### Overload 1: Basic Usage

| Name | Type    | Description |
|-|-|-|
| `fetchData` | `([...AwaitedReturnType<deps>]) => Promisable<T>` | The function to be invoked with resolved dependencies|
| `deps` | `[...deps]` _(optional)_ | Dependencies to be invoked and/or resolved before injecting into and invoking `fetchData`. These may typically be other instances of `useLazyLoadData`. |
| `initialData` | `T` _(optional)_ | If passed, function will return initial data when no additional arguments are passed. | 
| `callback` | `(data: T) => void` _(optional)_ | Gets invoked with the result of `fetchData` after resolving. | 



#### Overload 2: With arguments

| Name | Type    | Description |
|-|-|-|
| `fetchData` | `([...deps], ...args) => Promisable<T>`| The function to be invoked with dependencies and arguments|
| `getCacheKey` | `(...args) => string` | Function declaring how promises/results are mapped by arguments passed into returned function. |
| `deps` | `[...deps]` _(optional)_ | Dependencies to be invoked and/or resolved before injecting into and invoking `fetchData`. These may typically be other instances of `useLazyLoadData`. |
| `initialData` | `Record<string, T>` _(optional)_ | If passed, function will return initial data when no additional arguments are passed. | 
| `callback` | `(data: T, ...args) => void` _(optional)_ | Gets invoked with the result of `fetchData` after resolving. | 

### Return Type
The return value of `useLazyLoadData` is `(overrideCache?: boolean, ...args: Args) => Promisable<T>`, where `T` is the type of the result of `fetchData` (`Args` will be `Never` over Overload 1)


