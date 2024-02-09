# `useFocus`

A React hook that simplifies focus management.

## Usage
`useFocus` is designed to be used in tandem with **React state**, preferably residing in some *parent component*. The hook takes a (stateful) *boolean* as parameter, and returns a **react ref**, which is to be passed to component of choice. When said boolean updates to `true`, useFocus will apply focus to ref:


```Typescript
import React from 'react';
import {useFocus} from '@optum/react-hooks';


export const MyComponent = ({
    focusButton // stateful boolean which is handled by parent
    onButtonClick // some function
}) => {
    const buttonRef = useFocus(focusButton); // pass the prop into hook

    return (
        <div>
            <p>Some text</p>
            <button 
                onClick={onButtonClick} 
                ref={buttonRef} // pass ref into element
            >
                button text
            </button>
        </div>
    );
}
```

## API

`useFocus` takes the following arguments:

| Name | Type   | Description |
|-|-|-|
| `focus` | boolean | a statefully controlled flag that determines whether or not to focus returned ref. When this changes to `true`, the returned `ref` is focused |
| `onFocus` | `() => void` _(optional)_ | callback function that fires when ref get's focused 


The return value of `useFocus` is a `react.refObject`
