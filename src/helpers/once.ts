export function once<T>(fn: () => T) {
  let result: T;
  let ran = false;
  return () => {
    if (ran) {
      return result;
    }
    result = fn();
    ran = true;
    return result;
  };
}

export function onceAsync<T>(fn: () => Promise<T>) {
  let result: T;
  let ran = false;
  return async () => {
    if (ran) {
      return result;
    }
    result = await fn();
    ran = true;
    return result;
  };
}
