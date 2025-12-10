
export enum ProductType {
  EQUIPMENT = '設備',
  CONSUMABLE = '耗材'
}

export interface Product {
  code: string;
  name: string;
  type: ProductType;
  description: string;
}

export type UsageType = '訂單' | '樣品';

export interface UsageRecord {
  id: string;
  hospitalId: string;
  productCode: string;
  quantity: number;
  date: string; // ISO Date
  type: UsageType;
}

export enum SalesStage {
  LEAD = '潛在客戶',
  QUALIFICATION = '資格審查',
  TRIAL = '試用',
  NEGOTIATION = '協商',
  CLOSED_WON = '成交',
  CLOSED_LOST = '流失'
}

export enum HospitalLevel {
  MEDICAL_CENTER = '醫學中心',
  REGIONAL = '區域醫院',
  LOCAL = '地區醫院'
}

export interface Contact {
  id: string;
  hospitalId: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  isKeyDecisionMaker: boolean;
}

export type ActivityType = '通話' | '會議' | '拜訪' | '郵件' | '筆記' | '展示' | '教育訓練';

export type Sentiment = 'positive' | 'neutral' | 'negative';

export interface Note {
  id: string;
  hospitalId: string;
  content: string;
  date: string;
  author: string;
  activityType: ActivityType;
  tags?: string[];
  sentiment?: Sentiment;
  nextStep?: string;
  nextStepDate?: string;
  relatedContactIds?: string[];
  attendees?: string; // Free text for non-contact participants
}

export type OwnershipType = '借用' | '買斷' | '租賃';

export interface InstalledEquipment {
  id: string;
  hospitalId?: string;
  productCode: string;
  installDate: string;
  quantity: number;
  ownership: OwnershipType;
}

export enum Region {
  NORTH = '北區',
  CENTRAL = '中區',
  SOUTH = '南區',
  EAST = '東區'
}

// 耗材價格資訊
export interface ConsumablePrice {
  code: string;   // 耗材代碼
  price: number;  // 售價
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  region: Region;
  level: HospitalLevel;
  stage: SalesStage;
  equipmentInstalled: boolean;
  installedEquipment: InstalledEquipment[];
  lastVisit: string;
  notes?: string; // 備註欄位
  chargePerUse?: number; // 每次收費價格
  consumables?: ConsumablePrice[]; // 使用耗材及其價格
}

export interface AIResponse {
  text: string;
  suggestedAction?: 'EMAIL' | 'MEETING' | 'ORDER';
}

// 合約類型
export type ContractType = 'consumable' | 'equipment';

// 保養頻率
export type MaintenanceFrequency = 'yearly' | 'biannual' | 'quarterly' | 'monthly';

// 合約資訊
export interface Contract {
  id: string;
  hospitalId: string;
  productCode: string;
  contractType: ContractType;
  startDate: string;
  durationYears: number;
  warrantyYears?: number;
  maintenanceFrequency?: MaintenanceFrequency;
}
