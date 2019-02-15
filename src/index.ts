import { inspect } from 'util'
import moment from 'moment';

export type Task = {
    name: string;
    input?: any;
    execute: TaskFunction;
}

export type TaskInfo = {
    executionStart: string;
    executionEnd?: string;
    executionError?: string;
}

export type TaskResult = {
    success: boolean;
    data?: any;
    error?: Error;
    log: any[];
    info: TaskInfo;
}

export type TaskResults = {
    [name: string]: TaskResult;
}

export type TaskRunnerResults = {
    success: boolean;
    logs: any[];
    results: TaskResults;
    error?: Error;
}

export type TaskFunction = (input: any, logging: LoggingFunction, results: TaskResults) => any | Promise<any>;
export type LoggingFunction = (_: any) => any | Promise<any>;
export type LogGenerationFunction = (_: any) => any;

export class TaskRunner {

    public logs: any[];
    public innerLog: LoggingFunction;
    public logGeneration: LogGenerationFunction;
    public tasks: Task[];
    public results: TaskResults;
    public error?: Error;

    constructor ({ tasks, logging, logGeneration }: { tasks: Task[], logging?: LoggingFunction, logGeneration?: LogGenerationFunction }) {
        

        this.logs          = [];
        this.logGeneration = logGeneration || inspect
        this.innerLog      = logging || console.dir;
        this.tasks         = tasks || [];
        this.results       = {};
        this.error         = undefined;
    }

    private deepCopy = (input: any) => JSON.parse(JSON.stringify(input));

    public log = async (message: any) => {
        const logMessage = this.logGeneration(message);
        this.logs.push(logMessage);

        await this.innerLog(logMessage);
    }

    public run = async (): Promise<TaskRunnerResults> => {
        const log     = this.log.bind(this);
        let   success = true;

        for (let i = 0; i < this.tasks.length; i++) {
            const task    = this.tasks[i];
            const taskLog: any[] = [];

            const combinedLogger = async (message: any) => {
                const logMessage = this.logGeneration(message);

                taskLog.push(logMessage);
                await log(message);
            }

            const executionStart = moment();

            try {
                const data         = await task.execute(task.input, combinedLogger, this.deepCopy(this.results));
                const executionEnd = moment();

                this.results[task.name] = {
                    success: true,
                    data,
                    log : taskLog,
                    info: {
                        executionStart: executionStart.format(),
                        executionEnd  : executionEnd.format(),
                    },
                };
            } catch (error) {
                const executionError = moment();

                this.error = error;
                await this.log(error);

                this.results[task.name] = {
                    success: false,
                    error,
                    log : taskLog,
                    info: {
                        executionStart: executionStart.format(),
                        executionError: executionError.format(),
                    },
                };

                success = false;
                break;
            }
        }

        return {
            success,
            logs   : this.logs,
            results: this.results,
            error  : this.error,
        };
    }
}
