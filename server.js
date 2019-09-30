const express = require('express');
const app = express();
const db = require('./db');
const { Page } = db.models;

app.use(express.json());

app.get('/api/pages', (req, res, next) => {
  Page.findAll()
    .then(pages => res.send(pages))
    .catch(next);
})

app.get('/api/pages/:id/children', async (req, res, next) => {
  try {
    const page = await Page.findByPk(req.params.id);
    res.send(await page.findChildren());
  } catch {
    console.log(next);
  }
})

app.get('/api/pages/:id/siblings', async (req, res, next) => {
  try {
    const page = await Page.findByPk(req.params.id);
    if (!(page.parentId)) {
      res.send([]);
    } else {
      const parent = await Page.findByPk(page.parentId);
      res.send((await parent.findChildren()).filter(child => child.id !== parseInt(req.params.id, 10)))
    }
  } catch {
    console.log(next);
  }
})

db.syncAndSeed()
  .then(() => app.listen(3000, () => console.log('listening on port 3000')));
