# `useCommonContext`

A React hook that allows connecting to several potential active react contexts.

## Usage
`useCommonContext` is designed to be used in tandem with **React context**. If a component is being used in a variety of locations that each are serving a different context (of the same type):  


```Typescript
import React from 'react';
import {useCommonContext} from 'react-hooks';

import {useContextA} from 'some-context-provider-a';
import {useContextB} from 'some-context-provider-b';
import {useContextC} from 'some-context-provider-c';


export const MyComponent = (props) => {
   const context = useCommonContext(useContextA, useContextB, useContextC);

    return ...
}
```

## API

`useCommonContext` takes the following arguments:

| Name | Type   | Description |
|-|-|-|
| `...contextHook` | `(() => T)[]` | any number of contexts with return type, `T` |


The return value of `useCommonContext` is `T`.

**Note: `useCommonContext` is designed to be used where only one of the passed contexts is active. Passing several active contexts will result in the last passed context being used. If no context is active, an error will be thrown**
