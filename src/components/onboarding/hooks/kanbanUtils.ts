
export const getDurationDays = (serviceType: string = 'mensal'): number => {
  switch(serviceType.toLowerCase()) {
    case 'mensal': return 30;
    case 'trimestral': return 90;
    case 'semestral': return 180;
    case 'anual': return 365;
    default: return 30;
  }
};

export const calculateEndDate = (startDate: Date, serviceType: string): Date => {
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + getDurationDays(serviceType));
  return endDate;
};
