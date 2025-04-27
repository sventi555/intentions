import 'dotenv/config';

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import follows from './routes/follows';
import intentions from './routes/intentions';
import posts from './routes/posts';
import users from './routes/users';

const app = new Hono();

app.use('/*', cors());

app.route('/follows', follows);
app.route('/intentions', intentions);
app.route('/posts', posts);
app.route('/users', users);

const port = process.env.PORT;

export default {
  fetch: app.fetch,
  port,
};
