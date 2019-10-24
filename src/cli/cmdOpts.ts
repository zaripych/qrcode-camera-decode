export interface ICmdOpts {
  multiple: boolean;
  size?: string;
  rate?: number;
  device?: string;
  verbosity: 0 | 1 | 2;
}
