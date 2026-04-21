const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.issues.map(i => ({ path: i.path.join('.'), message: i.message })),
    });
  }

  // Prisma unique constraint violation (P2002)
  if (err.code === 'P2002') {
    const field = err.meta?.target ? [].concat(err.meta.target).join(', ') : 'field';
    return res.status(409).json({ error: `A record with that ${field} already exists` });
  }

  // Prisma record not found (P2025)
  if (err.code === 'P2025') {
    return res.status(404).json({ error: err.meta?.cause || 'Record not found' });
  }

  // Prisma foreign key constraint failure (P2003)
  if (err.code === 'P2003') {
    return res.status(400).json({ error: 'Related record not found' });
  }

  // Prisma required field missing (P2012)
  if (err.code === 'P2012') {
    return res.status(400).json({ error: 'Missing required field' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
};

module.exports = errorHandler;
