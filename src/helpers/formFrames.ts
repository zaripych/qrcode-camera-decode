import { Observable, of, range } from 'rxjs';
import { scan, filter, map, concatMap } from 'rxjs/operators';

interface IState {
  toEmit?: Buffer;
  collected: number;
  buffer: Buffer | null;
}

interface IFrameInfo {
  width: number;
  height: number;
  bytesPerPixel: number;
}

export function formFrames(opts: IFrameInfo) {
  return (frames: Observable<Buffer>) => {
    const frameSizeBytes = opts.width * opts.height * opts.bytesPerPixel;
    return frames.pipe(
      concatMap(buffer => {
        // if our buffer size is more than frameSizeBytes - then split it
        if (buffer.byteLength > frameSizeBytes) {
          return range(0, buffer.byteLength / frameSizeBytes).pipe(
            map(i =>
              buffer.slice(
                i * frameSizeBytes,
                Math.min(buffer.byteLength, (i + 1) * frameSizeBytes)
              )
            )
          );
        } else {
          return of(buffer);
        }
      }),
      scan<Buffer, IState>(
        (acc, frame) => {
          if (frame.byteLength === frameSizeBytes && acc.collected === 0) {
            return {
              toEmit: frame,
              collected: 0,
              buffer: acc.buffer,
            };
          }

          const { collected } = acc;

          // allocate buffer only once
          const collectBuffer = acc.buffer || Buffer.alloc(frameSizeBytes);

          const bytesToCopyToCollectBuffer = Math.min(
            frameSizeBytes - collected,
            frame.byteLength
          );

          frame.copy(collectBuffer, collected, 0, bytesToCopyToCollectBuffer);

          const bytesToPutToNextFrame = Math.max(
            0,
            frame.byteLength - bytesToCopyToCollectBuffer
          );

          if (collected + bytesToCopyToCollectBuffer === frameSizeBytes) {
            const formedFrame = Buffer.from(collectBuffer);

            if (bytesToPutToNextFrame > 0) {
              frame.copy(
                collectBuffer,
                0,
                bytesToCopyToCollectBuffer,
                bytesToCopyToCollectBuffer + bytesToPutToNextFrame
              );
            }

            return {
              toEmit: formedFrame,
              collected: bytesToPutToNextFrame,
              buffer: collectBuffer,
            };
          } else {
            return {
              collected: collected + bytesToCopyToCollectBuffer,
              buffer: collectBuffer,
            };
          }
        },
        { collected: 0, buffer: null }
      ),
      filter(scanResult => !!scanResult.toEmit),
      map(scanResult => scanResult.toEmit!)
    );
  };
}
