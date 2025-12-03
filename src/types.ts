
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

export interface Note {
  id: string;
  hospitalId: string;
  content: string;
  date: string;
  author: string;
  activityType: ActivityType;
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

export interface Hospital {
  id: string;
  name: string;
  address: string;
  region: Region;
  level: HospitalLevel;
  stage: SalesStage;
  equipmentInstalled: boolean; // specifically MR810 (legacy flag, kept for dashboard compatibility)
  installedEquipment: InstalledEquipment[];
  lastVisit: string;
}

export interface AIResponse {
  text: string;
  suggestedAction?: 'EMAIL' | 'MEETING' | 'ORDER';
}
