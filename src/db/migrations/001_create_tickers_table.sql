CREATE TABLE tickers {
    time TIMESTAMPTZ   NOT NULL ,
    symbol TEXT NOT NULL
    price NUMERIC,
  volume NUMERIC
}

SELECT create_hypertable('tickers', 'time');