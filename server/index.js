/**
 * index.js — Servidor Express (API Intermediária)
 *
 * Papel no sistema distribuído:
 *   Mobile App (React Native) ──► ESTE SERVIDOR ──► OpenWeatherMap API
 *
 * Responsabilidades:
 *   - Receber e rotear requisições do aplicativo mobile
 *   - Aplicar rate limiting para proteger a cota da API externa
 *   - Configurar CORS adequado por ambiente (dev/prod)
 *   - Centralizar tratamento de erros com log e resposta padronizada
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import weatherRoutes from './routes/weatherRoutes.js';

const app = express();
const PORT = process.env.PORT || 3001;
const isDev = (process.env.NODE_ENV ?? 'development') !== 'production';

// ─────────────────────────────────────────────────────────────
// CORS
// CORREÇÃO: A versão anterior usava app.use(cors()) sem nenhuma configuração,
// aceitando requisições de qualquer origem (origin: *).
// Agora: permissivo em desenvolvimento (necessário para Expo Go, simuladores),
// restrito às origens configuradas em produção.
// ─────────────────────────────────────────────────────────────
const corsOptions = isDev
  ? { origin: true } // Aceita qualquer origem em desenvolvimento
  : {
      origin: (process.env.ALLOWED_ORIGINS ?? '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
      optionsSuccessStatus: 200,
    };

// ─────────────────────────────────────────────────────────────
// RATE LIMITING
// CORREÇÃO: Sem rate limiting, qualquer cliente poderia esgotar a cota
// gratuita de 1.000 chamadas/dia da OpenWeatherMap em minutos.
// Limite: 100 requisições por IP a cada 15 minutos.
// ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Janela de 15 minutos
  max: 100,                  // Máximo de 100 requisições por IP por janela
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Muitas requisições enviadas. Tente novamente em 15 minutos.',
    retryAfter: '15 minutos',
  },
});

// ─────────────────────────────────────────────────────────────
// MIDDLEWARES GLOBAIS
// ─────────────────────────────────────────────────────────────
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api', limiter);

// ─────────────────────────────────────────────────────────────
// ROTAS
// ─────────────────────────────────────────────────────────────
app.use('/api', weatherRoutes);

// Rota catch-all para endpoints inexistentes
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado nesta API intermediária' });
});

// ─────────────────────────────────────────────────────────────
// TRATAMENTO GLOBAL DE ERROS
// CORREÇÃO: Adicionado log estruturado com timestamp e status code
// para facilitar depuração em desenvolvimento.
// ─────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ${status} — ${err.message}`);

  res.status(status).json({
    error: err.message || 'Erro interno no serviço intermediário',
    status,
    timestamp,
  });
});

// ─────────────────────────────────────────────────────────────
// INICIALIZAÇÃO
// ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅ API intermediária APS Mobile iniciada`);
  console.log(`   URL:       http://localhost:${PORT}/api`);
  console.log(`   Ambiente:  ${isDev ? 'desenvolvimento' : 'produção'}`);
  console.log(`   CORS:      ${isDev ? 'permissivo (dev)' : 'restrito (prod)'}`);
  console.log(`   Health:    http://localhost:${PORT}/api/health\n`);
});
