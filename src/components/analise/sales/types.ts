
export interface SalesScriptData {
  id: string;
  month: string;
  leads: number;
  block1: number;
  block2: number;
  block3: number;
  audio: number;
  offer: number;
  sale: number;
}

export interface AveragesData {
  leads: number;
  block1: number;
  block2: number;
  block3: number;
  audio: number;
  offer: number;
  sale: number;
  conversionRate: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface ConversionDataPoint {
  name: string;
  [key: string]: string | number;
}
