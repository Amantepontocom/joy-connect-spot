-- Remover política permissiva e criar uma mais segura
DROP POLICY IF EXISTS "Anyone can update live viewer and meta stats" ON public.lives;

-- Política que permite apenas usuários autenticados atualizarem stats de lives
CREATE POLICY "Authenticated users can update live stats"
  ON public.lives
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);