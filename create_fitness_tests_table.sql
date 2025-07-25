-- SQL para criar a tabela fitness_tests se não existir
-- Execute este SQL no Supabase SQL Editor

-- Criar a tabela fitness_tests
CREATE TABLE IF NOT EXISTS public.fitness_tests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    protocol_name TEXT NOT NULL,
    test_date DATE NOT NULL,
    distance_meters INTEGER,
    time_seconds INTEGER,
    final_heart_rate INTEGER,
    calculated_vo2max DECIMAL(5,2) NOT NULL,
    calculated_vam DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_fitness_tests_user_id ON public.fitness_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_fitness_tests_test_date ON public.fitness_tests(test_date);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.fitness_tests ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança
-- Política para SELECT: usuários podem ver apenas seus próprios testes
CREATE POLICY "Users can view own fitness tests" ON public.fitness_tests
    FOR SELECT USING (auth.uid() = user_id);

-- Política para INSERT: usuários podem inserir seus próprios testes
CREATE POLICY "Users can insert own fitness tests" ON public.fitness_tests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE: usuários podem atualizar seus próprios testes
CREATE POLICY "Users can update own fitness tests" ON public.fitness_tests
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para DELETE: usuários podem deletar seus próprios testes
CREATE POLICY "Users can delete own fitness tests" ON public.fitness_tests
    FOR DELETE USING (auth.uid() = user_id);

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_fitness_tests_updated_at 
    BEFORE UPDATE ON public.fitness_tests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
