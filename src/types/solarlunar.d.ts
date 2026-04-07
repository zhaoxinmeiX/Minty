declare module 'solarlunar' {
  export interface SolarLunarResult {
    lYear: number;
    lMonth: number;
    lDay: number;
    monthCn: string;
    dayCn: string;
    isLeap: boolean;
    isTerm: boolean;
    term: string;
  }

  interface SolarLunarApi {
    solar2lunar(year?: number, month?: number, day?: number): SolarLunarResult | -1;
    getFestivals(year: number, month: number, day: number): string[];
  }

  const solarLunar: SolarLunarApi;
  export default solarLunar;
}
