export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => {
    console.log(JSON.stringify({ level: 'info', msg, timestamp: new Date().toISOString(), ...meta }));
  },
  error: (msg: string, meta?: Record<string, unknown>) => {
    console.error(JSON.stringify({ level: 'error', msg, timestamp: new Date().toISOString(), ...meta }));
  },
  warn: (msg: string, meta?: Record<string, unknown>) => {
    console.warn(JSON.stringify({ level: 'warn', msg, timestamp: new Date().toISOString(), ...meta }));
  }
};
