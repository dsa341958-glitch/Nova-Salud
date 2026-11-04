const fmt = (nivel, ...args) =>
  console.log(`[${new Date().toISOString()}] ${nivel}`, ...args);

export const logger = {
  info: (...a) => fmt('INFO', ...a),
  warn: (...a) => fmt('WARN', ...a),
  error: (...a) => fmt('ERROR', ...a),
};