import 'reflect-metadata';
import dotenv from 'dotenv';
import { buildContainer } from './container/container';
import { ExpressServer } from './presentation/server';

dotenv.config();

const container = buildContainer();
const server = new ExpressServer(container);
server.listen(Number(process.env.PORT ?? 3000));
