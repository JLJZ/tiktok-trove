"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
})(LogLevel || (LogLevel = {}));
class Logger {
    logLevel;
    logStream;
    constructor() {
        this.logLevel = this.getLogLevel();
        this.initializeFileLogging();
    }
    getLogLevel() {
        const level = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
        return LogLevel[level] ?? LogLevel.INFO;
    }
    initializeFileLogging() {
        if (process.env.LOG_FILE) {
            try {
                const logDir = (0, path_1.join)(process.cwd(), 'logs');
                if (!(0, fs_1.existsSync)(logDir)) {
                    (0, fs_1.mkdirSync)(logDir, { recursive: true });
                }
                const logPath = (0, path_1.join)(logDir, process.env.LOG_FILE);
                this.logStream = (0, fs_1.createWriteStream)(logPath, { flags: 'a' });
            }
            catch (error) {
                console.error('Failed to initialize file logging:', error);
            }
        }
    }
    formatMessage(level, message, data) {
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            service: 'user-service',
            ...(data && { data }),
        };
        return JSON.stringify(entry);
    }
    log(level, levelName, message, data) {
        if (level > this.logLevel) {
            return;
        }
        const formattedMessage = this.formatMessage(levelName, message, data);
        if (process.env.NODE_ENV === 'development') {
            const colorCode = this.getColorCode(levelName);
            console.log(`${colorCode}[${levelName}]${this.getColorCode('RESET')} ${message}`, data || '');
        }
        else {
            console.log(formattedMessage);
        }
        if (this.logStream) {
            this.logStream.write(formattedMessage + '\n');
        }
    }
    getColorCode(level) {
        const colors = {
            ERROR: '\x1b[31m',
            WARN: '\x1b[33m',
            INFO: '\x1b[36m',
            DEBUG: '\x1b[37m',
            RESET: '\x1b[0m',
        };
        return colors[level] || '\x1b[0m';
    }
    error(message, data) {
        this.log(LogLevel.ERROR, 'ERROR', message, data);
    }
    warn(message, data) {
        this.log(LogLevel.WARN, 'WARN', message, data);
    }
    info(message, data) {
        this.log(LogLevel.INFO, 'INFO', message, data);
    }
    debug(message, data) {
        this.log(LogLevel.DEBUG, 'DEBUG', message, data);
    }
}
exports.logger = new Logger();
