import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useApi } from './useApi';

describe('useApi', () => {
  it('stores returned data', async () => {
    const { result } = renderHook(() => useApi<number>());

    await act(async () => {
      await result.current.call(async () => 42);
    });

    expect(result.current.data).toBe(42);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});
