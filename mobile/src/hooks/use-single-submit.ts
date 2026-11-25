import { useRef, useState } from 'react';

// El ref bloquea el segundo toque en el mismo instante; el estado de React solo
// se actualiza en el próximo render y llegaría tarde.
export function useSingleSubmit(action: () => Promise<void>) {
  const inFlight = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    if (inFlight.current) return;
    inFlight.current = true;
    setIsSubmitting(true);
    try {
      await action();
    } finally {
      inFlight.current = false;
      setIsSubmitting(false);
    }
  }

  return { submit, isSubmitting };
}
