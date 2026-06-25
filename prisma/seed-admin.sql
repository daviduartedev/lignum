-- Admin de desenvolvimento/validação (opcional; o seed Prisma também cria este utilizador).
-- Senha: Teste@123456 (bcrypt cost 12)

INSERT INTO users (
  email,
  password_hash,
  name,
  role,
  lgpd_consent_version,
  lgpd_consent_at,
  created_at,
  updated_at
)
VALUES (
  'admin@lignum.local',
  '$2a$12$n0/GAOexdwgbaNv5cDAlh.HyIlSGY3vtjTjDNZGysmD9LnifYcCm6',
  'Administrador Lignum',
  'admin',
  '1.0',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  lgpd_consent_version = EXCLUDED.lgpd_consent_version,
  lgpd_consent_at = EXCLUDED.lgpd_consent_at,
  updated_at = NOW();
