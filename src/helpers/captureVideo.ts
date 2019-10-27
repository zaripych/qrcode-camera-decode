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
  ffmpegOutputArgs?: string[];
  verbosity?: 0 | 1 | 2;
}

export function captureVideo(optsRaw: IVideoCaptureOpts) {
  return new Observable<Buffer>(subscriber => {
    const opts = {
      verbosity: 0 as const,
      ...optsRaw,
    };

    const inputArgs =
      opts.ffmpegInputArgs ||
      determinePlatformSpecificInputArguments({
        device: opts.device,
        input: opts.input,
        size: {
          width: opts.width,
          height: opts.height,
        },
        rate: opts.rate,
      });

    const [pixelFormat, bytesPerPixel] = ['rgba', 4];

    const outputArgs = opts.ffmpegOutputArgs || [
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

    const videoOutput = captureVideoCore({
      ffmpegPath: opts.ffmpegPath,
      ffmpegInputArgs: inputArgs,
      ffmpegOutputArgs: outputArgs,
      verbosity: opts.verbosity,
    }).pipe(
      formFrames({
        width: opts.width,
        height: opts.height,
        bytesPerPixel,
      })
    );

    subscriber.add(videoOutput.subscribe(subscriber));
  });
}

interface IVideoCaptureCoreOpts {
  ffmpegPath: string;
  ffmpegInputArgs: string[];
  ffmpegOutputArgs: string[];
  verbosity?: 0 | 1 | 2;
}

export function captureVideoCore(optsRaw: IVideoCaptureCoreOpts) {
  return new Observable<Buffer>(subscriber => {
    const opts = {
      verbosity: 0,
      ...optsRaw,
    };

    const ffmpeg = spawnWithLogging({
      executable: opts.ffmpegPath,
      arguments: [...opts.ffmpegInputArgs, ...opts.ffmpegOutputArgs],
      allowedExitCodes: [0, 255],

      error: subscriber.error.bind(subscriber),
      complete: subscriber.complete.bind(subscriber),

      logLevels: [
        opts.verbosity >= 1 && ('start-and-stop' as const),
        opts.verbosity >= 2 && ('stderr' as const),
      ].filter(isTruthy),
    });

    const videoOutput = readableToObservable(ffmpeg.stdout);

    subscriber.add(videoOutput.subscribe(subscriber));
    subscriber.add(() => {
      ffmpeg.kill('SIGINT');
    });
  });
}

function determinePlatformSpecificInputArguments(opts: {
  device?: string;
  input: string;
  size?: {
    width: number;
    height: number;
  };
  rate?: number;
}) {
  function inputCaps(rateOpt = '-framerate', sizeOpt = '-video_size') {
    const rateOpts =
      (typeof opts.rate === 'number' && [rateOpt, opts.rate.toFixed(0)]) || [];
    const sizeOpts =
      (opts.size && [sizeOpt, `${opts.size.width}x${opts.size.height}`]) || [];
    return [...rateOpts, ...sizeOpts];
  }

  const formatOpts = inputCaps();

  if (opts.device) {
    return ['-f', opts.device, ...formatOpts, '-i', opts.input];
  }

  if (process.platform === 'win32') {
    return ['-f', 'dshow', ...formatOpts, '-i', `video=${opts.input}`];
  }

  if (process.platform === 'darwin') {
    return ['-f', 'avfoundation', ...formatOpts, '-i', `${opts.input}:`];
  }

  if (process.platform === 'linux') {
    return ['-f', 'v4l2', ...formatOpts, '-i', opts.input];
  }

  throw new Error(
    `Cannot determine ffmpeg capture arguments for platform ${process.platform}`
  );
}
