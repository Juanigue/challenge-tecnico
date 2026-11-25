import { act, renderHook } from '@testing-library/react-native';

import { useSingleSubmit } from '@/hooks/use-single-submit';
import { deferred } from './helpers';

describe('useSingleSubmit', () => {
  it('F-11: dos toques en el mismo instante (antes del re-render) ejecutan la acción una sola vez', async () => {
    const pending = deferred<void>();
    const action = jest.fn(() => pending.promise);
    const { result } = await renderHook(() => useSingleSubmit(action));

    await act(async () => {
      void result.current.submit();
      void result.current.submit();
    });
    expect(result.current.isSubmitting).toBe(true);

    await act(async () => pending.resolve());

    expect(action).toHaveBeenCalledTimes(1);
    expect(result.current.isSubmitting).toBe(false);
  });

  it('F-11: después de terminar se puede volver a enviar (por ejemplo, tras un error)', async () => {
    const action = jest.fn(async () => {
      throw new Error('falló');
    });
    const { result } = await renderHook(() => useSingleSubmit(action));

    await act(async () => {
      await result.current.submit().catch(() => {});
    });
    await act(async () => {
      await result.current.submit().catch(() => {});
    });

    expect(action).toHaveBeenCalledTimes(2);
    expect(result.current.isSubmitting).toBe(false);
  });
});
