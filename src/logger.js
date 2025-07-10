
class SimpleLogger {
  formatMessage(level, message, meta) {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  }
  info(message, meta) {
    console.log(this.formatMessage('info', message, meta));
  }
  warn(message, meta) {
    console.warn(this.formatMessage('warn', message, meta));
  }
  error(message, meta) {
    console.error(this.formatMessage('error', message, meta));
  }
  debug(message, meta) {
    console.debug(this.formatMessage('debug', message, meta));
  }
}
module.exports = { SimpleLogger };

