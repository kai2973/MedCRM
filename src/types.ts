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
  CONTACT = '接洽中',
  TRIAL = '試用評估',
  PARTNER = '合作客戶',
  KEY_ACCOUNT = '重點客戶'
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

// 台灣縣市
export enum City {
  // 北區
  TAIPEI = '台北市',
  NEW_TAIPEI = '新北市',
  KEELUNG = '基隆市',
  TAOYUAN = '桃園市',
  HSINCHU_CITY = '新竹市',
  HSINCHU_COUNTY = '新竹縣',
  // 中區
  MIAOLI = '苗栗縣',
  TAICHUNG = '台中市',
  CHANGHUA = '彰化縣',
  NANTOU = '南投縣',
  YUNLIN = '雲林縣',
  // 南區
  CHIAYI_CITY = '嘉義市',
  CHIAYI_COUNTY = '嘉義縣',
  TAINAN = '台南市',
  KAOHSIUNG = '高雄市',
  PINGTUNG = '屏東縣',
  // 東區
  YILAN = '宜蘭縣',
  HUALIEN = '花蓮縣',
  TAITUNG = '台東縣',
  // 離島
  PENGHU = '澎湖縣',
  KINMEN = '金門縣',
  LIENCHIANG = '連江縣'
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
