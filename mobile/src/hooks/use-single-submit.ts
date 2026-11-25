import { useRef, useState } from 'react';

// El ref bloquea el segundo toque en el mismo instante; el estado de React solo
// se actualiza en el próximo render y llegaría tarde.
export function useSingleSubmit<Args extends unknown[] = []>(action: (...args: Args) => Promise<void>) {
  const inFlight = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(...args: Args) {
    if (inFlight.current) return;
    inFlight.current = true;
    setIsSubmitting(true);
    try {
      await action(...args);
    } finally {
      inFlight.current = false;
      setIsSubmitting(false);
    }
  }

  return { submit, isSubmitting };
}
