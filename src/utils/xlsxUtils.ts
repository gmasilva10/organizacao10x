// Lazy-loaded XLSX utility to reduce main bundle size
let xlsxModule: any = null;

const loadXLSX = async () => {
  if (!xlsxModule) {
    xlsxModule = await import('xlsx');
  }
  return xlsxModule;
};

export const readExcelFile = async (data: ArrayBuffer) => {
  const XLSX = await loadXLSX();
  return XLSX.read(data, { type: 'array' });
};

export const sheetToJson = async (worksheet: any) => {
  const XLSX = await loadXLSX();
  return XLSX.utils.sheet_to_json(worksheet);
};

export const createWorkbook = async () => {
  const XLSX = await loadXLSX();
  return XLSX.utils.book_new();
};

export const arrayToSheet = async (data: any[][]) => {
  const XLSX = await loadXLSX();
  return XLSX.utils.aoa_to_sheet(data);
};

export const appendSheet = async (workbook: any, worksheet: any, sheetName: string) => {
  const XLSX = await loadXLSX();
  return XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
};

export const writeFile = async (workbook: any, filename: string) => {
  const XLSX = await loadXLSX();
  return XLSX.writeFile(workbook, filename);
};

export const jsonToSheet = async (data: any[]) => {
  const XLSX = await loadXLSX();
  return XLSX.utils.json_to_sheet(data);
};