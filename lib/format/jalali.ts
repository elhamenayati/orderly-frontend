import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persianFa from "react-date-object/locales/persian_fa";

const weekdayLabels = [
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
  "شنبه",
];

export function isoDateFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayIso() {
  return isoDateFromDate(new Date());
}

export function defaultBookingDateIso() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return isoDateFromDate(date);
}

export function isoToJalaliDateObject(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const gregorian = new Date(year, month - 1, day);
  return new DateObject({
    date: gregorian,
    calendar: persian,
    locale: persianFa,
  });
}

export function jalaliDateObjectToIso(value: DateObject) {
  const gregorian = value.toDate();
  return isoDateFromDate(gregorian);
}

export function formatJalaliLong(isoDate: string) {
  const date = isoToJalaliDateObject(isoDate);
  const weekday = weekdayLabels[date.toDate().getDay()];
  return `${weekday} ${date.format("D MMMM YYYY")}`;
}

export function formatJalaliShort(isoDate: string) {
  const date = isoToJalaliDateObject(isoDate);
  return date.format("YYYY/MM/DD");
}

export function shiftIsoDate(isoDate: string, days: number) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return isoDateFromDate(date);
}

export { persian, persianFa };
