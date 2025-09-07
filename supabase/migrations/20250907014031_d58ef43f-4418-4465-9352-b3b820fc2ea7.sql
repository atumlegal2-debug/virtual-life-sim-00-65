-- Adicionar itens faltantes das entregas do motoboy

-- Itens para Huang2609 (entrega de 07/09 00:18)
INSERT INTO inventory (user_id, item_id, quantity, sent_by_username, received_at, created_at, updated_at)
VALUES 
  ('fb925c0a-5f7a-458c-aa04-5a5b0ecf38ba', 'paezinhos_ar', 1, 'motoboy', '2025-09-07 00:18:37+00', now(), now()),
  ('fb925c0a-5f7a-458c-aa04-5a5b0ecf38ba', 'picles_cintilantes', 1, 'motoboy', '2025-09-07 00:18:37+00', now(), now()),
  ('fb925c0a-5f7a-458c-aa04-5a5b0ecf38ba', 'cha_flor_lunar', 1, 'motoboy', '2025-09-07 00:18:37+00', now(), now()),
  ('fb925c0a-5f7a-458c-aa04-5a5b0ecf38ba', 'bibimbap', 1, 'motoboy', '2025-09-07 00:18:37+00', now(), now())
ON CONFLICT DO NOTHING;

-- Itens para bbh1992 (entrega de 07/09 00:02)
INSERT INTO inventory (user_id, item_id, quantity, sent_by_username, received_at, created_at, updated_at)
VALUES 
  ('e42a7102-4826-4148-b04b-b6a4c47c6d50', 'ovos_roc', 2, 'motoboy', '2025-09-07 00:02:38+00', now(), now())
ON CONFLICT DO NOTHING;