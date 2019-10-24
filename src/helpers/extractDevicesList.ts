import { isTruthy } from './isTruthy';

export function extractDevicesList(
  listAppOutput: string,
  deviceRegex: RegExp,
  delimiterStart?: string,
  delimiterEnd?: string,
  captureGroupsMap: [number, number] = [1, 2]
) {
  const index = delimiterStart ? listAppOutput.indexOf(delimiterStart) : 0;
  if (index < 0) {
    return [];
  }

  const determineEndIndex = () => {
    const result = delimiterEnd ? listAppOutput.indexOf(delimiterEnd) : -1;
    if (result < 0) {
      return listAppOutput.length - 1;
    }
    return result;
  };

  const endIndex = determineEndIndex();

  const audioDevicesList =
    index > 0 ? listAppOutput.substring(index, endIndex) : listAppOutput;

  const matches = audioDevicesList.match(deviceRegex);
  if (!matches || matches.length === 0) {
    return [];
  }

  return matches
    .map(item => {
      const execResult = new RegExp(deviceRegex).exec(item.trim());
      if (!execResult) {
        return null;
      }

      const id = execResult[captureGroupsMap[0]];
      const name = execResult[captureGroupsMap[1]];
      if (id && name) {
        return {
          id,
          name,
        };
      } else if (id) {
        return {
          id,
          name: id,
        };
      } else {
        return null;
      }
    })
    .filter(isTruthy);
}
