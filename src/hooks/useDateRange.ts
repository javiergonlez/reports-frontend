//---------------------------------------------------------------------------------------------------------------------------

import { useState } from 'react';
import type { StringOrDateOrNull } from '../types';

//---------------------------------------------------------------------------------------------------------------------------

type useDateRangeType = {
  dateRange: [StringOrDateOrNull, StringOrDateOrNull],
  handleDateRangeChange: (value: [StringOrDateOrNull, StringOrDateOrNull]) => void
}

const useDateRange: () => useDateRangeType = (): useDateRangeType => {
  const [dateRange, setDateRange] = useState<[StringOrDateOrNull, StringOrDateOrNull]>([null, null]);

  const handleDateRangeChange = (value: [StringOrDateOrNull, StringOrDateOrNull]): void => {
    setDateRange(value);
  };

  return {
    dateRange,
    handleDateRangeChange
  };
};

export { useDateRange };