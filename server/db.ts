import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { eq } from "drizzle-orm";
import { 
  InsertUser, 
  users, 
  type Clinic,
  type Appointment,
  type InsertAppointment,
  type LineGroupState,
  type InsertLineGroupState,
  type InsertClinic
} from "../drizzle/schema";

// Supabase Client
let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const supabaseUrl = process.env.SUPABASE_URL || 'https://clzjdlykhjwrlksyjlfz.supabase.co';
    const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '';
    
    if (!supabaseKey) {
      throw new Error('SUPABASE_KEY or SUPABASE_ANON_KEY is required');
    }
    
    _supabase = createClient(supabaseUrl, supabaseKey);
  }
  return _supabase;
}

// ===== User Functions (保留原有的,如果需要) =====

export async function upsertUser(user: InsertUser): Promise<void> {
  // 這個函數可能不需要了,因為這是 LINE Bot 不是 Manus 應用
  console.warn('[Database] upsertUser is not implemented for LINE Bot');
}

export async function getUserByOpenId(openId: string) {
  // 這個函數可能不需要了
  console.warn('[Database] getUserByOpenId is not implemented for LINE Bot');
  return undefined;
}

// ===== Clinic Functions =====

export async function getClinicByChannelId(channelId: string): Promise<Clinic | undefined> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('clinics')
      .select('*')
      .eq('linechannelid', channelId)  // PostgreSQL 小寫欄位名
      .single();
    
    if (error) {
      console.error('[Database] Error fetching clinic:', error);
      return undefined;
    }
    
    if (!data) {
      return undefined;
    }
    
    // 轉換 PostgreSQL 小寫欄位名為 camelCase
    return {
      id: data.id,
      name: data.name,
      lineChannelId: data.linechannelid,
      lineChannelSecret: data.linechannelsecret,
      lineChannelAccessToken: data.linechannelaccesstoken,
      webhookUrl: data.webhookurl,
      isActive: data.isactive,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    } as Clinic;
  } catch (error) {
    console.error('[Database] Exception in getClinicByChannelId:', error);
    return undefined;
  }
}

export async function getClinicById(id: number): Promise<Clinic | undefined> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('clinics')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('[Database] Error fetching clinic:', error);
      return undefined;
    }
    
    if (!data) {
      return undefined;
    }
    
    // 轉換 PostgreSQL 小寫欄位名為 camelCase
    return {
      id: data.id,
      name: data.name,
      lineChannelId: data.linechannelid,
      lineChannelSecret: data.linechannelsecret,
      lineChannelAccessToken: data.linechannelaccesstoken,
      webhookUrl: data.webhookurl,
      isActive: data.isactive,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    } as Clinic;
  } catch (error) {
    console.error('[Database] Exception in getClinicById:', error);
    return undefined;
  }
}

export async function createClinic(clinic: InsertClinic): Promise<number> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('clinics')
      .insert({
        name: clinic.name,
        linechannelid: clinic.lineChannelId,
        linechannelsecret: clinic.lineChannelSecret,
        linechannelaccesstoken: clinic.lineChannelAccessToken,
        webhookurl: clinic.webhookUrl,
        isactive: clinic.isActive ?? true,
      })
      .select()
      .single();
    
    if (error) {
      console.error('[Database] Error creating clinic:', error);
      throw new Error('Failed to create clinic');
    }
    
    return data.id;
  } catch (error) {
    console.error('[Database] Exception in createClinic:', error);
    throw error;
  }
}

// ===== Appointment Functions =====

export async function createAppointment(appointment: InsertAppointment): Promise<number> {
  // TODO: 實作使用 Supabase
  console.warn('[Database] createAppointment not implemented yet');
  return 0;
}

export async function getAppointmentById(id: number): Promise<Appointment | undefined> {
  // TODO: 實作使用 Supabase
  console.warn('[Database] getAppointmentById not implemented yet');
  return undefined;
}

export async function getPendingAppointmentsByGroup(lineGroupId: string): Promise<Appointment[]> {
  // TODO: 實作使用 Supabase
  console.warn('[Database] getPendingAppointmentsByGroup not implemented yet');
  return [];
}

export async function updateAppointmentStatus(id: number, status: string): Promise<void> {
  // TODO: 實作使用 Supabase
  console.warn('[Database] updateAppointmentStatus not implemented yet');
}

export async function deleteAppointment(id: number): Promise<void> {
  // TODO: 實作使用 Supabase
  console.warn('[Database] deleteAppointment not implemented yet');
}

// ===== Group State Functions =====

export async function upsertGroupState(state: InsertLineGroupState): Promise<void> {
  // TODO: 實作使用 Supabase
  console.warn('[Database] upsertGroupState not implemented yet');
}

export async function getGroupState(lineGroupId: string): Promise<LineGroupState | undefined> {
  // TODO: 實作使用 Supabase
  console.warn('[Database] getGroupState not implemented yet');
  return undefined;
}
