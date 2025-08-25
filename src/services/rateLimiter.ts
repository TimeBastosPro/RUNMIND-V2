// src/services/rateLimiter.ts

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  resetTime: number;
  blockedUntil?: number;
}

export interface AttemptRecord {
  timestamp: number;
  success: boolean;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutos
  blockDurationMs: 30 * 60 * 1000 // 30 minutos
};

const STRICT_CONFIG: RateLimitConfig = {
  maxAttempts: 10,
  windowMs: 60 * 60 * 1000, // 1 hora
  blockDurationMs: 24 * 60 * 60 * 1000 // 24 horas
};

/**
 * Sistema de Rate Limiting para autenticação
 */
export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Verifica se uma tentativa é permitida
   */
  async checkRateLimit(identifier: string): Promise<RateLimitResult> {
    try {
      const key = `rate_limit:${identifier}`;
      const blockKey = `rate_limit_block:${identifier}`;
      
      // Verificar se está bloqueado
      const blockedUntil = await this.getBlockedUntil(blockKey);
      if (blockedUntil && Date.now() < blockedUntil) {
        return {
          allowed: false,
          remainingAttempts: 0,
          resetTime: blockedUntil,
          blockedUntil
        };
      }

      // Limpar bloqueio se expirou
      if (blockedUntil && Date.now() >= blockedUntil) {
        await AsyncStorage.removeItem(blockKey);
      }

      // Obter tentativas recentes
      const attempts = await this.getAttempts(key);
      const now = Date.now();
      const windowStart = now - this.config.windowMs;
      
      // Filtrar tentativas dentro da janela
      const recentAttempts = attempts.filter(attempt => attempt.timestamp >= windowStart);
      
      // Contar tentativas falhadas
      const failedAttempts = recentAttempts.filter(attempt => !attempt.success).length;
      
      const remainingAttempts = Math.max(0, this.config.maxAttempts - failedAttempts);
      const allowed = remainingAttempts > 0;
      
      // Se excedeu o limite, bloquear
      if (!allowed) {
        const blockUntil = now + this.config.blockDurationMs;
        await AsyncStorage.setItem(blockKey, blockUntil.toString());
        
        return {
          allowed: false,
          remainingAttempts: 0,
          resetTime: blockUntil,
          blockedUntil: blockUntil
        };
      }

      return {
        allowed: true,
        remainingAttempts,
        resetTime: windowStart + this.config.windowMs
      };
    } catch (error) {
      console.error('❌ Erro no rate limiting:', error);
      // Em caso de erro, permitir a tentativa
      return {
        allowed: true,
        remainingAttempts: this.config.maxAttempts,
        resetTime: Date.now() + this.config.windowMs
      };
    }
  }

  /**
   * Registra uma tentativa
   */
  async recordAttempt(identifier: string, success: boolean): Promise<void> {
    try {
      const key = `rate_limit:${identifier}`;
      const attempts = await this.getAttempts(key);
      
      // Adicionar nova tentativa
      attempts.push({
        timestamp: Date.now(),
        success
      });
      
      // Manter apenas as últimas 50 tentativas
      if (attempts.length > 50) {
        attempts.splice(0, attempts.length - 50);
      }
      
      await AsyncStorage.setItem(key, JSON.stringify(attempts));
    } catch (error) {
      console.error('❌ Erro ao registrar tentativa:', error);
    }
  }

  /**
   * Reseta o rate limit para um identificador
   */
  async resetRateLimit(identifier: string): Promise<void> {
    try {
      const key = `rate_limit:${identifier}`;
      const blockKey = `rate_limit_block:${identifier}`;
      
      await AsyncStorage.multiRemove([key, blockKey]);
    } catch (error) {
      console.error('❌ Erro ao resetar rate limit:', error);
    }
  }

  /**
   * Obtém tentativas armazenadas
   */
  private async getAttempts(key: string): Promise<AttemptRecord[]> {
    try {
      const stored = await AsyncStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Erro ao obter tentativas:', error);
      return [];
    }
  }

  /**
   * Obtém tempo de bloqueio
   */
  private async getBlockedUntil(key: string): Promise<number | null> {
    try {
      const stored = await AsyncStorage.getItem(key);
      return stored ? parseInt(stored, 10) : null;
    } catch (error) {
      console.error('❌ Erro ao obter bloqueio:', error);
      return null;
    }
  }

  /**
   * Obtém estatísticas de rate limit
   */
  async getStats(identifier: string): Promise<{
    totalAttempts: number;
    failedAttempts: number;
    successAttempts: number;
    isBlocked: boolean;
    blockedUntil?: number;
    remainingAttempts: number;
  }> {
    try {
      const key = `rate_limit:${identifier}`;
      const blockKey = `rate_limit_block:${identifier}`;
      
      const attempts = await this.getAttempts(key);
      const blockedUntil = await this.getBlockedUntil(blockKey);
      const isBlocked = blockedUntil ? Date.now() < blockedUntil : false;
      
      const now = Date.now();
      const windowStart = now - this.config.windowMs;
      const recentAttempts = attempts.filter(attempt => attempt.timestamp >= windowStart);
      
      const failedAttempts = recentAttempts.filter(attempt => !attempt.success).length;
      const successAttempts = recentAttempts.filter(attempt => attempt.success).length;
      const remainingAttempts = Math.max(0, this.config.maxAttempts - failedAttempts);
      
      return {
        totalAttempts: attempts.length,
        failedAttempts,
        successAttempts,
        isBlocked,
        blockedUntil: isBlocked ? blockedUntil : undefined,
        remainingAttempts
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      return {
        totalAttempts: 0,
        failedAttempts: 0,
        successAttempts: 0,
        isBlocked: false,
        remainingAttempts: this.config.maxAttempts
      };
    }
  }
}

