import { Observable } from 'rxjs';

export function readableToObservable<T = Buffer>(
  readable: NodeJS.ReadableStream
) {
  return new Observable<T>(subscriber => {
    const error = subscriber.error.bind(subscriber);
    const complete = subscriber.complete.bind(subscriber);
    const next = subscriber.next.bind(subscriber);

    readable.addListener('error', error);
    readable.addListener('data', next);
    readable.addListener('close', complete);
    readable.addListener('end', complete);

    return () => {
      readable.removeListener('error', error);
      readable.removeListener('data', next);
      readable.removeListener('close', complete);
      readable.removeListener('end', complete);
    };
  });
}
