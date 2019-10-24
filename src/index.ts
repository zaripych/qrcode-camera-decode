import { findExternalTools } from './helpers/externalTools';
import { determineVideoStatus } from './helpers/preferredVideo';
import { from, defer } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { captureVideo } from './helpers/captureVideo';
import { detectQrCode } from './helpers/detectQrCode';

interface IOpts {
  size?: string;
  rate?: number;
  preferredDevice?: string;
  verbosity?: 0 | 1 | 2;
}

export function captureQrCodesFromCamera(optsRaw: IOpts) {
  const opts = {
    verbosity: 0 as const,
    ...optsRaw,
  };
  return defer(() => from(findExternalTools())).pipe(
    concatMap(tools =>
      determineVideoStatus(opts, tools).then(status => [tools, status] as const)
    ),
    concatMap(([tools, status]) => {
      if (!status.preferred) {
        if (status.videoDevices.length === 0) {
          throw new Error('No cameras found on your system');
        }
        throw new Error('Cannot choose camera for capture');
      }

      const options = {
        input: status.preferred,
        width: status.width,
        height: status.height,
        rate: status.rate,
        ffmpegPath: tools.ffmpegPath,
        verbosity: opts.verbosity,
      };

      return captureVideo(options).pipe(
        detectQrCode({ width: options.width, height: options.height })
      );
    })
  );
}
