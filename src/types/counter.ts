export type CounterStats = {
  today: number;
  week: number;
  month: number;
  total: number;
};

export type CounterRpcStats = {
  today: number | string;
  week: number | string;
  month: number | string;
  total: number | string;
};
