const DEBUG =true;

export const logger = {
  debug(...args) {
    if (DEBUG) {
      console.log(...args);
    }
  },

  warn(...args) {
    console.warn(...args);
  },

  error(...args) {
    console.error(...args);
  }
};