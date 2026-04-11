/**
 * Paginate a Mongoose model with filter and options.
 * Supports: page, limit, sort, populate
 */
const paginate = async (Model, filter = {}, options = {}) => {
  const { page = 1, limit = 20, sort = '-createdAt', populate = [] } = options;
  const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

  let query = Model.find(filter).sort(sort).skip(skip).limit(parseInt(limit));

  if (populate.length > 0) {
    populate.forEach((p) => { query = query.populate(p); });
  }

  const [data, total] = await Promise.all([
    query.exec(),
    Model.countDocuments(filter),
  ]);

  const p = Math.max(1, parseInt(page));
  const l = parseInt(limit);

  return {
    data,
    total,
    page: p,
    limit: l,
    totalPages: Math.ceil(total / l),
    hasNext: p * l < total,
    hasPrev: p > 1,
  };
};

module.exports = { paginate };
