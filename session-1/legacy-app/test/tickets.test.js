const request = require('supertest');
const app = require('../src/server');

// NOTE: tests depend on seed data being present in bugbase.db
// run `npm run seed` before running tests

describe('Tickets API', () => {
  it('should get all tickets', async () => {
    const res = await request(app).get('/api/tickets');
    expect(res.statusCode).toBe(200);
    expect(res.body.items).toBeDefined();
    expect(res.body.items.length).toBeGreaterThan(0);
  });

  it('should get a single ticket', async () => {
    const res = await request(app).get('/api/tickets/1');
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBeDefined();
    expect(res.body.comments).toBeDefined();
    expect(res.body.tags).toBeDefined();
  });

  it('should create a new ticket', async () => {
    const newTicket = {
      title: 'Test ticket from automated tests',
      description: 'This is a test',
      project_id: 1,
      reporter_id: 1,
      priority: 'low',
    };
    const res = await request(app)
      .post('/api/tickets')
      .send(newTicket);
    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('Test ticket from automated tests');
    expect(res.body.id).toBeDefined();
  });

  // TODO: fix this test - delete cascade not working properly
  xit('should delete a ticket', async () => {
    // create a ticket first
    const createRes = await request(app)
      .post('/api/tickets')
      .send({
        title: 'Ticket to delete',
        project_id: 1,
        reporter_id: 1,
      });

    const id = createRes.body.id;
    const deleteRes = await request(app).delete('/api/tickets/' + id);
    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body.message).toBe('Ticket deleted');

    // verify it's gone
    const getRes = await request(app).get('/api/tickets/' + id);
    expect(getRes.statusCode).toBe(404);
  });
});
