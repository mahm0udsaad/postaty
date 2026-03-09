alter table if exists ai_usage_events
  add column if not exists generation_id text,
  add column if not exists generation_type text,
  add column if not exists provider text,
  add column if not exists provider_model_id text,
  add column if not exists pricing_version_id uuid,
  add column if not exists input_cost_usd numeric(12, 6) not null default 0,
  add column if not exists output_cost_usd numeric(12, 6) not null default 0,
  add column if not exists image_cost_usd numeric(12, 6) not null default 0,
  add column if not exists gateway_cost_usd numeric(12, 6) not null default 0,
  add column if not exists total_cost_usd numeric(12, 6) not null default 0,
  add column if not exists cost_mode text not null default 'legacy';

create index if not exists ai_usage_events_cost_mode_created_at_idx
  on ai_usage_events (cost_mode, created_at desc);

create index if not exists ai_usage_events_generation_idx
  on ai_usage_events (generation_type, generation_id);

alter table if exists ai_pricing_config
  add column if not exists provider text,
  add column if not exists provider_model_id text,
  add column if not exists effective_from bigint,
  add column if not exists effective_to bigint,
  add column if not exists input_cost_per_1m_usd numeric(12, 6),
  add column if not exists output_cost_per_1m_usd numeric(12, 6),
  add column if not exists output_pricing_mode text not null default 'token',
  add column if not exists image_cost_per_unit_usd numeric(12, 6),
  add column if not exists gateway_cost_per_1m_input_usd numeric(12, 6) not null default 0,
  add column if not exists gateway_cost_per_1m_output_usd numeric(12, 6) not null default 0,
  add column if not exists gateway_cost_per_image_usd numeric(12, 6) not null default 0;

create index if not exists ai_pricing_config_lookup_idx
  on ai_pricing_config (provider, provider_model_id, effective_from desc);

insert into ai_pricing_config (
  provider,
  provider_model_id,
  model,
  effective_from,
  input_cost_per_1m_usd,
  output_pricing_mode,
  image_cost_per_unit_usd
)
values
  ('google_direct', 'gemini-2.5-flash-image', 'gemini-2.5-flash-image', 1741478400000, 0.30, 'image', 0.039000),
  ('google_direct', 'gemini-3-pro-image-preview', 'gemini-3-pro-image-preview', 1741478400000, 2.00, 'image', 0.134000),
  ('vercel_gateway', 'google/gemini-2.5-flash-image', 'gemini-2.5-flash-image (gateway)', 1741478400000, 0.30, 'image', 0.039000),
  ('vercel_gateway', 'google/gemini-3-pro-image-preview', 'gemini-3-pro-image-preview (gateway)', 1741478400000, 2.00, 'image', 0.134000)
on conflict do nothing;
