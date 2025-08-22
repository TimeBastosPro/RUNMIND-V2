// src/services/securityLogger.ts

import { supabase } from './supabase';

export interface SecurityEvent {
  type: 'login_attempt' | 'password_reset' | 'profile_update' | 'data_access' | 'suspicious_activity' | 'rate_limit_exceeded';
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  success: boolean;
  details?: any;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Log de eventos de segurança
 */
export const logSecurityEvent = async (event: SecurityEvent): Promise<void> => {
  try {
    // Determinar severidade baseada no tipo de evento
    const severity = event.severity || getDefaultSeverity(event.type);
    
    await supabase.from('security_logs').insert([{
      event_type: event.type,
      user_id: event.userId,
      email: event.email,
      ip_address: event.ip,
      user_agent: event.userAgent,
      success: event.success,
      details: event.details,
      severity,
      timestamp: new Date().toISOString()
    }]);

    // Log local para debug
    console.log(`🔒 Security Event: ${event.type} - ${event.success ? 'SUCCESS' : 'FAILED'} - Severity: ${severity}`);
    
    // Alertar sobre eventos críticos
    if (severity === 'critical') {
      console.error(`🚨 CRITICAL SECURITY EVENT: ${event.type}`, event);
    }
  } catch (error) {
    console.error('❌ Erro ao logar evento de segurança:', error);
  }
};

/**
 * Determinar severidade padrão baseada no tipo de evento
 */
const getDefaultSeverity = (eventType: SecurityEvent['type']): SecurityEvent['severity'] => {
  switch (eventType) {
    case 'login_attempt':
      return 'medium';
    case 'password_reset':
      return 'high';
    case 'profile_update':
      return 'low';
    case 'data_access':
      return 'low';
    case 'suspicious_activity':
      return 'high';
    case 'rate_limit_exceeded':
      return 'critical';
    default:
      return 'medium';
  }
};

/**
 * Verificar se há atividades suspeitas
 */
export const checkSuspiciousActivity = async (userId: string, eventType: string): Promise<boolean> => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // Verificar tentativas de login falhadas
    if (eventType === 'login_attempt') {
      const { data: failedLogins } = await supabase
        .from('security_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('event_type', 'login_attempt')
        .eq('success', false)
        .gte('timestamp', oneHourAgo.toISOString());
      
      if (failedLogins && failedLogins.length >= 5) {
        await logSecurityEvent({
          type: 'suspicious_activity',
          userId,
          success: false,
          details: { reason: 'multiple_failed_logins', count: failedLogins.length },
          severity: 'high'
        });
        return true;
      }
    }
    
    // Verificar múltiplas atualizações de perfil
    if (eventType === 'profile_update') {
      const { data: profileUpdates } = await supabase
        .from('security_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('event_type', 'profile_update')
        .gte('timestamp', oneHourAgo.toISOString());
      
      if (profileUpdates && profileUpdates.length >= 10) {
        await logSecurityEvent({
          type: 'suspicious_activity',
          userId,
          success: false,
          details: { reason: 'excessive_profile_updates', count: profileUpdates.length },
          severity: 'medium'
        });
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('❌ Erro ao verificar atividades suspeitas:', error);
    return false;
  }
};

/**
 * Rate limiting simples
 */
export const checkRateLimit = async (identifier: string, action: string, maxAttempts: number = 5, windowMinutes: number = 15): Promise<boolean> => {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);
    
    const { data: attempts } = await supabase
      .from('security_logs')
      .select('*')
      .or(`email.eq.${identifier},user_id.eq.${identifier}`)
      .eq('event_type', action)
      .gte('timestamp', windowStart.toISOString());
    
    if (attempts && attempts.length >= maxAttempts) {
      await logSecurityEvent({
        type: 'rate_limit_exceeded',
        email: identifier.includes('@') ? identifier : undefined,
        userId: identifier.includes('@') ? undefined : identifier,
        success: false,
        details: { action, attempts: attempts.length, maxAttempts, windowMinutes },
        severity: 'critical'
      });
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao verificar rate limit:', error);
    return true; // Em caso de erro, permitir a ação
  }
};

/**
 * Log de tentativa de login
 */
export const logLoginAttempt = async (email: string, success: boolean, details?: any): Promise<void> => {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
  
  await logSecurityEvent({
    type: 'login_attempt',
    email,
    userAgent,
    success,
    details,
    severity: success ? 'low' : 'medium'
  });
  
  // Verificar rate limiting
  if (!success) {
    const isRateLimited = !(await checkRateLimit(email, 'login_attempt', 5, 15));
    if (isRateLimited) {
      throw new Error('Muitas tentativas de login. Tente novamente em 15 minutos.');
    }
  }
};

/**
 * Log de reset de senha
 */
export const logPasswordReset = async (email: string, success: boolean, details?: any): Promise<void> => {
  await logSecurityEvent({
    type: 'password_reset',
    email,
    success,
    details,
    severity: 'high'
  });
  
  // Rate limiting para reset de senha
  if (!(await checkRateLimit(email, 'password_reset', 3, 60))) {
    throw new Error('Muitas tentativas de reset de senha. Tente novamente em 1 hora.');
  }
};

/**
 * Log de atualização de perfil
 */
export const logProfileUpdate = async (userId: string, success: boolean, details?: any): Promise<void> => {
  await logSecurityEvent({
    type: 'profile_update',
    userId,
    success,
    details,
    severity: 'low'
  });
  
  // Verificar atividades suspeitas
  if (success) {
    const isSuspicious = await checkSuspiciousActivity(userId, 'profile_update');
    if (isSuspicious) {
      console.warn('⚠️ Atividade suspeita detectada no perfil do usuário:', userId);
    }
  }
};

/**
 * Log de acesso a dados
 */
export const logDataAccess = async (userId: string, dataType: string, success: boolean, details?: any): Promise<void> => {
  await logSecurityEvent({
    type: 'data_access',
    userId,
    success,
    details: { dataType, ...details },
    severity: 'low'
  });
};

/**
 * Obter estatísticas de segurança
 */
export const getSecurityStats = async (userId?: string, days: number = 7): Promise<any> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    let query = supabase
      .from('security_logs')
      .select('*')
      .gte('timestamp', startDate.toISOString());
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data: logs } = await query;
    
    if (!logs) return {};
    
    const stats = {
      totalEvents: logs.length,
      failedLogins: logs.filter(log => log.event_type === 'login_attempt' && !log.success).length,
      successfulLogins: logs.filter(log => log.event_type === 'login_attempt' && log.success).length,
      passwordResets: logs.filter(log => log.event_type === 'password_reset').length,
      suspiciousActivities: logs.filter(log => log.event_type === 'suspicious_activity').length,
      criticalEvents: logs.filter(log => log.severity === 'critical').length,
      highSeverityEvents: logs.filter(log => log.severity === 'high').length
    };
    
    return stats;
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas de segurança:', error);
    return {};
  }
};
