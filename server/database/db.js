/**
 * db.js — Módulo de banco de dados SQLite (API Intermediária)
 *
 * Integração interdisciplinar com a disciplina de Banco de Dados (BD):
 *   - Modelo relacional com 3 tabelas e chaves estrangeiras
 *   - Prepared statements (previnem SQL Injection)
 *   - Transações atômicas (ACID) para garantir consistência
 *   - WAL mode para performance em leituras concorrentes
 *
 * Esquema:
 *   consultas      — cada busca realizada pelo usuário
 *   alertas        — alertas ambientais gerados por consulta (N:1)
 *   qualidade_ar   — índice AQI e componentes por consulta (1:1)
 *
 * Relacionamento:
 *   consultas (1) ──── (N) alertas
 *   consultas (1) ──── (1) qualidade_ar
 */

import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH   = join(__dirname, 'historico.db');

// ── Inicialização ──────────────────────────────────────────────────────────

const db = new Database(DB_PATH);

// WAL (Write-Ahead Logging): melhora performance em leituras simultâneas
db.pragma('journal_mode = WAL');
// Habilita verificação de integridade referencial (chaves estrangeiras)
db.pragma('foreign_keys = ON');

// ── DDL — Criação das tabelas ──────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS consultas (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    cidade    TEXT    NOT NULL,
    pais      TEXT,
    timestamp TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    temp      REAL,
    temp_max  REAL,
    temp_min  REAL,
    descricao TEXT,
    umidade   INTEGER,
    vento     REAL,
    icone     TEXT
  );

  CREATE TABLE IF NOT EXISTS alertas (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    consulta_id INTEGER NOT NULL,
    tipo        TEXT    NOT NULL,
    nivel       TEXT    NOT NULL,
    mensagem    TEXT    NOT NULL,
    FOREIGN KEY (consulta_id) REFERENCES consultas(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS qualidade_ar (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    consulta_id INTEGER NOT NULL UNIQUE,
    aqi_index   INTEGER,
    aqi_label   TEXT,
    pm25        REAL,
    pm10        REAL,
    co          REAL,
    no2         REAL,
    FOREIGN KEY (consulta_id) REFERENCES consultas(id) ON DELETE CASCADE
  );
`);

// ── Prepared Statements ────────────────────────────────────────────────────
// Compilados uma vez, reutilizados em cada chamada — performance + segurança

const stmtInsertConsulta = db.prepare(`
  INSERT INTO consultas (cidade, pais, temp, temp_max, temp_min, descricao, umidade, vento, icone)
  VALUES (@cidade, @pais, @temp, @temp_max, @temp_min, @descricao, @umidade, @vento, @icone)
`);

const stmtInsertAlerta = db.prepare(`
  INSERT INTO alertas (consulta_id, tipo, nivel, mensagem)
  VALUES (@consulta_id, @tipo, @nivel, @mensagem)
`);

const stmtInsertQualidadeAr = db.prepare(`
  INSERT INTO qualidade_ar (consulta_id, aqi_index, aqi_label, pm25, pm10, co, no2)
  VALUES (@consulta_id, @aqi_index, @aqi_label, @pm25, @pm10, @co, @no2)
`);

const stmtSelectHistorico = db.prepare(`
  SELECT * FROM consultas ORDER BY id DESC LIMIT ?
`);

const stmtSelectPorCidade = db.prepare(`
  SELECT * FROM consultas
  WHERE LOWER(cidade) = LOWER(?)
  ORDER BY id DESC LIMIT ?
`);

const stmtSelectAlertas = db.prepare(`
  SELECT tipo, nivel, mensagem FROM alertas WHERE consulta_id = ?
`);

const stmtSelectQualidadeAr = db.prepare(`
  SELECT aqi_index, aqi_label, pm25, pm10, co, no2
  FROM qualidade_ar WHERE consulta_id = ?
`);

const stmtCountConsultas = db.prepare(`SELECT COUNT(*) AS total FROM consultas`);

// ── Funções exportadas ─────────────────────────────────────────────────────

/**
 * Salva uma consulta completa no banco de dados.
 * Usa transação atômica: ou tudo é salvo, ou nada é salvo (ACID).
 *
 * @param {object} params.current     - Resposta bruta do /weather (OpenWeatherMap)
 * @param {Array}  params.alerts      - Alertas gerados por buildEnvironmentalAlerts
 * @param {object} params.airQuality  - Resultado de mapAirQuality + componentes
 * @returns {number} ID da consulta inserida
 */
export const salvarConsulta = db.transaction(({ current, alerts, airQuality }) => {
  // 1. Insere o registro principal da consulta
  const { lastInsertRowid: consultaId } = stmtInsertConsulta.run({
    cidade:    current.name,
    pais:      current.sys?.country   ?? null,
    temp:      current.main.temp,
    temp_max:  current.main.temp_max,
    temp_min:  current.main.temp_min,
    descricao: current.weather[0].description,
    umidade:   current.main.humidity,
    vento:     current.wind?.speed    ?? null,
    icone:     current.weather[0].icon,
  });

  // 2. Insere cada alerta ambiental vinculado à consulta
  for (const alerta of alerts) {
    stmtInsertAlerta.run({
      consulta_id: consultaId,
      tipo:        alerta.type,
      nivel:       alerta.level,
      mensagem:    alerta.message,
    });
  }

  // 3. Insere o registro de qualidade do ar (se disponível)
  if (airQuality?.index != null) {
    stmtInsertQualidadeAr.run({
      consulta_id: consultaId,
      aqi_index:   airQuality.index,
      aqi_label:   airQuality.label,
      pm25:        airQuality.components?.pm25 ?? null,
      pm10:        airQuality.components?.pm10 ?? null,
      co:          airQuality.components?.co   ?? null,
      no2:         airQuality.components?.no2  ?? null,
    });
  }

  return consultaId;
});

/**
 * Retorna as últimas N consultas com seus alertas e qualidade do ar.
 * @param {number} limite - Número máximo de registros (padrão: 20)
 */
export function buscarHistorico(limite = 20) {
  const consultas = stmtSelectHistorico.all(limite);

  return consultas.map((c) => ({
    ...c,
    alertas:      stmtSelectAlertas.all(c.id),
    qualidade_ar: stmtSelectQualidadeAr.get(c.id) ?? null,
  }));
}

/**
 * Retorna o histórico de uma cidade específica (case-insensitive).
 * @param {string} cidade
 * @param {number} limite
 */
export function buscarHistoricoPorCidade(cidade, limite = 10) {
  const consultas = stmtSelectPorCidade.all(cidade, limite);

  return consultas.map((c) => ({
    ...c,
    alertas:      stmtSelectAlertas.all(c.id),
    qualidade_ar: stmtSelectQualidadeAr.get(c.id) ?? null,
  }));
}

/**
 * Retorna estatísticas gerais do banco de dados.
 */
export function buscarEstatisticas() {
  const { total } = stmtCountConsultas.get();
  const cidadesUnicas = db.prepare(
    `SELECT COUNT(DISTINCT LOWER(cidade)) AS total FROM consultas`
  ).get().total;

  return { totalConsultas: total, cidadesUnicas };
}

export default db;
