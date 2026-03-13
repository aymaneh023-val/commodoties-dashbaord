-- inflation_oecd: OECD CPI (food or headline fallback) per country per month
CREATE TABLE IF NOT EXISTS inflation_oecd (
  country_code         text        NOT NULL,
  country_name         text        NOT NULL,
  period               text        NOT NULL,   -- 'YYYY-MM'
  value                numeric     NOT NULL,   -- YoY % change
  is_headline_fallback boolean     NOT NULL DEFAULT false,
  fetched_at           timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (country_code, period)
);

-- consumer_barometer: OECD Consumer Barometer (store only, no UI yet)
CREATE TABLE IF NOT EXISTS consumer_barometer (
  country_code   text        NOT NULL,
  country_name   text        NOT NULL,
  period         text        NOT NULL,   -- 'YYYY-MM' or 'YYYY-QQ'
  indicator      text        NOT NULL,
  value          numeric     NOT NULL,
  fetched_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (country_code, indicator, period)
);
