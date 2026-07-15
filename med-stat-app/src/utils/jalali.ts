// Lightweight Gregorian <-> Jalali (Iranian/Shamsi) calendar conversion.
// No external dependency; accurate for all modern dates.

export function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

  let jy = gy <= 1600 ? 0 : 979;
  gy -= gy <= 1600 ? 621 : 1600;

  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd +
    g_d_m[gm - 1];

  jy += 33 * Math.floor(days / 12053);
  days %= 12053;

  jy += 4 * Math.floor(days / 1461);
  days %= 1461;

  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }

  let jm: number;
  let jd: number;

  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }

  return [jy, jm, jd];
}

export function jalaliToGregorian(jy: number, jm: number, jd: number): [number, number, number] {
  let gy = jy <= 979 ? 621 : 1600;
  jy -= jy <= 979 ? 0 : 979;

  let days =
    365 * jy +
    Math.floor(jy / 33) * 8 +
    Math.floor(((jy % 33) + 3) / 4) +
    78 +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);

  gy += 400 * Math.floor(days / 146097);
  days %= 146097;

  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }

  gy += 4 * Math.floor(days / 1461);
  days %= 1461;

  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }

  let gd = days + 1;

  const isLeapGregorian = (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0;
  const sal_a = [0, 31, isLeapGregorian ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  let gm = 0;
  for (; gm < 13; gm++) {
    const v = sal_a[gm];
    if (gd <= v) break;
    gd -= v;
  }

  return [gy, gm, gd];
}

export function daysInJalaliMonth(jy: number, jm: number): number {
  const [gy1, gm1, gd1] = jalaliToGregorian(jy, jm, 1);
  const start = new Date(gy1, gm1 - 1, gd1);

  const nextJy = jm === 12 ? jy + 1 : jy;
  const nextJm = jm === 12 ? 1 : jm + 1;
  const [gy2, gm2, gd2] = jalaliToGregorian(nextJy, nextJm, 1);
  const end = new Date(gy2, gm2 - 1, gd2);

  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

/** Weekday index of the 1st of the given Jalali month, Saturday-first (0=Sat...6=Fri). */
export function firstWeekdayOfJalaliMonth(jy: number, jm: number): number {
  const [gy, gm, gd] = jalaliToGregorian(jy, jm, 1);
  const jsDay = new Date(gy, gm - 1, gd).getDay(); // 0=Sun...6=Sat
  return (jsDay + 1) % 7;
}

export const JALALI_MONTH_NAMES = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

export const JALALI_WEEKDAY_LABELS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toPersianDigits(value: number | string): string {
  return String(value).replace(/[0-9]/g, (digit) => PERSIAN_DIGITS[Number(digit)]);
}
