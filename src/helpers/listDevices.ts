import { extractDevicesList } from './extractDevicesList';
import { IExternalTools } from './externalTools';
import { isTruthy } from './isTruthy';
import { spawnOutput } from './spawn';

function extractDirectShowVideoDevices(ffmpegOutput: string) {
  const delimiterStart = 'DirectShow video devices';
  const delimiterEnd = 'DirectShow audio devices';
  const regex = /^\[[^\[\]]+\]\s+"(.+)"/gm;

  return extractDevicesList(ffmpegOutput, regex, delimiterStart, delimiterEnd);
}

function extractAVFoundationVideoDevices(ffmpegOutput: string) {
  const delimiterStart = 'AVFoundation video devices:';
  const delimiterEnd = 'AVFoundation audio devices:';
  const regex = /^\[[^\[\]]+\]\s+\[(\d+)\]\s+(.+)\s*$/gm;

  return extractDevicesList(ffmpegOutput, regex, delimiterStart, delimiterEnd);
}

function extractVideo4LinuxDevices(output: string) {
  const regex = /^(.*)\:$\s+(\/dev\/video\d+)/gm;
  return extractDevicesList(output, regex, undefined, undefined, [2, 1]);
}

interface IOpts {
  verbosity: 0 | 1 | 2;
}

export async function listAvailableVideoDevices(
  opts: IOpts,
  tools: IExternalTools
) {
  const logLevels = [
    opts.verbosity >= 1 && ('start-and-stop' as const),
    opts.verbosity >= 2 && ('stderr' as const),
  ].filter(isTruthy);

  if (process.platform === 'win32' || process.platform === 'darwin') {
    const result = await spawnOutput(
      {
        allowedExitCodes: [0, 1],
        executable: tools.ffmpegPath,
        arguments: [
          '-list_devices',
          'true',
          '-f',
          process.platform === 'win32' ? 'dshow' : 'avfoundation',
          '-i',
          'dummy',
        ],
        logLevels,
      },
      'stderr'
    );

    if (process.platform === 'win32') {
      return extractDirectShowVideoDevices(result);
    } else {
      return extractAVFoundationVideoDevices(result);
    }
  } else if (process.platform === 'linux') {
    // ffmpeg -f v4l2 -list_formats all -i /dev/video0
    const result = await spawnOutput(
      {
        executable: tools.v4lCtlPath,
        arguments: ['--list-devices'],
        logLevels,
      },
      'stdout'
    );

    return extractVideo4LinuxDevices(result);
  } else {
    return [];
  }
}
