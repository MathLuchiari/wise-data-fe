
CREATE POLICY "users read own spreadsheets" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'spreadsheets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "users upload own spreadsheets" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'spreadsheets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "users delete own spreadsheets" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'spreadsheets' AND auth.uid()::text = (storage.foldername(name))[1]);
