export interface IExternalTools {
  ffmpegPath: string;
  v4lCtlPath: string;
}

export async function findExternalTools(): Promise<IExternalTools> {
  return {
    ffmpegPath: 'ffmpeg',
    v4lCtlPath: 'v4l2-ctl',
  };
}
