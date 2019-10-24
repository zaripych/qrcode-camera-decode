import { SpawnOptions, spawn } from 'child_process';
import { basename } from 'path';
import { EOL } from 'os';
import { ExtractValueTypes } from './extractValueTypes';

const possibleLogLevels = ['start-and-stop', 'stderr', 'stdout'] as const;

type LogLevels = ExtractValueTypes<typeof possibleLogLevels>;

interface ISpawnOpts {
  logLevels?: LogLevels[];
  allowedExitCodes?: number[];
  executable: string;
  arguments: string[];
  opts?: SpawnOptions;
  error: (err: Error) => void;
  complete: () => void;
}

const buildOptionalLog = (opts: ISpawnOpts) => (
  logFn: () => void,
  levels: ExtractValueTypes<NonNullable<ISpawnOpts['logLevels']>>
) => {
  if (opts.logLevels && opts.logLevels.some(item => levels.includes(item))) {
    logFn();
  }
};

export function spawnBase(opts: ISpawnOpts) {
  const allowedCodes = opts.allowedExitCodes || [0];
  const args = opts.arguments;
  const child = spawn(opts.executable, args, opts.opts || {});
  const execName = basename(opts.executable);

  const onExit = (code?: number, signal?: string) => {
    if (typeof code === 'number' && allowedCodes.includes(code)) {
      opts.complete();
    } else if (typeof code === 'number') {
      opts.error(new Error(`${execName} quit with exit code ${code}`));
    } else {
      opts.error(new Error(`${execName} crashed with ${signal}`));
    }
  };

  const onError = (error: Error) => {
    opts.error(error);
  };

  child.on('exit', onExit);
  child.on('error', onError);

  return child;
}

export function spawnWithLogging(opts: ISpawnOpts) {
  const allowedCodes = opts.allowedExitCodes || [0];
  const child = spawnBase(opts);

  const execName = basename(opts.executable);

  const optionalLog = buildOptionalLog(opts);

  const execId = `${execName}-[${child.pid}]`;

  optionalLog(() => {
    console.log(
      `${EOL}🚀  ${execId}: ${execName} ${opts.arguments.join(' ')}`,
      EOL
    );
  }, 'start-and-stop');

  const onExit = (code?: number, signal?: string) => {
    if (typeof code === 'number' && allowedCodes.includes(code)) {
      optionalLog(() => {
        console.log(`${EOL}✅  ${execId}: finished gracefully`, EOL);
      }, 'start-and-stop');
    } else if (typeof code === 'number') {
      optionalLog(() => {
        console.error(`${EOL}❌  ${execId}: quit with exit code ${code}`, EOL);
      }, 'start-and-stop');
    } else {
      optionalLog(() => {
        console.error(`${EOL}❌  ${execId}: stopped with ${signal}`, EOL);
      }, 'start-and-stop');
    }
  };

  const onError = (error: Error) => {
    optionalLog(() => {
      console.log(`${EOL}💥  ${execId}:`, error.message, EOL);
    }, 'start-and-stop');
  };

  child.on('exit', onExit);
  child.on('error', onError);

  optionalLog(() => {
    child.stderr.on('data', (buffer: Buffer) => {
      const line = buffer.toString('utf8');
      console.log(`   ${execId}:`, line.replace(/\\n/g, '  \n'));
    });
  }, 'stderr');

  optionalLog(() => {
    child.stdout.on('data', (buffer: Buffer) => {
      const line = buffer.toString('utf8');
      console.log(`   ${execId}:`, line.replace(/\\n/g, '  \n'));
    });
  }, 'stdout');

  return child;
}

export function spawnOutput(
  opts: Pick<ISpawnOpts, Exclude<keyof ISpawnOpts, 'complete' | 'error'>>,
  output: 'stderr' | 'stdout'
) {
  return new Promise<string>((res, rej) => {
    const results: string[] = [];
    const child = spawnWithLogging({
      ...opts,
      complete: () => res(results.join('')),
      error: err => rej(err),
    });

    const readable = output === 'stderr' ? child.stderr : child.stdout;

    readable.on('data', (buffer: Buffer | string) => {
      if (typeof buffer === 'string') {
        results.push(buffer);
      } else {
        results.push(buffer.toString('utf8'));
      }
    });
  });
}
