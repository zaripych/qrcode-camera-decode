import { take, tap, takeUntil, ignoreElements, endWith } from 'rxjs/operators';
import { Observable, merge, fromEvent } from 'rxjs';
import { QRCode } from 'jsqr';
import { ICmdOpts } from './cmdOpts';
import { captureQrCodesFromCamera } from '..';

function printUntilFinished(opts: ICmdOpts) {
  return (qrCodes: Observable<QRCode>) => {
    const onInterrupt = merge(
      fromEvent(process, 'SIGINT'),
      fromEvent(process, 'SIGTERM')
    );

    return qrCodes.pipe(
      stream => (opts.multiple ? stream.pipe(take(1)) : stream),
      tap<QRCode>(result => {
        console.log(result.data);
      }),
      takeUntil(onInterrupt),
      ignoreElements()
    );
  };
}

export async function run(opts: ICmdOpts) {
  await captureQrCodesFromCamera(opts)
    .pipe(
      printUntilFinished(opts),
      endWith(undefined)
    )
    .toPromise();
}
