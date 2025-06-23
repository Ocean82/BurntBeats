
/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

// Jest and Testing Library globals are automatically available
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveClass(className: string): R;
      toHaveTextContent(text: string | RegExp): R;
    }
  }
}

export {};
