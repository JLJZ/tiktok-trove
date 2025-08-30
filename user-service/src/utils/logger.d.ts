declare class Logger {
    private logLevel;
    private logStream?;
    constructor();
    private getLogLevel;
    private initializeFileLogging;
    private formatMessage;
    private log;
    private getColorCode;
    error(message: string, data?: any): void;
    warn(message: string, data?: any): void;
    info(message: string, data?: any): void;
    debug(message: string, data?: any): void;
}
export declare const logger: Logger;
export {};
