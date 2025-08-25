// src/services/passwordRecovery.ts

import { supabase } from './supabase';
import { passwordResetRateLimiter } from './rateLimiter';
import { logPasswordReset, logSecurityEvent } from './securityLogger';
import { validateEmail } from '../utils/validation';

export interface PasswordRecoveryRequest {
  email: string;
  requestId: string;
  expiresAt: string;
  verified: boolean;
  attempts: number;
}

export interface PasswordRecoveryStep {
  step: 'request' | 'verify' | 'reset' | 'complete';
  message: string;
  canProceed: boolean;
}

/**
 * ✅ NOVO: Sistema robusto de recuperação de senha
 */
export class PasswordRecoveryService {
  private static instance: PasswordRecoveryService;
  private requests: Map<string, PasswordRecoveryRequest> = new Map();

  static getInstance(): PasswordRecoveryService {
    if (!PasswordRecoveryService.instance) {
      PasswordRecoveryService.instance = new PasswordRecoveryService();
    }
    return PasswordRecoveryService.instance;
  }

  /**
   * Solicitar reset de senha
   */
  async requestPasswordReset(email: string): Promise<{
    success: boolean;
    message: string;
    requestId?: string;
    step: PasswordRecoveryStep;
  }> {
    try {
      // ✅ VALIDAÇÃO: Verificar email
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        return {
          success: false,
          message: emailValidation.errors[0],
          step: { step: 'request', message: 'Email inválido', canProceed: false }
        };
      }

      const sanitizedEmail = email.toLowerCase().trim();

      // ✅ RATE LIMITING: Verificar se não excedeu o limite
      const rateLimitResult = await passwordResetRateLimiter.checkRateLimit(sanitizedEmail);
      if (!rateLimitResult.allowed) {
        const remainingTime = Math.ceil((rateLimitResult.blockedUntil! - Date.now()) / (1000 * 60));
        return {
          success: false,
          message: `Muitas tentativas de reset. Tente novamente em ${remainingTime} minutos.`,
          step: { step: 'request', message: 'Rate limit excedido', canProceed: false }
        };
      }

      // ✅ VERIFICAÇÃO: Verificar se o email existe
      const { data: user } = await supabase.auth.admin.getUserByEmail(sanitizedEmail);
      if (!user) {
        // Não revelar se o email existe ou não por segurança
        await passwordResetRateLimiter.recordAttempt(sanitizedEmail, false);
        return {
          success: true,
          message: 'Se o email estiver cadastrado, você receberá um link de recuperação.',
          step: { step: 'request', message: 'Email enviado (se existir)', canProceed: false }
        };
      }

      // ✅ GERAÇÃO: Criar request de recuperação
      const requestId = this.generateRequestId();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

      const recoveryRequest: PasswordRecoveryRequest = {
        email: sanitizedEmail,
        requestId,
        expiresAt: expiresAt.toISOString(),
        verified: false,
        attempts: 0
      };

      this.requests.set(requestId, recoveryRequest);

      // ✅ ENVIO: Enviar email de recuperação
      const { error: emailError } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
        redirectTo: `${process.env.EXPO_PUBLIC_APP_URL}/reset-password?requestId=${requestId}`
      });

      if (emailError) {
        console.error('❌ Erro ao enviar email de recuperação:', emailError);
        await passwordResetRateLimiter.recordAttempt(sanitizedEmail, false);
        return {
          success: false,
          message: 'Erro ao enviar email de recuperação. Tente novamente.',
          step: { step: 'request', message: 'Erro no envio', canProceed: false }
        };
      }

      // ✅ LOG: Registrar tentativa bem-sucedida
      await logPasswordReset(sanitizedEmail, true, { requestId, method: 'email' });
      await passwordResetRateLimiter.recordAttempt(sanitizedEmail, true);

      return {
        success: true,
        message: 'Email de recuperação enviado! Verifique sua caixa de entrada.',
        requestId,
        step: { step: 'verify', message: 'Aguardando verificação', canProceed: true }
      };

    } catch (error) {
      console.error('❌ Erro na solicitação de reset:', error);
      return {
        success: false,
        message: 'Erro interno. Tente novamente.',
        step: { step: 'request', message: 'Erro interno', canProceed: false }
      };
    }
  }

  /**
   * Verificar código de recuperação
   */
  async verifyRecoveryCode(requestId: string, code: string): Promise<{
    success: boolean;
    message: string;
    step: PasswordRecoveryStep;
  }> {
    try {
      const request = this.requests.get(requestId);
      if (!request) {
        return {
          success: false,
          message: 'Solicitação de recuperação inválida ou expirada.',
          step: { step: 'verify', message: 'Request inválido', canProceed: false }
        };
      }

      // ✅ EXPIRAÇÃO: Verificar se não expirou
      if (new Date() > new Date(request.expiresAt)) {
        this.requests.delete(requestId);
        return {
          success: false,
          message: 'Código de recuperação expirado. Solicite um novo.',
          step: { step: 'verify', message: 'Código expirado', canProceed: false }
        };
      }

      // ✅ TENTATIVAS: Verificar número de tentativas
      if (request.attempts >= 3) {
        this.requests.delete(requestId);
        return {
          success: false,
          message: 'Muitas tentativas inválidas. Solicite um novo código.',
          step: { step: 'verify', message: 'Muitas tentativas', canProceed: false }
        };
      }

      // ✅ VERIFICAÇÃO: Verificar código (simulado - em produção seria mais robusto)
      const isValidCode = this.verifyCode(code, request.email);
      
      request.attempts++;

      if (!isValidCode) {
        this.requests.set(requestId, request);
        return {
          success: false,
          message: 'Código inválido. Tente novamente.',
          step: { step: 'verify', message: 'Código inválido', canProceed: false }
        };
      }

      // ✅ SUCESSO: Marcar como verificado
      request.verified = true;
      this.requests.set(requestId, request);

      await logSecurityEvent({
        type: 'password_reset',
        email: request.email,
        success: true,
        details: { requestId, step: 'verification' },
        severity: 'high'
      });

      return {
        success: true,
        message: 'Código verificado com sucesso!',
        step: { step: 'reset', message: 'Código válido', canProceed: true }
      };

    } catch (error) {
      console.error('❌ Erro na verificação do código:', error);
      return {
        success: false,
        message: 'Erro interno. Tente novamente.',
        step: { step: 'verify', message: 'Erro interno', canProceed: false }
      };
    }
  }

  /**
   * Resetar senha
   */
  async resetPassword(requestId: string, newPassword: string): Promise<{
    success: boolean;
    message: string;
    step: PasswordRecoveryStep;
  }> {
    try {
      const request = this.requests.get(requestId);
      if (!request || !request.verified) {
        return {
          success: false,
          message: 'Solicitação de recuperação inválida ou não verificada.',
          step: { step: 'reset', message: 'Request inválido', canProceed: false }
        };
      }

      // ✅ EXPIRAÇÃO: Verificar se não expirou
      if (new Date() > new Date(request.expiresAt)) {
        this.requests.delete(requestId);
        return {
          success: false,
          message: 'Solicitação expirada. Solicite um novo reset.',
          step: { step: 'reset', message: 'Request expirado', canProceed: false }
        };
      }

      // ✅ SENHA: Atualizar senha no Supabase
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('❌ Erro ao atualizar senha:', error);
        return {
          success: false,
          message: 'Erro ao atualizar senha. Tente novamente.',
          step: { step: 'reset', message: 'Erro na atualização', canProceed: false }
        };
      }

      // ✅ LIMPEZA: Remover request usado
      this.requests.delete(requestId);

      // ✅ LOG: Registrar sucesso
      await logSecurityEvent({
        type: 'password_reset',
        email: request.email,
        success: true,
        details: { requestId, step: 'password_update' },
        severity: 'high'
      });

      return {
        success: true,
        message: 'Senha atualizada com sucesso! Você pode fazer login agora.',
        step: { step: 'complete', message: 'Senha atualizada', canProceed: false }
      };

    } catch (error) {
      console.error('❌ Erro no reset de senha:', error);
      return {
        success: false,
        message: 'Erro interno. Tente novamente.',
        step: { step: 'reset', message: 'Erro interno', canProceed: false }
      };
    }
  }

  /**
   * Verificar status da solicitação
   */
  getRequestStatus(requestId: string): PasswordRecoveryRequest | null {
    const request = this.requests.get(requestId);
    if (!request) return null;

    // Limpar se expirou
    if (new Date() > new Date(request.expiresAt)) {
      this.requests.delete(requestId);
      return null;
    }

    return request;
  }

  /**
   * Cancelar solicitação
   */
  cancelRequest(requestId: string): boolean {
    const request = this.requests.get(requestId);
    if (request) {
      this.requests.delete(requestId);
      return true;
    }
    return false;
  }

  /**
   * Limpar solicitações expiradas
   */
  cleanupExpiredRequests(): void {
    const now = new Date();
    for (const [requestId, request] of this.requests.entries()) {
      if (now > new Date(request.expiresAt)) {
        this.requests.delete(requestId);
      }
    }
  }

  /**
   * Gerar ID único para request
   */
  private generateRequestId(): string {
    return `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * ✅ SIMULADO: Verificar código (em produção seria mais robusto)
   */
  private verifyCode(code: string, email: string): boolean {
    // Em produção, isso seria verificado contra um código real enviado por email
    // Por enquanto, simulamos com um código baseado no email
    const expectedCode = this.generateExpectedCode(email);
    return code === expectedCode;
  }

  /**
   * ✅ SIMULADO: Gerar código esperado
   */
  private generateExpectedCode(email: string): string {
    // Em produção, isso seria gerado e enviado por email
    // Por enquanto, simulamos com um código baseado no email
    const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (hash % 900000 + 100000).toString(); // Código de 6 dígitos
  }
}

/**
 * Instância global do serviço
 */
export const passwordRecoveryService = PasswordRecoveryService.getInstance();

/**
 * ✅ NOVO: Hook para gerenciar recuperação de senha
 */
export const usePasswordRecovery = () => {
  const [currentStep, setCurrentStep] = React.useState<PasswordRecoveryStep>({
    step: 'request',
    message: 'Solicitar reset de senha',
    canProceed: true
  });
  const [requestId, setRequestId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const requestReset = async (email: string) => {
    setIsLoading(true);
    try {
      const result = await passwordRecoveryService.requestPasswordReset(email);
      setCurrentStep(result.step);
      if (result.requestId) {
        setRequestId(result.requestId);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async (code: string) => {
    if (!requestId) return { success: false, message: 'Request ID não encontrado' };
    
    setIsLoading(true);
    try {
      const result = await passwordRecoveryService.verifyRecoveryCode(requestId, code);
      setCurrentStep(result.step);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (newPassword: string) => {
    if (!requestId) return { success: false, message: 'Request ID não encontrado' };
    
    setIsLoading(true);
    try {
      const result = await passwordRecoveryService.resetPassword(requestId, newPassword);
      setCurrentStep(result.step);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelRecovery = () => {
    if (requestId) {
      passwordRecoveryService.cancelRequest(requestId);
    }
    setRequestId(null);
    setCurrentStep({
      step: 'request',
      message: 'Solicitar reset de senha',
      canProceed: true
    });
  };

  return {
    currentStep,
    requestId,
    isLoading,
    requestReset,
    verifyCode,
    resetPassword,
    cancelRecovery
  };
};
