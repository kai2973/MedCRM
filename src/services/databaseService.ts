import { supabase } from '../lib/supabase';
import { Hospital, Contact, Note, UsageRecord, InstalledEquipment, SalesStage, HospitalLevel, ConsumablePrice } from '../types';

// ============== 醫院 CRUD ==============

export const fetchHospitals = async (): Promise<Hospital[]> => {
  const { data: hospitalsData, error } = await supabase
    .from('hospitals')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching hospitals:', error);
    return [];
  }

  // 取得所有已安裝設備
  const { data: equipmentData } = await supabase
    .from('installed_equipment')
    .select('*');

  // 組合資料
  const hospitals: Hospital[] = hospitalsData.map(h => ({
    id: h.id,
    name: h.name,
    address: h.address || '',
    region: h.region,
    level: h.level as HospitalLevel,
    stage: h.stage as SalesStage,
    equipmentInstalled: h.equipment_installed,
    lastVisit: h.last_visit || 'Never',
    notes: h.notes || '',
    chargePerUse: h.charge_per_use || undefined,
    consumables: h.consumables || [],
    installedEquipment: (equipmentData || [])
      .filter(e => e.hospital_id === h.id)
      .map(e => ({
        id: e.id,
        hospitalId: e.hospital_id,
        productCode: e.product_code,
        installDate: e.install_date,
        quantity: e.quantity,
        ownership: e.ownership
      }))
  }));

  return hospitals;
};

export const createHospital = async (
  hospital: Pick<Hospital, 'name' | 'region' | 'address' | 'stage' | 'level'>
): Promise<Hospital | null> => {
  const { data, error } = await supabase
    .from('hospitals')
    .insert({
      name: hospital.name,
      region: hospital.region,
      address: hospital.address,
      stage: hospital.stage,
      level: hospital.level,
      equipment_installed: false,
      last_visit: 'Never'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating hospital:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    address: data.address || '',
    region: data.region,
    level: data.level as HospitalLevel,
    stage: data.stage as SalesStage,
    equipmentInstalled: data.equipment_installed,
    lastVisit: data.last_visit || 'Never',
    notes: data.notes || '',
    chargePerUse: data.charge_per_use || undefined,
    consumables: data.consumables || [],
    installedEquipment: []
  };
};

export const updateHospital = async (hospital: Hospital): Promise<boolean> => {
  const { error } = await supabase
    .from('hospitals')
    .update({
      name: hospital.name,
      region: hospital.region,
      address: hospital.address,
      stage: hospital.stage,
      level: hospital.level,
      equipment_installed: hospital.equipmentInstalled,
      last_visit: hospital.lastVisit,
      notes: hospital.notes || null,
      charge_per_use: hospital.chargePerUse || null,
      consumables: hospital.consumables || null
    })
    .eq('id', hospital.id);

  if (error) {
    console.error('Error updating hospital:', error);
    return false;
  }

  return true;
};

export const deleteHospital = async (hospitalId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('hospitals')
    .delete()
    .eq('id', hospitalId);

  if (error) {
    console.error('Error deleting hospital:', error);
    return false;
  }

  return true;
};

// ============== 聯絡人 CRUD ==============

export const fetchContacts = async (): Promise<Contact[]> => {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching contacts:', error);
    return [];
  }

  return data.map(c => ({
    id: c.id,
    hospitalId: c.hospital_id,
    name: c.name,
    role: c.role || '',
    email: c.email || '',
    phone: c.phone || '',
    isKeyDecisionMaker: c.is_key_decision_maker
  }));
};

