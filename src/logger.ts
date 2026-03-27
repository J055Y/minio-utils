import {pino, type Logger} from 'pino';

export const logger: Logger = pino({
	transport: {
		target: 'pino-pretty',
		options: {
			colorize: true,
			sync: true
		},
	},
	level: process.env.PINO_LOG_LEVEL || 'info',

	redact: [], // prevent logging of sensitive data
});

/**
 * Ensures all logs are flushed before exiting.
 * @param err The error to log before exiting
 */
export const fatal = (err: string | Error) => {
	logger.fatal(err);
	// Flush and exit
	setTimeout(() => {
		process.exit(1);
	}, 500);
	// Try to flush pino if possible
	if ((logger as any).flush) {
		(logger as any).flush();
	}
};