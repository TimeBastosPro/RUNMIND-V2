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

export interface PasswordStrength {
  score: number; // 0-4
  label: 'Muito Fraca' | 'Fraca' | 'Média' | 'Forte' | 'Muito Forte';
  color: 'red' | 'orange' | 'yellow' | 'lightgreen' | 'green';
  requirements: {
    length: boolean;
    lowercase: boolean;
    uppercase: boolean;
    number: boolean;
    special: boolean;
  };
}

/**
 * Validação robusta de senha com indicador de força
 */
export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // ✅ FORTALECIDO: Comprimento mínimo aumentado para 8 caracteres
  if (password.length < 8) {
    errors.push('Senha deve ter pelo menos 8 caracteres');
  }

  // ✅ FORTALECIDO: Comprimento recomendado aumentado para 12 caracteres
  if (password.length < 12) {
    warnings.push('Para maior segurança, use pelo menos 12 caracteres');
  }

  // ✅ FORTALECIDO: Letra minúscula (obrigatória)
  if (!/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula');
  }

  // ✅ FORTALECIDO: Letra maiúscula (obrigatória)
  if (!/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula');
  }

  // ✅ FORTALECIDO: Número (obrigatório)
  if (!/\d/.test(password)) {
    errors.push('Senha deve conter pelo menos um número');
  }

  // ✅ FORTALECIDO: Caractere especial (obrigatório)
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=;:'"`~[\]\\/]/.test(password)) {
    errors.push('Senha deve conter pelo menos um caractere especial');
  }

  // ✅ FORTALECIDO: Verificar senhas comuns
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    errors.push('Esta senha é muito comum. Escolha uma senha mais única');
  }

  // ✅ FORTALECIDO: Verificar padrões simples
  if (/(.)\1{2,}/.test(password)) {
    warnings.push('Evite repetir o mesmo caractere várias vezes');
  }

  // ✅ FORTALECIDO: Verificar sequências
  if (/123|abc|qwe|asd|zxc/i.test(password)) {
    warnings.push('Evite sequências simples de teclado');
  }

  // ✅ NOVO: Verificar informações pessoais comuns
  const commonPatterns = ['password', 'senha', 'user', 'admin', 'login'];
  if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
    warnings.push('Evite usar palavras relacionadas a login/senha');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  };
};

/**
 * ✅ NOVO: Calcula a força da senha
 */
export const calculatePasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  const requirements = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>_\-+=;:'"`~[\]\\/]/.test(password)
  };

  // Pontuação baseada em requisitos atendidos
  if (requirements.length) score++;
  if (requirements.lowercase) score++;
  if (requirements.uppercase) score++;
  if (requirements.number) score++;
  if (requirements.special) score++;

  // Bônus por comprimento
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;

  // Penalidade por padrões fracos
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) score = Math.max(0, score - 2);
  if (/(.)\1{2,}/.test(password)) score = Math.max(0, score - 1);
  if (/123|abc|qwe|asd|zxc/i.test(password)) score = Math.max(0, score - 1);

  // Limitar score máximo
  score = Math.min(4, score);

  const strengthMap: Record<number, { label: PasswordStrength['label']; color: PasswordStrength['color'] }> = {
    0: { label: 'Muito Fraca', color: 'red' },
    1: { label: 'Fraca', color: 'orange' },
    2: { label: 'Média', color: 'yellow' },
    3: { label: 'Forte', color: 'lightgreen' },
    4: { label: 'Muito Forte', color: 'green' }
  };

  return {
    score,
    ...strengthMap[score],
    requirements
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

  // Verificar domínios temporários/descartáveis
  const disposableDomains = [
    '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
    'mailinator.com', 'yopmail.com', 'throwaway.email'
  ];
  
  if (domain && disposableDomains.some(d => domain.includes(d))) {
    errors.push('Não aceitamos emails temporários ou descartáveis');
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
  const warnings: string[] = [];

  // Verificar comprimento mínimo
  if (name.trim().length < 2) {
    errors.push('Nome deve ter pelo menos 2 caracteres');
  }

  // Verificar comprimento máximo
  if (name.length > 100) {
    errors.push('Nome muito longo');
  }

  // Verificar se contém apenas letras, espaços e caracteres especiais comuns
  const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
  if (!nameRegex.test(name)) {
    errors.push('Nome deve conter apenas letras, espaços, hífens e apóstrofos');
  }

  // Verificar se tem pelo menos nome e sobrenome
  const nameParts = name.trim().split(/\s+/);
  if (nameParts.length < 2) {
    warnings.push('Recomendamos incluir nome e sobrenome');
  }

  // Verificar caracteres repetidos
  if (/(.)\1{3,}/.test(name)) {
    warnings.push('Nome contém muitos caracteres repetidos');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  };
};

/**
 * Sanitização de entrada
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/\s+/g, ' ') // Múltiplos espaços para um
    .replace(/[<>]/g, '') // Remover caracteres potencialmente perigosos
    .substring(0, 100); // Limitar comprimento
};

/**
 * ✅ NOVO: Validação de telefone
 */
export const validatePhone = (phone: string): ValidationResult => {
  const errors: string[] = [];
  
  // Remover caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Verificar se tem pelo menos 10 dígitos (Brasil)
  if (cleanPhone.length < 10) {
    errors.push('Telefone deve ter pelo menos 10 dígitos');
  }
  
  // Verificar se não tem mais de 15 dígitos
  if (cleanPhone.length > 15) {
    errors.push('Telefone muito longo');
  }
  
  // Verificar se não é uma sequência de números iguais
  if (/^(\d)\1{9,}$/.test(cleanPhone)) {
    errors.push('Telefone não pode ser uma sequência de números iguais');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * ✅ NOVO: Validação de data de nascimento
 */
export const validateDateOfBirth = (date: string): ValidationResult => {
  const errors: string[] = [];
  
  const birthDate = new Date(date);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  
  // Verificar se é uma data válida
  if (isNaN(birthDate.getTime())) {
    errors.push('Data de nascimento inválida');
  }
  
  // Verificar se não é no futuro
  if (birthDate > today) {
    errors.push('Data de nascimento não pode ser no futuro');
  }
  
  // Verificar idade mínima (13 anos)
  if (age < 13) {
    errors.push('Você deve ter pelo menos 13 anos');
  }
  
  // Verificar idade máxima (120 anos)
  if (age > 120) {
    errors.push('Data de nascimento inválida');
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