export const createContact = async (contact: Omit<Contact, 'id'>): Promise<Contact | null> => {
  const { data, error } = await supabase
    .from('contacts')
    .insert({
      hospital_id: contact.hospitalId,
      name: contact.name,
      role: contact.role,
      email: contact.email,
      phone: contact.phone,
      is_key_decision_maker: contact.isKeyDecisionMaker
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating contact:', error);
    return null;
  }

  return {
    id: data.id,
    hospitalId: data.hospital_id,
    name: data.name,
    role: data.role || '',
    email: data.email || '',
    phone: data.phone || '',
    isKeyDecisionMaker: data.is_key_decision_maker
  };
};

export const updateContact = async (contact: Contact): Promise<boolean> => {
  const { error } = await supabase
    .from('contacts')
    .update({
      name: contact.name,
      role: contact.role,
      email: contact.email,
      phone: contact.phone,
      is_key_decision_maker: contact.isKeyDecisionMaker
    })
    .eq('id', contact.id);

  if (error) {
    console.error('Error updating contact:', error);
    return false;
  }

  return true;
};

// ============== 筆記/活動記錄 CRUD ==============

// 擴展 Note 類型加入 userId
export interface NoteWithUserId extends Note {
  userId?: string;
}

export const fetchNotes = async (): Promise<NoteWithUserId[]> => {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notes:', error);
    return [];
  }

  return data.map(n => ({
    id: n.id,
    hospitalId: n.hospital_id,
    content: n.content,
    date: n.created_at,
    author: n.author_name,
    activityType: n.activity_type,
    tags: n.tags || [],
    sentiment: n.sentiment,
    nextStep: n.next_step,
    nextStepDate: n.next_step_date,
    relatedContactIds: n.related_contact_ids || [],
    attendees: n.attendees || undefined,
    userId: n.user_id || undefined
  }));
};

export const createNote = async (note: Omit<Note, 'id'>): Promise<NoteWithUserId | null> => {
  // 取得當前使用者 ID
  const { data: { user } } = await supabase.auth.getUser();
  
  // 先生成一個 ID
  const noteId = crypto.randomUUID();
  
  const { error } = await supabase
    .from('notes')
    .insert({
      id: noteId,
      hospital_id: note.hospitalId,
      content: note.content,
      activity_type: note.activityType,
      author_name: note.author,
      tags: note.tags || null,
      sentiment: note.sentiment || null,
      next_step: note.nextStep || null,
      next_step_date: note.nextStepDate || null,
      related_contact_ids: note.relatedContactIds || null,
      attendees: note.attendees || null,
      user_id: user?.id || null
    });

  if (error) {
    console.error('Error creating note:', error);
    return null;
  }

  // 不用 RETURNING，直接用我們知道的資料構建返回物件
  const newNote: NoteWithUserId = {
    id: noteId,
    hospitalId: note.hospitalId,
    content: note.content,
    date: new Date().toISOString(),
    author: note.author,
    activityType: note.activityType,
    tags: note.tags || [],
    sentiment: note.sentiment as any,
    nextStep: note.nextStep || undefined,
    nextStepDate: note.nextStepDate || undefined,
    relatedContactIds: note.relatedContactIds || [],
    attendees: note.attendees || undefined,
    userId: user?.id || undefined
  };

  // Check and update hospital last_visit
  const { data: hospital } = await supabase
    .from('hospitals')
    .select('last_visit')
    .eq('id', note.hospitalId)
    .single();

  if (hospital) {
    const noteDate = new Date(note.date);
    const lastVisit = hospital.last_visit === 'Never' ? new Date(0) : new Date(hospital.last_visit);

    if (noteDate > lastVisit) {
      await supabase
        .from('hospitals')
        .update({ last_visit: note.date })
        .eq('id', note.hospitalId);
    }
  }

  return newNote;
};

