-- Script completo para corrigir a tabela mesociclos
-- Verificar se a tabela existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'mesociclos' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'Tabela mesociclos não existe';
    END IF;
END $$;

-- Adicionar coluna mesociclo_type se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mesociclos' 
        AND table_schema = 'public' 
        AND column_name = 'mesociclo_type'
    ) THEN
        ALTER TABLE public.mesociclos ADD COLUMN mesociclo_type TEXT;
        
        -- Adicionar constraint de validação
        ALTER TABLE public.mesociclos ADD CONSTRAINT mesociclo_type_check 
        CHECK (mesociclo_type IN (
            'base', 
            'desenvolvimento', 
            'estabilizador', 
            'especifico', 
            'pre_competitivo', 
            'polimento', 
            'competitivo', 
            'transicao', 
            'recuperativo'
        ));
        
        RAISE NOTICE 'Coluna mesociclo_type adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna mesociclo_type já existe';
    END IF;
END $$;

-- Verificar estrutura final da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'mesociclos' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar se a coluna foi criada corretamente (consulta corrigida)
SELECT 
    ccu.column_name,
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'mesociclos' 
AND tc.table_schema = 'public'
AND ccu.column_name = 'mesociclo_type';
