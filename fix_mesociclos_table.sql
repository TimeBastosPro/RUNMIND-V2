-- Adicionar coluna mesociclo_type que está faltando na tabela mesociclos
ALTER TABLE public.mesociclos 
ADD COLUMN IF NOT EXISTS mesociclo_type TEXT CHECK (
  mesociclo_type IN (
    'base', 
    'desenvolvimento', 
    'estabilizador', 
    'especifico', 
    'pre_competitivo', 
    'polimento', 
    'competitivo', 
    'transicao', 
    'recuperativo'
  )
);

-- Verificar se a coluna foi adicionada corretamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'mesociclos' 
AND table_schema = 'public'
AND column_name = 'mesociclo_type';

-- Verificar estrutura completa da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'mesociclos' 
AND table_schema = 'public'
ORDER BY ordinal_position;