export const updateNote = async (note: Note): Promise<boolean> => {
  const { error } = await supabase
    .from('notes')
    .update({
      content: note.content,
      activity_type: note.activityType,
      tags: note.tags,
      sentiment: note.sentiment,
      next_step: note.nextStep,
      next_step_date: note.nextStepDate,
      related_contact_ids: note.relatedContactIds,
      attendees: note.attendees
    })
    .eq('id', note.id);

  if (error) {
    console.error('Error updating note:', error);
    return false;
  }

  // Check and update hospital last_visit
  const { data: hospital } = await supabase
    .from('hospitals')
    .select('last_visit')
    .eq('id', note.hospitalId)
    .single();

  if (hospital) {
    const noteDate = new Date(note.date);
    const lastVisit = hospital.last_visit === 'Never' ? new Date(0) : new Date(hospital.last_visit);

    if (noteDate > lastVisit) {
      await supabase
        .from('hospitals')
        .update({ last_visit: note.date })
        .eq('id', note.hospitalId);
    }
  }

  return true;
};

// ============== 使用記錄/訂單 CRUD ==============

export const fetchUsageRecords = async (): Promise<UsageRecord[]> => {
  const { data, error } = await supabase
    .from('usage_records')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching usage records:', error);
    return [];
  }

  return data.map(u => ({
    id: u.id,
    hospitalId: u.hospital_id,
    productCode: u.product_code,
    quantity: u.quantity,
    date: u.date,
    type: u.type
  }));
};

export const createUsageRecord = async (record: Omit<UsageRecord, 'id'>): Promise<UsageRecord | null> => {
  const { data, error } = await supabase
    .from('usage_records')
    .insert({
      hospital_id: record.hospitalId,
      product_code: record.productCode,
      quantity: record.quantity,
      date: record.date,
      type: record.type
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating usage record:', error);
    return null;
  }

  return {
    id: data.id,
    hospitalId: data.hospital_id,
    productCode: data.product_code,
    quantity: data.quantity,
    date: data.date,
    type: data.type
  };
};

export const updateUsageRecord = async (record: UsageRecord): Promise<boolean> => {
  const { error } = await supabase
    .from('usage_records')
    .update({
      product_code: record.productCode,
      quantity: record.quantity,
      date: record.date,
      type: record.type
    })
    .eq('id', record.id);

  if (error) {
    console.error('Error updating usage record:', error);
    return false;
  }

  return true;
};

// ============== 已安裝設備 CRUD ==============

export const createInstalledEquipment = async (
  equipment: InstalledEquipment
): Promise<InstalledEquipment | null> => {
  const { data, error } = await supabase
    .from('installed_equipment')
    .insert({
      hospital_id: equipment.hospitalId,
      product_code: equipment.productCode,
      install_date: equipment.installDate,
      quantity: equipment.quantity,
      ownership: equipment.ownership
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating installed equipment:', error);
    return null;
  }

  return {
    id: data.id,
    hospitalId: data.hospital_id,
    productCode: data.product_code,
    installDate: data.install_date,
    quantity: data.quantity,
    ownership: data.ownership
  };
};

export const updateInstalledEquipment = async (equipment: InstalledEquipment): Promise<boolean> => {
  const { error } = await supabase
    .from('installed_equipment')
    .update({
      product_code: equipment.productCode,
      install_date: equipment.installDate,
      quantity: equipment.quantity,
      ownership: equipment.ownership
    })
    .eq('id', equipment.id);

  if (error) {
    console.error('Error updating installed equipment:', error);
    return false;
  }

  return true;
};

export const deleteInstalledEquipment = async (equipmentId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('installed_equipment')
    .delete()
    .eq('id', equipmentId);

  if (error) {
    console.error('Error deleting installed equipment:', error);
    return false;
  }

  return true;
};

// ============== Profiles (用於行事曆篩選) ==============

export interface ProfileSummary {
  id: string;
  full_name: string;
  email: string;
  role_type: string;
}

export const fetchAllProfiles = async (): Promise<ProfileSummary[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role_type')
    .order('full_name', { ascending: true });

  if (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }

  return data.map(p => ({
    id: p.id,
    full_name: p.full_name || '',
    email: p.email || '',
    role_type: p.role_type || 'sales'
  }));
};
