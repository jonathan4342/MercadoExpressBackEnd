import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { buildContainer } from '../src/container/container';
import { ExpressServer } from '../src/presentation/server';

/**
 * Entrada serverless para Vercel: se exporta la app de Express como handler
 * (sin app.listen — Vercel gestiona el ciclo de vida de la función).
 */
const server = new ExpressServer(buildContainer());
export default server.getApp();
