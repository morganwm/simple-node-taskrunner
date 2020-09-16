let counter = 0;
jest.mock('moment', () => jest.fn(() => {
    return {
        format: jest.fn(() => {
            const res = `moment${counter}`;
            counter+=1;
            return res
        })
    }
}));

import { TaskFunction, TaskRunner, LoggingFunction, TaskRunnerResults, LogGenerationFunction, TaskResults } from '../src';

describe('Basic Functionality', () => {
    it('should call a set of tasks with correct inputs', async () => {

        const taskFunctionOne: TaskFunction = jest.fn(async (input: any, logging: LoggingFunction, results: TaskResults) => {
            await logging({ input });
            return input;
        });

        const taskFunctionTwo: TaskFunction = jest.fn(async (input: any, logging: LoggingFunction, results: TaskResults) => {
            await logging({ input });
            return input;
        });

        const fakeLoggingFunction: LoggingFunction = jest.fn((message: any) => ({}));
        const fakeLogGenerationFunction: LogGenerationFunction = jest.fn((input: any) => (input));

        const runner = new TaskRunner({
            tasks: [{
                name: 'function 1',
                execute: taskFunctionOne,
                input: { input: 'input1' }
            }, {
                name: 'function 2',
                execute: taskFunctionTwo,
                input: { input: 'input2' }
            }],
            logGeneration: fakeLogGenerationFunction,
            logging: fakeLoggingFunction,
        });

        const res = await runner.run();

        const expectedResults: TaskRunnerResults = {
            success: true,
            error: undefined,
            results: {
                'function 1': {
                    success: true,
                    data: { input: 'input1' },
                    error: undefined,
                    log: [
                        { input: { input: 'input1' }}
                    ],
                    info: {
                        executionStart: 'moment0',
                        executionEnd: 'moment1',
                    },
                },
                'function 2': {
                    success: true,
                    data: { input: 'input2' },
                    error: undefined,
                    info: {
                        executionStart: 'moment2',
                        executionEnd: 'moment3',
                    },
                    log: [
                        { input: { input: 'input2' }},
                    ],
                }
            },
            logs: [
                { input: { input: 'input1' }},
                { input: { input: 'input2' }},
            ]
        }

        expect(res).toEqual(expectedResults);

        expect(taskFunctionOne).toBeCalledWith({ input: 'input1' }, expect.any(Function), {});
        expect(taskFunctionTwo).toBeCalledWith({ input: 'input2' }, expect.any(Function), { 'function 1': expectedResults.results['function 1'] });

        expect((fakeLoggingFunction as any).mock.calls[0]).toEqual([{ input: { input: "input1" }}]);
        expect((fakeLoggingFunction as any).mock.calls[1]).toEqual([{ input: { input: "input2" }}]);

        expect((fakeLogGenerationFunction as any).mock.calls).toEqual([
            [{ input: { input: "input1" }}],
            [{ input: { input: "input1" }}],
            [{ input: { input: "input2" }}],
            [{ input: { input: "input2" }}],
        ]);
    });
});
