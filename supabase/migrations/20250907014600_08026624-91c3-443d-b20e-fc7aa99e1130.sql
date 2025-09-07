-- Adicionar todos os itens faltantes das entregas do motoboy

-- Itens para jeonginfoxiny0001 (2 entregas de 07/09)
INSERT INTO inventory (user_id, item_id, quantity, sent_by_username, received_at, created_at, updated_at)
SELECT 
  '76b825b8-358e-4896-a9ff-330aba0412a2' as user_id,
  'anel_suspiro' as item_id,
  2 as quantity,
  'motoboy' as sent_by_username,
  '2025-09-07 00:02:26+00' as received_at,
  now() as created_at,
  now() as updated_at
ON CONFLICT DO NOTHING;

-- Itens para william0410 (10 itens não recebidos)
INSERT INTO inventory (user_id, item_id, quantity, sent_by_username, received_at, created_at, updated_at)
VALUES 
  ('a57c7dcb-cf1d-431a-81f2-5e4eaede2de0', 'luar_mel', 1, 'motoboy', '2025-09-06 17:29:58+00', now(), now()),
  ('a57c7dcb-cf1d-431a-81f2-5e4eaede2de0', 'frutas_arco_iris', 1, 'motoboy', '2025-09-06 17:29:58+00', now(), now()),
  ('a57c7dcb-cf1d-431a-81f2-5e4eaede2de0', 'aurora_acucarada', 1, 'motoboy', '2025-09-06 17:29:58+00', now(), now()),
  ('a57c7dcb-cf1d-431a-81f2-5e4eaede2de0', 'estrela_chocolate', 1, 'motoboy', '2025-09-06 17:29:58+00', now(), now()),
  ('a57c7dcb-cf1d-431a-81f2-5e4eaede2de0', 'canela_sonhos', 1, 'motoboy', '2025-09-06 17:29:58+00', now(), now()),
  ('a57c7dcb-cf1d-431a-81f2-5e4eaede2de0', 'tentacao_morango', 1, 'motoboy', '2025-09-06 17:29:58+00', now(), now()),
  ('a57c7dcb-cf1d-431a-81f2-5e4eaede2de0', 'chama_dragonica', 1, 'motoboy', '2025-09-06 17:29:58+00', now(), now()),
  ('a57c7dcb-cf1d-431a-81f2-5e4eaede2de0', 'vento_colinas', 1, 'motoboy', '2025-09-06 17:29:58+00', now(), now()),
  ('a57c7dcb-cf1d-431a-81f2-5e4eaede2de0', 'nevoa_noite', 1, 'motoboy', '2025-09-06 17:29:58+00', now(), now()),
  ('a57c7dcb-cf1d-431a-81f2-5e4eaede2de0', 'quatro_queijos_corte', 1, 'motoboy', '2025-09-06 17:29:58+00', now(), now())
ON CONFLICT DO NOTHING;

-- Itens para Hee1432 (2 entregas diferentes)
INSERT INTO inventory (user_id, item_id, quantity, sent_by_username, received_at, created_at, updated_at)
VALUES 
  ('b6fbf45a-258a-43f5-985d-aebfac3b7e1e', 'roulette_medicine1', 1, 'motoboy', '2025-09-06 16:49:50+00', now(), now()),
  ('b6fbf45a-258a-43f5-985d-aebfac3b7e1e', 'soju_espirito_brando', 1, 'motoboy', '2025-09-06 12:50:56+00', now(), now()),
  ('b6fbf45a-258a-43f5-985d-aebfac3b7e1e', 'refresco_pessego', 1, 'motoboy', '2025-09-06 12:50:56+00', now(), now())
ON CONFLICT DO NOTHING;

-- Itens para hojo2601 (múltiplas entregas de Elixir dos Desejos)
INSERT INTO inventory (user_id, item_id, quantity, sent_by_username, received_at, created_at, updated_at)
VALUES 
  ('7c9639ac-82c3-4740-babc-7dd7b7803d85', 'elixir_desejos', 5, 'motoboy', '2025-09-06 12:53:30+00', now(), now())
ON CONFLICT DO NOTHING;