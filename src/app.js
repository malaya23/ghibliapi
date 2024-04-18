const jsonServer = require('json-server');
const clone = require('clone');
const data = require('../data.json');
const url = require('url');

const app = jsonServer.create();
const router = jsonServer.router(clone(data));

app.use((req, res, next) => {
  if (req.path === '/') return next();
  router.db.setState(clone(data));
  next();
});

app.use(jsonServer.defaults({
  logger: process.env.NODE_ENV !== 'production'
}));

app.use(router);

const filterFields = (obj, fields) => {
  Object.keys(obj).forEach((prop) => {
    if (!fields.includes(prop)) {
      delete obj[prop];
    }
  });
  return obj;
};

router.render = (req, res) => {
  const defaultLimit = 50;
  const maxLimit = 250;
  let responseData = res.locals.data;
  const query = url.parse(req.originalUrl, true).query;

  if (query.fields) {
    const fields = query.fields.split(',');
    if (Array.isArray(responseData)) {
      responseData = responseData.map((obj) => filterFields(obj, fields));
    } else if (typeof responseData === 'object') {
      responseData = filterFields(responseData, fields);
    }
  }

  if (query.limit) {
    if (Array.isArray(responseData)) {
      responseData = responseData.slice(0, Math.min(query.limit, maxLimit));
    }
  }

  res.jsonp(responseData);
};

module.exports = app;
