// core teletext data contracts and color palette

export type TeletextColor =
  | 'black'
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'magenta'
  | 'cyan'
  | 'white';

export interface TeletextSpan {
  t: string;
  c?: TeletextColor;
  b?: TeletextColor;
  d?: boolean;
}

export interface FastextItem {
  code: string;
  label: string;
}

export interface FastextNav {
  red: FastextItem;
  green: FastextItem;
  yellow: FastextItem;
  cyan: FastextItem;
}

export interface TeletextFrameResponse {
  code: string;
  subpage: number;
  totalSubpages: number;
  title: string;
  timestamp: string;
  rows: TeletextSpan[][];
  fastext: FastextNav;
  source: 'live' | 'cache' | 'fallback';
  bytes: number;
}
