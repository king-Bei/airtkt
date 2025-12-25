
import { db } from './db';
import { FlightClass } from '../types';

/**
 * 計算最終價格
 * 優先級：
 * 1. 供應商專屬 + 航司專屬
 * 2. 供應商專屬 (不限航司)
 * 3. 航司專屬 (通用所有供應商)
 * 4. 全域預設
 */
export const calculateFinalPrice = (
  airlineCode: string, 
  flightClass: FlightClass, 
  basePrice: number,
  provider?: string
): number => {
  const rules = db.getPricingRules();
  
  // 1. 尋找供應商專屬規則
  const providerRules = rules.filter(r => r.provider === provider);
  let rule = providerRules.find(r => r.airlineCode === airlineCode && r.flightClass === flightClass)
          || providerRules.find(r => r.airlineCode === airlineCode)
          || providerRules.find(r => r.airlineCode === 'DEFAULT');

  // 2. 如果沒有供應商專屬，尋找通用規則
  if (!rule) {
    const generalRules = rules.filter(r => !r.provider);
    rule = generalRules.find(r => r.airlineCode === airlineCode && r.flightClass === flightClass)
        || generalRules.find(r => r.airlineCode === airlineCode)
        || generalRules.find(r => r.airlineCode === 'DEFAULT');
  }

  if (!rule) return basePrice;

  if (rule.markupType === 'percent') {
    return Math.round(basePrice * (1 + rule.markupAmount / 100));
  } else {
    return basePrice + rule.markupAmount;
  }
};
