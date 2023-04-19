import {useRef, useEffect} from 'react';

export function useFocus<T extends HTMLElement>(focus: boolean, onFocus?: () => void) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (focus) {
      ref.current?.focus();
      onFocus?.();
    }
  }, [focus]);

  return ref;
}
