import { findExternalTools } from '../helpers/externalTools';
import { determineVideoStatus } from '../helpers/preferredVideo';
import { ICmdOpts } from './cmdOpts';
import { EOL } from 'os';

export async function listCameras(opts: ICmdOpts) {
  const tools = await findExternalTools();

  const status = await determineVideoStatus(opts, tools);

  console.log(
    status.videoDevices.map(item => `${item.id}: ${item.name}`).join(EOL)
  );
}
