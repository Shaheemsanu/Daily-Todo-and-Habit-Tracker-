import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays } from 'date-fns';

export const dateKey = (date: Date) => format(date, 'yyyy-MM-dd');
export const todayKey = () => dateKey(new Date());
export const prettyDate = (key: string) => format(new Date(`${key}T12:00:00`), 'EEEE, MMMM d');
export const weekKeys = (date = new Date()) =>
  eachDayOfInterval({ start: startOfWeek(date, { weekStartsOn: 1 }), end: endOfWeek(date, { weekStartsOn: 1 }) }).map(dateKey);
export const lastNDays = (count: number, end = new Date()) =>
  Array.from({ length: count }, (_, i) => dateKey(subDays(end, count - i - 1)));
