import { Logger, createLogger, format, transports } from 'winston';
import { Writable } from 'stream';

const { combine, timestamp, printf } = format;

const customFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

let logger: Logger;

if (process.env.NODE_ENV !== 'test') {
  logger = createLogger({
    level: 'info',
    format: combine(timestamp(), customFormat),
    transports: [
      new transports.Console(),
      new transports.File({ filename: 'logs/combined.log' }),
    ],
  });
} else {
  const noopStream = new Writable({
    write: (chunk, encoding, callback) => {
      callback();
    },
  });
  
  logger = createLogger({
    transports: [
      new transports.Stream({ stream: noopStream }),
    ],
  });
}

export default logger;
