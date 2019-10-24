import { preferredDevice } from './preferredDevice';
import { IExternalTools } from './externalTools';
import { listAvailableVideoDevices } from './listDevices';

function determineDefaultInput() {
  const defaultInputByPlatform: Partial<Record<NodeJS.Platform, string>> = {
    linux: '/dev/video0',
    darwin: '0',
  };

  const result = defaultInputByPlatform[process.platform];

  if (!result) {
    throw new Error('Platform is not supported');
  }

  return result;
}

interface IOpts {
  size?: string;
  rate?: number;
  preferredDevice?: string;
  verbosity: 0 | 1 | 2;
}

const sizeRegex = /(\d+)x(\d+)/;

export function isValidSize(size: string) {
  return sizeRegex.test(size);
}

function parseSize(size: string) {
  const sizeResult = /(\d+)x(\d+)/.exec(size);
  if (!sizeResult) {
    return null;
  }
  const result = {
    width: parseInt(sizeResult[1], 10),
    height: parseInt(sizeResult[2], 10),
  };
  if (result.width <= 0 || result.height <= 0) {
    return null;
  }
  return result;
}

export async function determineVideoStatus(opts: IOpts, tools: IExternalTools) {
  const videoDevices = await listAvailableVideoDevices(opts, tools);

  const sizeResult = parseSize(opts.size || process.env.VIDEO_SIZE!);

  const videoOpts = {
    ...(sizeResult || {
      width: 640,
      height: 480,
    }),
    rate: typeof opts.rate === 'number' ? opts.rate : 15,
  };

  const preferred = preferredDevice(
    videoDevices,
    opts.preferredDevice ||
      process.env.PREFERRED_VIDEO_DEVICE ||
      determineDefaultInput()
  );

  return {
    videoDevices,
    preferred,
    ...videoOpts,
  };
}
