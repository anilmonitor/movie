const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.movie.findMany({ take: 5, select: { title: true, poster: true }, orderBy: { id: 'desc' } })
  .then(d => {
    d.forEach(m => console.log(m.title, '|||', m.poster.substring(0, 150)));
    return p['$disconnect']();
  });