/**
 * Instâncias pré-configuradas
 */
export const loginRateLimiter = new RateLimiter(DEFAULT_CONFIG);
export const signupRateLimiter = new RateLimiter(STRICT_CONFIG);
export const passwordResetRateLimiter = new RateLimiter({
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000, // 1 hora
  blockDurationMs: 24 * 60 * 60 * 1000 // 24 horas
});

/**
 * ✅ NOVO: Rate limiter para IP (simulado para mobile)
 */
export class IPRateLimiter {
  private static instance: IPRateLimiter;
  private attempts: Map<string, AttemptRecord[]> = new Map();
  private blocks: Map<string, number> = new Map();

  static getInstance(): IPRateLimiter {
    if (!IPRateLimiter.instance) {
      IPRateLimiter.instance = new IPRateLimiter();
    }
    return IPRateLimiter.instance;
  }

  async checkRateLimit(ip: string, config: RateLimitConfig = DEFAULT_CONFIG): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // Verificar bloqueio
    const blockedUntil = this.blocks.get(ip);
    if (blockedUntil && now < blockedUntil) {
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: blockedUntil,
        blockedUntil
      };
    }

    // Limpar bloqueio expirado
    if (blockedUntil && now >= blockedUntil) {
      this.blocks.delete(ip);
    }

    // Obter tentativas
    const attempts = this.attempts.get(ip) || [];
    const recentAttempts = attempts.filter(attempt => attempt.timestamp >= windowStart);
    const failedAttempts = recentAttempts.filter(attempt => !attempt.success).length;
    
    const remainingAttempts = Math.max(0, config.maxAttempts - failedAttempts);
    const allowed = remainingAttempts > 0;

    // Aplicar bloqueio se necessário
    if (!allowed) {
      const blockUntil = now + config.blockDurationMs;
      this.blocks.set(ip, blockUntil);
      
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: blockUntil,
        blockedUntil: blockUntil
      };
    }

    return {
      allowed: true,
      remainingAttempts,
      resetTime: windowStart + config.windowMs
    };
  }

  recordAttempt(ip: string, success: boolean): void {
    const attempts = this.attempts.get(ip) || [];
    attempts.push({
      timestamp: Date.now(),
      success
    });
    
    // Limitar histórico
    if (attempts.length > 100) {
      attempts.splice(0, attempts.length - 100);
    }
    
    this.attempts.set(ip, attempts);
  }

  resetRateLimit(ip: string): void {
    this.attempts.delete(ip);
    this.blocks.delete(ip);
  }
}
