/**
 * Polyfill API modern yang dipakai pdfjs-dist v5.6+/v6 di browser lama (Safari iOS, Chrome Android tua).
 * Harus di-import SEBELUM pdfjs-dist (main thread). Worker legacy biasanya sudah dilengkapi.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

// Promise.withResolvers — Safari < 17.4
if (typeof Promise.withResolvers !== 'function') {
  ;(Promise as any).withResolvers = function withResolvers<T = unknown>() {
    let resolve!: (value: T | PromiseLike<T>) => void
    let reject!: (reason?: unknown) => void
    const promise = new Promise<T>((res, rej) => {
      resolve = res
      reject = rej
    })
    return { promise, resolve, reject }
  }
}

// Promise.try — Safari < 18.2
if (typeof (Promise as any).try !== 'function') {
  ;(Promise as any).try = function tryFn(fn: (...a: unknown[]) => unknown, ...args: unknown[]) {
    return new Promise((resolve) => resolve(fn(...args)))
  }
}

// Map.prototype.getOrInsertComputed — Baseline 2026; belum di banyak HP
if (typeof Map.prototype.getOrInsertComputed !== 'function') {
  Object.defineProperty(Map.prototype, 'getOrInsertComputed', {
    value(this: Map<unknown, unknown>, key: unknown, callbackFn: (k: unknown) => unknown) {
      if (this.has(key)) return this.get(key)
      const value = callbackFn(key)
      this.set(key, value)
      return value
    },
    writable: true,
    configurable: true,
  })
}

// Map.prototype.getOrInsert — pdfjs v6.4+
if (typeof (Map.prototype as any).getOrInsert !== 'function') {
  Object.defineProperty(Map.prototype, 'getOrInsert', {
    value(this: Map<unknown, unknown>, key: unknown, defaultValue: unknown) {
      if (this.has(key)) return this.get(key)
      this.set(key, defaultValue)
      return defaultValue
    },
    writable: true,
    configurable: true,
  })
}

// WeakMap variants (jika ada di build)
if (typeof WeakMap !== 'undefined') {
  if (typeof (WeakMap.prototype as any).getOrInsertComputed !== 'function') {
    Object.defineProperty(WeakMap.prototype, 'getOrInsertComputed', {
      value(this: WeakMap<object, unknown>, key: object, callbackFn: (k: object) => unknown) {
        if (this.has(key)) return this.get(key)
        const value = callbackFn(key)
        this.set(key, value)
        return value
      },
      writable: true,
      configurable: true,
    })
  }
  if (typeof (WeakMap.prototype as any).getOrInsert !== 'function') {
    Object.defineProperty(WeakMap.prototype, 'getOrInsert', {
      value(this: WeakMap<object, unknown>, key: object, defaultValue: unknown) {
        if (this.has(key)) return this.get(key)
        this.set(key, defaultValue)
        return defaultValue
      },
      writable: true,
      configurable: true,
    })
  }
}
