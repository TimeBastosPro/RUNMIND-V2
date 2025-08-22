// src/utils/validation.ts

// Lista de senhas comuns para verificação
const COMMON_PASSWORDS = [
  '123456', 'password', '123456789', '12345678', '12345', 'qwerty',
  'abc123', '111111', '123123', 'admin', 'letmein', 'welcome',
  'monkey', 'password123', '1234567890', 'dragon', 'master',
  'hello', 'freedom', 'whatever', 'qazwsx', 'trustno1', 'jordan',
  'harley', 'hunter', 'buster', 'thomas', 'tigger', 'robert',
  'soccer', 'batman', 'test', 'pass', 'killer', 'hockey',
  'george', 'charlie', 'andrew', 'michelle', 'love', 'sunshine',
  'jessica', 'asshole', '696969', 'amanda', 'access', 'yankees',
  '987654321', 'dallas', 'austin', 'thunder', 'taylor', 'matrix',
  'mobilemail', 'mom', 'monitor', 'monitoring', 'montana', 'moon',
  'moscow', 'mother', 'movie', 'mozilla', 'music', 'mustang',
  'password', 'pa$$w0rd', 'p@ssw0rd', 'p@$$w0rd', 'pass123',
  'senha', '123456', '123456789', 'qwerty', 'abc123', '111111'
];

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Validação robusta de senha
 */
export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Verificar comprimento mínimo
  if (password.length < 8) {
    errors.push('Senha deve ter pelo menos 8 caracteres');
  }

  // Verificar comprimento recomendado
  if (password.length < 12) {
    warnings.push('Para maior segurança, use pelo menos 12 caracteres');
  }

  // Verificar letra maiúscula
  if (!/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula');
  }

  // Verificar letra minúscula
  if (!/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula');
  }

  // Verificar número
  if (!/\d/.test(password)) {
    errors.push('Senha deve conter pelo menos um número');
  }

  // Verificar caractere especial
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=;:'"`~[\]\\/]/.test(password)) {
    errors.push('Senha deve conter pelo menos um caractere especial');
  }

  // Verificar senhas comuns
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    errors.push('Esta senha é muito comum. Escolha uma senha mais única');
  }

  // Verificar padrões simples
  if (/(.)\1{2,}/.test(password)) {
    warnings.push('Evite repetir o mesmo caractere várias vezes');
  }

  // Verificar sequências
  if (/123|abc|qwe|asd|zxc/i.test(password)) {
    warnings.push('Evite sequências simples de teclado');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  };
};

/**
 * Validação de email
 */
export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];

  // Verificar formato básico
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('Formato de email inválido');
  }

  // Verificar domínio válido
  const domain = email.split('@')[1];
  if (domain && domain.length < 3) {
    errors.push('Domínio de email inválido');
  }

  // Verificar comprimento
  if (email.length > 254) {
    errors.push('Email muito longo');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validação de nome completo
 */
export const validateFullName = (name: string): ValidationResult => {
  const errors: string[] = [];

  if (!name || name.trim().length < 2) {
    errors.push('Nome deve ter pelo menos 2 caracteres');
  }

  if (name.length > 100) {
    errors.push('Nome muito longo');
  }

  // Verificar caracteres especiais perigosos
  if (/[<>]/.test(name)) {
    errors.push('Nome contém caracteres inválidos');
  }

  // Verificar se tem pelo menos nome e sobrenome
  const nameParts = name.trim().split(/\s+/);
  if (nameParts.length < 2) {
    errors.push('Digite seu nome completo (nome e sobrenome)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sanitização de input
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove caracteres perigosos
    .replace(/\s+/g, ' ') // Normaliza espaços
    .substring(0, 1000); // Limita comprimento
};

/**
 * Validação de idade
 */
export const validateAge = (birthDate: string): ValidationResult => {
  const errors: string[] = [];

  const today = new Date();
  const birth = new Date(birthDate);
  const age = today.getFullYear() - birth.getFullYear();

  if (age < 13) {
    errors.push('Você deve ter pelo menos 13 anos para usar este aplicativo');
  }

  if (age > 120) {
    errors.push('Data de nascimento inválida');
  }

  if (birth > today) {
    errors.push('Data de nascimento não pode ser no futuro');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validação de dados de treino
 */
export const validateTrainingData = (data: any): ValidationResult => {
  const errors: string[] = [];

  // Validar duração
  if (data.duration_minutes && (data.duration_minutes < 1 || data.duration_minutes > 1440)) {
    errors.push('Duração deve estar entre 1 e 1440 minutos');
  }

  // Validar distância
  if (data.distance_km && (data.distance_km < 0 || data.distance_km > 1000)) {
    errors.push('Distância deve estar entre 0 e 1000 km');
  }

  // Validar esforço percebido
  if (data.perceived_effort && (data.perceived_effort < 1 || data.perceived_effort > 10)) {
    errors.push('Esforço percebido deve estar entre 1 e 10');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validação de dados de check-in
 */
export const validateCheckinData = (data: any): ValidationResult => {
  const errors: string[] = [];

  // Validar qualidade do sono
  if (data.sleep_quality && (data.sleep_quality < 1 || data.sleep_quality > 7)) {
    errors.push('Qualidade do sono deve estar entre 1 e 7');
  }

  // Validar dores
  if (data.soreness && (data.soreness < 1 || data.soreness > 7)) {
    errors.push('Nível de dores deve estar entre 1 e 7');
  }

  // Validar motivação
  if (data.motivation && (data.motivation < 1 || data.motivation > 5)) {
    errors.push('Motivação deve estar entre 1 e 5');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
