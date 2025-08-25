// src/services/securityLogger.ts

import { supabase } from './supabase';
import { loginRateLimiter, signupRateLimiter, passwordResetRateLimiter } from './rateLimiter';

export interface SecurityEvent {
  type: 'login_attempt' | 'password_reset' | 'profile_update' | 'data_access' | 'suspicious_activity' | 'rate_limit_exceeded' | 'account_creation' | 'session_expired' | 'logout' | 'email_verification';
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  success: boolean;
  details?: any;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  location?: {
    latitude?: number;
    longitude?: number;
    city?: string;
    country?: string;
  };
}

export interface SecurityAlert {
  id: string;
  type: 'suspicious_login' | 'multiple_failures' | 'unusual_activity' | 'rate_limit' | 'data_breach';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  resolved: boolean;
  userId?: string;
  email?: string;
}

/**
 * ✅ MELHORADO: Log de eventos de segurança com rate limiting
 */
export const logSecurityEvent = async (event: SecurityEvent): Promise<void> => {
  try {
    // Determinar severidade baseada no tipo de evento
    const severity = event.severity || getDefaultSeverity(event.type);
    
    // ✅ NOVO: Verificar rate limiting para logs
    const identifier = event.email || event.userId || 'anonymous';
    const rateLimitResult = await loginRateLimiter.checkRateLimit(`log_${identifier}`);
    
    if (!rateLimitResult.allowed) {
      console.warn('⚠️ Rate limit atingido para logs de segurança');
      return;
    }
    
    // ✅ MELHORADO: Adicionar informações de contexto
    const enhancedEvent = {
      ...event,
      severity,
      timestamp: new Date().toISOString(),
      sessionId: generateSessionId(),
      deviceInfo: await getDeviceInfo(),
      networkInfo: await getNetworkInfo()
    };
    
    await supabase.from('security_logs').insert([{
      event_type: enhancedEvent.type,
      user_id: enhancedEvent.userId,
      email: enhancedEvent.email,
      ip_address: enhancedEvent.ip,
      user_agent: enhancedEvent.userAgent,
      success: enhancedEvent.success,
      details: enhancedEvent.details,
      severity: enhancedEvent.severity,
      timestamp: enhancedEvent.timestamp,
      location_data: enhancedEvent.location,
      session_id: enhancedEvent.sessionId,
      device_info: enhancedEvent.deviceInfo,
      network_info: enhancedEvent.networkInfo
    }]);

    // Log local para debug
    console.log(`🔒 Security Event: ${event.type} - ${event.success ? 'SUCCESS' : 'FAILED'} - Severity: ${severity}`);
    
    // ✅ NOVO: Alertar sobre eventos críticos
    if (severity === 'critical') {
      console.error(`🚨 CRITICAL SECURITY EVENT: ${event.type}`, event);
      await createSecurityAlert(event);
    }
    
    // ✅ NOVO: Verificar atividades suspeitas
    if (event.userId || event.email) {
      const isSuspicious = await checkSuspiciousActivity(event.userId || '', event.type);
      if (isSuspicious) {
        await createSecurityAlert({
          ...event,
          type: 'suspicious_activity'
        });
      }
    }
    
    // Registrar tentativa no rate limiter
    await loginRateLimiter.recordAttempt(`log_${identifier}`, true);
    
  } catch (error) {
    console.error('❌ Erro ao logar evento de segurança:', error);
  }
};

/**
 * ✅ MELHORADO: Determinar severidade padrão baseada no tipo de evento
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
    case 'account_creation':
      return 'medium';
    case 'session_expired':
      return 'low';
    case 'logout':
      return 'low';
    case 'email_verification':
      return 'medium';
    default:
      return 'medium';
  }
};

/**
 * ✅ MELHORADO: Verificar se há atividades suspeitas
 */
