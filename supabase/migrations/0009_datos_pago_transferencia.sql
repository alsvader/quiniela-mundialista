-- Datos de transferencia para el recordatorio de pago por WhatsApp
-- (change recordatorio-pago-whatsapp, design.md D1). Mismo patrón key/value que
-- whatsapp_number; defaults vacíos para que el botón nazca deshabilitado hasta
-- que el admin capture los datos. Idempotente.
insert into public.app_settings (key, value) values
  ('bank_name', ''),
  ('bank_clabe', ''),
  ('bank_holder', ''),
  ('payment_amount', '')
on conflict (key) do nothing;
