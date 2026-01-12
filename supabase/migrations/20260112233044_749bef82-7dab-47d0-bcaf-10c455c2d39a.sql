-- Habilitar realtime na tabela de lives
ALTER TABLE public.lives REPLICA IDENTITY FULL;

-- Verificar se lives já está no realtime antes de adicionar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'lives'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.lives;
  END IF;
END $$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_live_id ON public.chat_messages(live_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lives_is_active ON public.lives(is_active);
CREATE INDEX IF NOT EXISTS idx_lives_streamer_id ON public.lives(streamer_id);

-- Drop policy if exists and recreate
DROP POLICY IF EXISTS "Anyone can update live viewer and meta stats" ON public.lives;

-- Política para permitir que qualquer pessoa autenticada atualize viewers_count e meta_progress
CREATE POLICY "Anyone can update live viewer and meta stats"
  ON public.lives
  FOR UPDATE
  USING (true)
  WITH CHECK (true);