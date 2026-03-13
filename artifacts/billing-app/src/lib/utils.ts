import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
}

// Indian Numbering System to Words Converter
export function numberToWordsIndian(num: number): string {
  if (num === 0) return "Zero Rupees Only";
  
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const numStr = Math.floor(num).toString();
  if (numStr.length > 9) return "Amount too large"; // Max 99 Crores

  const n = ('000000000' + numStr).slice(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return "";

  let str = '';
  str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0] as any] + ' ' + a[n[1][1] as any]) + 'Crore ' : '';
  str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0] as any] + ' ' + a[n[2][1] as any]) + 'Lakh ' : '';
  str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[n[3][0] as any] + ' ' + a[n[3][1] as any]) + 'Thousand ' : '';
  str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[n[4][0] as any] + ' ' + a[n[4][1] as any]) + 'Hundred ' : '';
  
  const lastTwo = Number(n[5]);
  if (lastTwo !== 0) {
    if (str !== '') str += 'and ';
    str += (a[lastTwo] || b[n[5][0] as any] + ' ' + a[n[5][1] as any]);
  }

  const fractionStr = (num % 1).toFixed(2).substring(2);
  const fractionNum = Number(fractionStr);
  let fractionText = "";
  
  if (fractionNum > 0) {
    fractionText = " and " + (a[fractionNum] || b[fractionStr[0] as any] + ' ' + a[fractionStr[1] as any]).trim() + " Paise";
  }

  return str.trim() + " Rupees" + fractionText + " Only";
}
