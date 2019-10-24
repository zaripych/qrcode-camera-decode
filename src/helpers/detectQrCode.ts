import { Observable, empty, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import jsqr from 'jsqr';

export function detectQrCode(opts: { width: number; height: number }) {
  return (frames: Observable<Buffer>) =>
    frames.pipe(
      mergeMap(frame => {
        const code = jsqr(
          new Uint8ClampedArray(frame.buffer),
          opts.width,
          opts.height
        );

        if (code === null) {
          return empty();
        } else {
          return of(code);
        }
      })
    );
}
