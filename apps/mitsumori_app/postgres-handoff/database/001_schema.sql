CREATE TABLE IF NOT EXISTS mitsumori_state (
  singleton_id smallint PRIMARY KEY CHECK (singleton_id = 1),
  payload jsonb NOT NULL,
  revision text NOT NULL,
  source_name text NOT NULL DEFAULT 'estimate-app',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mitsumori_state_history (
  history_id bigserial PRIMARY KEY,
  payload jsonb NOT NULL,
  revision text NOT NULL,
  source_name text NOT NULL,
  saved_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mitsumori_state_history_saved_at_idx
  ON mitsumori_state_history (saved_at DESC);
