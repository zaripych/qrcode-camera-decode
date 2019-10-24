import yargs from 'yargs';
import { run } from './run';
import { isValidSize } from '../helpers/preferredVideo';
import { ICmdOpts } from './cmdOpts';
import { listCameras } from './list';

const parsed = (yargs as yargs.Argv<ICmdOpts>)
  .options({
    multiple: {
      alias: 'm',
      boolean: true,
      default: true,
      description: 'Do not quit after first QR code found',
    },
    rate: {
      alias: 'r',
      number: true,
      default: 15,
      description: `Camera frame rate`,
    },
    size: {
      alias: 's',
      string: true,
      default: '640x480',
      description: `Camera resolution`,
    },
    device: {
      alias: 'd',
      string: true,
      description: `Camera to use`,
    },
    verbosity: {
      alias: 'v',
      count: true,
      default: 0,
      description: 'Verbosity of the output',
    },
  })
  .strict()
  .example(
    '$0 -s 640x480',
    'Capture camera with 640x480 resolution image, print single QR code and exit'
  )
  .wrap(Math.min(120, yargs.terminalWidth()))
  .check(args => {
    if (!isValidSize(args.size)) {
      throw new Error(`Video size should match (\\d+x\\d+)`);
    }
    return true;
  })
  .command(
    'list-cameras',
    'List cameras that can be specified as device parameter',
    args => args,
    args => {
      const cmd = args as ICmdOpts;
      runCommandAndExit(cmd, listCameras);
    }
  )
  .parse();

process.setUncaughtExceptionCaptureCallback(err => {
  console.error('💥  ', err);
});

function runCommandAndExit(
  cmd: ICmdOpts,
  command: (cmd: ICmdOpts) => Promise<void>
) {
  command(cmd)
    .then(() => {
      process.exitCode = 0;
    })
    .catch(err => {
      process.exitCode = 1;
      console.error('💥  ', err);
    });
}

if (parsed._.length === 0) {
  const cmd = parsed as ICmdOpts;
  runCommandAndExit(cmd, run);
}
