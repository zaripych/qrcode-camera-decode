import { spawnWithLogging } from './spawn';
import { Observable } from 'rxjs';
import { readableToObservable } from './readableToObservable';
import { formFrames } from './formFrames';
import { isTruthy } from './isTruthy';

interface IVideoCaptureOpts {
  device?: string;
  input: string;
  width: number;
  height: number;
  outputSize?: {
    width: number;
    height: number;
  };
  rate: number;
  ffmpegPath: string;
  ffmpegInputArgs?: string[];
  verbosity?: 0 | 1 | 2;
}

export function captureVideo(optsRaw: IVideoCaptureOpts) {
  return new Observable<Buffer>(subscriber => {
    const opts = {
      verbosity: 0,
      ...optsRaw,
    };

    const inputArgs =
      opts.ffmpegInputArgs || determinePlatformSpecificInputArguments(optsRaw);

    const [pixelFormat, bytesPerPixel] = ['rgba', 4];

    const outputArgs = [
      '-f',
      'image2pipe',
      '-s',
      (opts.outputSize &&
        `${opts.outputSize.width}x${opts.outputSize.height}`) ||
        `${opts.width}x${opts.height}`,
      '-vcodec',
      'rawvideo',
      '-pix_fmt',
      pixelFormat,
      'pipe:1',
    ];

    const ffmpeg = spawnWithLogging({
      executable: opts.ffmpegPath,
      arguments: [...inputArgs, ...outputArgs],
      allowedExitCodes: [0, 255],

      error: subscriber.error.bind(subscriber),
      complete: subscriber.complete.bind(subscriber),

      logLevels: [
        opts.verbosity >= 1 && ('start-and-stop' as const),
        opts.verbosity >= 2 && ('stderr' as const),
      ].filter(isTruthy),
    });

    const videoOutput = readableToObservable(ffmpeg.stdout).pipe(
      formFrames({
        width: opts.width,
        height: opts.height,
        bytesPerPixel,
      })
    );

    subscriber.add(videoOutput.subscribe(subscriber));
    subscriber.add(() => {
      ffmpeg.kill('SIGINT');
    });
  });
}

function determinePlatformSpecificInputArguments(opts: IVideoCaptureOpts) {
  if (opts.device) {
    return [
      '-f',
      opts.device,
      '-framerate',
      opts.rate.toFixed(0),
      '-s',
      `${opts.width}x${opts.height}`,
      '-i',
      opts.input,
    ];
  }

  if (process.platform === 'win32') {
    return [
      '-f',
      'dshow',
      `-framerate`,
      opts.rate.toFixed(0),
      '-video_size',
      `${opts.width}x${opts.height}`,
      '-i',
      `video=${opts.input}`,
    ];
  }

  if (process.platform === 'darwin') {
    return [
      '-f',
      'avfoundation',
      '-framerate',
      opts.rate.toFixed(0),
      '-s',
      `${opts.width}x${opts.height}`,
      '-i',
      `${opts.input}:`,
    ];
  }

  if (process.platform === 'linux') {
    return [
      '-f',
      'v4l2',
      '-framerate',
      opts.rate.toFixed(0),
      '-s',
      `${opts.width}x${opts.height}`,
      '-i',
      opts.input,
    ];
  }

  throw new Error(
    `Cannot determine ffmpeg capture arguments for platform ${process.platform}`
  );
}
