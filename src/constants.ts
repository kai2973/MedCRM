
import { Hospital, Product, ProductType, SalesStage, Contact, UsageRecord, Note, HospitalLevel, Region } from './types';

export const PRODUCTS: Product[] = [
  { code: 'MR810', name: 'F&P 810 System', type: ProductType.EQUIPMENT, description: 'F&P 810 System' },
  { code: 'FP950', name: 'F&P 950 System', type: ProductType.EQUIPMENT, description: 'F&P 950 System' },
  { code: 'AA001', name: 'The Optiflow Nasal Interface', type: ProductType.CONSUMABLE, description: 'F&P Optiflow Nasal Interface' },
  { code: 'AA031', name: 'The Optiflow Trace™ Nasal Interface', type: ProductType.CONSUMABLE, description: 'F&P Optiflow Trace Nasal Interface with an integrated CO2 sampling tube' },
  { code: 'AA400', name: 'Optiflow Oxygen Kit AA400', type: ProductType.CONSUMABLE, description: 'Optiflow Oxygen Kit AA400' },
  { code: 'AA401', name: 'Optiflow Oxygen Kit AA401', type: ProductType.CONSUMABLE, description: 'Optiflow Oxygen Kit AA401' },
];

export const MOCK_HOSPITALS: Hospital[] = [
  {
    id: '1',
    name: '聖馬利亞綜合醫院',
    address: '台北市中正區健康路123號',
    region: Region.NORTH,
    level: HospitalLevel.MEDICAL_CENTER,
    stage: SalesStage.TRIAL,
    equipmentInstalled: true,
    installedEquipment: [
      { id: 'eq1', productCode: 'MR810', installDate: '2023-08-15', quantity: 5, ownership: '借用' }
    ],
    lastVisit: '2023-10-15'
  },
  {
    id: '2',
    name: '都會中心醫院',
    address: '台中市西屯區大道456號',
    region: Region.CENTRAL,
    level: HospitalLevel.MEDICAL_CENTER,
    stage: SalesStage.NEGOTIATION,
    equipmentInstalled: true,
    installedEquipment: [
      { id: 'eq2', productCode: 'MR810', installDate: '2023-05-20', quantity: 12, ownership: '買斷' },
      { id: 'eq3', productCode: 'FP950', installDate: '2023-09-10', quantity: 2, ownership: '借用' }
    ],
    lastVisit: '2023-10-20'
  },
  {
    id: '3',
    name: '西區診所',
    address: '台南市安平區夕陽路789號',
    region: Region.SOUTH,
    level: HospitalLevel.LOCAL,
    stage: SalesStage.LEAD,
    equipmentInstalled: false,
    installedEquipment: [],
    lastVisit: '2023-09-01'
  },
  {
    id: '4',
    name: '大橡樹醫療中心',
    address: '高雄市左營區橡樹巷101號',
    region: Region.SOUTH,
    level: HospitalLevel.REGIONAL,
    stage: SalesStage.CLOSED_WON,
    equipmentInstalled: true,
    installedEquipment: [
      { id: 'eq4', productCode: 'MR810', installDate: '2023-01-10', quantity: 20, ownership: '買斷' }
    ],
    lastVisit: '2023-10-25'
  },
  {
    id: '5',
    name: '松谷健康中心',
    address: '基隆市仁愛區松街202號',
    region: Region.NORTH,
    level: HospitalLevel.LOCAL,
    stage: SalesStage.QUALIFICATION,
    equipmentInstalled: false,
    installedEquipment: [],
    lastVisit: '2023-10-10'
  },
];

export const MOCK_CONTACTS: Contact[] = [
  { id: 'c1', hospitalId: '1', name: '陳淑芬 醫師', role: 'ICU 主任', email: 's.smith@stmarys.com', phone: '02-2345-6789', isKeyDecisionMaker: true },
  { id: 'c2', hospitalId: '1', name: '王大明', role: '採購經理', email: 'j.doe@stmarys.com', phone: '02-2345-6790', isKeyDecisionMaker: false },
  { id: 'c3', hospitalId: '2', name: '李雅婷', role: '呼吸治療師', email: 'e.blunt@citycentral.com', phone: '04-2345-6789', isKeyDecisionMaker: true },
];

export const MOCK_USAGE: UsageRecord[] = [
  { id: 'u1', hospitalId: '1', productCode: 'AA001', quantity: 50, date: '2023-08-01', type: '訂單' },
  { id: 'u2', hospitalId: '1', productCode: 'AA001', quantity: 45, date: '2023-09-01', type: '訂單' },
  { id: 'u3', hospitalId: '1', productCode: 'AA001', quantity: 60, date: '2023-10-01', type: '訂單' },
  { id: 'u4', hospitalId: '2', productCode: 'AA031', quantity: 120, date: '2023-10-05', type: '訂單' },
];

export const MOCK_NOTES: Note[] = [
  { id: 'n1', hospitalId: '1', content: '與陳醫師開會。她對 MR810 的效能感到滿意，但對耗材成本有些顧慮。', date: '2023-10-15', author: '我', activityType: '會議' },
  { id: 'n2', hospitalId: '3', content: '初步陌生拜訪。櫃台人員已代為轉達訊息。', date: '2023-09-01', author: '我', activityType: '通話' },
];