export const checkSuspiciousActivity = async (userId: string, eventType: string): Promise<boolean> => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
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
    
    // ✅ NOVO: Verificar múltiplas atualizações de perfil
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
          details: { reason: 'multiple_profile_updates', count: profileUpdates.length },
          severity: 'medium'
        });
        return true;
      }
    }
    
    // ✅ NOVO: Verificar múltiplos resets de senha
    if (eventType === 'password_reset') {
      const { data: passwordResets } = await supabase
        .from('security_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('event_type', 'password_reset')
        .gte('timestamp', oneDayAgo.toISOString());
      
      if (passwordResets && passwordResets.length >= 3) {
        await logSecurityEvent({
          type: 'suspicious_activity',
          userId,
          success: false,
          details: { reason: 'multiple_password_resets', count: passwordResets.length },
          severity: 'high'
        });
        return true;
      }
    }
    
    // ✅ NOVO: Verificar logins de locais diferentes
    if (eventType === 'login_attempt') {
      const { data: recentLogins } = await supabase
        .from('security_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('event_type', 'login_attempt')
        .eq('success', true)
        .gte('timestamp', oneDayAgo.toISOString())
        .order('timestamp', { ascending: false })
        .limit(5);
      
      if (recentLogins && recentLogins.length > 1) {
        const locations = recentLogins.map(login => login.location_data?.country).filter(Boolean);
        const uniqueLocations = [...new Set(locations)];
        
        if (uniqueLocations.length > 2) {
          await logSecurityEvent({
            type: 'suspicious_activity',
            userId,
            success: false,
            details: { reason: 'multiple_locations', locations: uniqueLocations },
            severity: 'high'
          });
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('❌ Erro ao verificar atividades suspeitas:', error);
    return false;
  }
};

/**
 * ✅ NOVO: Criar alerta de segurança
 */
export const createSecurityAlert = async (event: SecurityEvent): Promise<void> => {
  try {
    const alert: SecurityAlert = {
      id: generateAlertId(),
      type: getAlertType(event),
      title: getAlertTitle(event),
      message: getAlertMessage(event),
      severity: event.severity || 'medium',
      timestamp: new Date().toISOString(),
      resolved: false,
      userId: event.userId,
      email: event.email
    };
    
    await supabase.from('security_alerts').insert([alert]);
    
    // ✅ NOVO: Notificar usuário se necessário
    if (event.severity === 'high' || event.severity === 'critical') {
      await notifyUserOfSecurityAlert(event.userId || '', alert);
    }
    
  } catch (error) {
    console.error('❌ Erro ao criar alerta de segurança:', error);
  }
};

/**
 * ✅ NOVO: Funções auxiliares para alertas
 */
const getAlertType = (event: SecurityEvent): SecurityAlert['type'] => {
  switch (event.type) {
    case 'login_attempt':
      return 'suspicious_login';
    case 'rate_limit_exceeded':
      return 'rate_limit';
    case 'suspicious_activity':
      return 'unusual_activity';
    default:
      return 'unusual_activity';
  }
};

const getAlertTitle = (event: SecurityEvent): string => {
  switch (event.type) {
    case 'login_attempt':
      return 'Tentativa de Login Suspeita';
    case 'rate_limit_exceeded':
      return 'Muitas Tentativas de Acesso';
    case 'suspicious_activity':
      return 'Atividade Suspeita Detectada';
    default:
      return 'Alerta de Segurança';
  }
};

const getAlertMessage = (event: SecurityEvent): string => {
  switch (event.type) {
    case 'login_attempt':
      return 'Detectamos uma tentativa de login suspeita na sua conta. Verifique se foi você.';
    case 'rate_limit_exceeded':
      return 'Muitas tentativas de acesso foram detectadas. Sua conta foi temporariamente protegida.';
    case 'suspicious_activity':
      return 'Atividade suspeita foi detectada na sua conta. Recomendamos verificar suas configurações de segurança.';
    default:
      return 'Uma atividade suspeita foi detectada na sua conta.';
  }
};

/**
 * ✅ NOVO: Notificar usuário sobre alerta de segurança
 */
const notifyUserOfSecurityAlert = async (userId: string, alert: SecurityAlert): Promise<void> => {
  try {
    // Aqui você pode implementar notificação push, email, etc.
    console.log(`🔔 Notificando usuário ${userId} sobre alerta: ${alert.title}`);
    
    // Exemplo: Enviar notificação push
    // await sendPushNotification(userId, alert.title, alert.message);
    
  } catch (error) {
    console.error('❌ Erro ao notificar usuário:', error);
  }
};

/**
 * ✅ NOVO: Funções auxiliares
 */
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const generateAlertId = (): string => {
  return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const getDeviceInfo = async (): Promise<any> => {
  try {
    // Em React Native, você pode usar expo-device
    return {
      platform: 'react-native',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return { platform: 'unknown' };
  }
};

const getNetworkInfo = async (): Promise<any> => {
  try {
    // Em React Native, você pode usar expo-network
    return {
      type: 'unknown',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return { type: 'unknown' };
  }
};

/**
 * ✅ MELHORADO: Log de tentativa de login com rate limiting
 */
export const logLoginAttempt = async (email: string, success: boolean, details?: any): Promise<void> => {
  try {
    // Verificar rate limiting
    const rateLimitResult = await loginRateLimiter.checkRateLimit(email);
    
    if (!rateLimitResult.allowed) {
      await logSecurityEvent({
        type: 'rate_limit_exceeded',
        email,
        success: false,
        details: { reason: 'login_rate_limit', blockedUntil: rateLimitResult.blockedUntil },
        severity: 'critical'
      });
      return;
    }
    
    await logSecurityEvent({
      type: 'login_attempt',
      email,
      success,
      details,
      severity: success ? 'low' : 'medium'
    });
    
    // Registrar tentativa no rate limiter
    await loginRateLimiter.recordAttempt(email, success);
    
  } catch (error) {
    console.error('❌ Erro ao logar tentativa de login:', error);
  }
};

/**
 * ✅ MELHORADO: Log de reset de senha
 */
export const logPasswordReset = async (email: string, success: boolean, details?: any): Promise<void> => {
  try {
    // Verificar rate limiting para reset de senha
    const rateLimitResult = await passwordResetRateLimiter.checkRateLimit(email);
    
    if (!rateLimitResult.allowed) {
      await logSecurityEvent({
        type: 'rate_limit_exceeded',
        email,
        success: false,
        details: { reason: 'password_reset_rate_limit', blockedUntil: rateLimitResult.blockedUntil },
        severity: 'critical'
      });
      return;
    }
    
    await logSecurityEvent({
      type: 'password_reset',
      email,
      success,
      details,
      severity: 'high'
    });
    
    // Registrar tentativa no rate limiter
    await passwordResetRateLimiter.recordAttempt(email, success);
    
  } catch (error) {
    console.error('❌ Erro ao logar reset de senha:', error);
  }
};

/**
 * ✅ MELHORADO: Log de atualização de perfil
 */
export const logProfileUpdate = async (userId: string, success: boolean, details?: any): Promise<void> => {
  try {
    await logSecurityEvent({
      type: 'profile_update',
      userId,
      success,
      details,
      severity: 'low'
    });
  } catch (error) {
    console.error('❌ Erro ao logar atualização de perfil:', error);
  }
};

/**
 * ✅ NOVO: Log de criação de conta
 */
export const logAccountCreation = async (email: string, success: boolean, details?: any): Promise<void> => {
  try {
    // Verificar rate limiting para criação de conta
    const rateLimitResult = await signupRateLimiter.checkRateLimit(email);
    
    if (!rateLimitResult.allowed) {
      await logSecurityEvent({
        type: 'rate_limit_exceeded',
        email,
        success: false,
        details: { reason: 'signup_rate_limit', blockedUntil: rateLimitResult.blockedUntil },
        severity: 'critical'
      });
      return;
    }
    
    await logSecurityEvent({
      type: 'account_creation',
      email,
      success,
      details,
      severity: 'medium'
    });
    
    // Registrar tentativa no rate limiter
    await signupRateLimiter.recordAttempt(email, success);
    
  } catch (error) {
    console.error('❌ Erro ao logar criação de conta:', error);
  }
};

/**
 * ✅ NOVO: Log de logout
 */
export const logLogout = async (userId: string, details?: any): Promise<void> => {
  try {
    await logSecurityEvent({
      type: 'logout',
      userId,
      success: true,
      details,
      severity: 'low'
    });
  } catch (error) {
    console.error('❌ Erro ao logar logout:', error);
  }
};

/**
 * ✅ NOVO: Log de verificação de email
 */
export const logEmailVerification = async (email: string, success: boolean, details?: any): Promise<void> => {
  try {
    await logSecurityEvent({
      type: 'email_verification',
      email,
      success,
      details,
      severity: 'medium'
    });
  } catch (error) {
    console.error('❌ Erro ao logar verificação de email:', error);
  }
};

/**
 * ✅ NOVO: Obter estatísticas de segurança
 */
export const getSecurityStats = async (userId: string, days: number = 30): Promise<{
  totalEvents: number;
  failedLogins: number;
  suspiciousActivities: number;
  alerts: number;
  lastLogin?: string;
}> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { data: events } = await supabase
      .from('security_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', startDate.toISOString());
    
    const { data: alerts } = await supabase
      .from('security_alerts')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', startDate.toISOString());
    
    const failedLogins = events?.filter(e => e.event_type === 'login_attempt' && !e.success).length || 0;
    const suspiciousActivities = events?.filter(e => e.event_type === 'suspicious_activity').length || 0;
    const lastLogin = events?.filter(e => e.event_type === 'login_attempt' && e.success)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]?.timestamp;
    
    return {
      totalEvents: events?.length || 0,
      failedLogins,
      suspiciousActivities,
      alerts: alerts?.length || 0,
      lastLogin
    };
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas de segurança:', error);
    return {
      totalEvents: 0,
      failedLogins: 0,
      suspiciousActivities: 0,
      alerts: 0
    };
  }
};
