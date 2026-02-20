import express from 'express';
import { getDB } from '../database';

const router = express.Router()

// get all projects with ticket counts
router.get('/', (req: any, res: any) => {
  try {
    const db: any = getDB()
    const projects = db.prepare(`
      SELECT p.*,
        u.display_name as owner_name,
        (SELECT COUNT(*) FROM tickets WHERE project_id = p.id) as ticket_count,
        (SELECT COUNT(*) FROM tickets WHERE project_id = p.id AND status = 'open') as open_tickets,
        (SELECT COUNT(*) FROM tickets WHERE project_id = p.id AND status = 'closed') as closed_tickets
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
    `).all()
    res.json(projects)
  } catch(err: any) {
    console.log('Error fetching projects')
    res.status(500).json({ error: 'Failed to fetch projects' })
  }
})

// get single project
router.get('/:id', (req: any, res: any) => {
  const db: any = getDB()
  const project: any = db.prepare(`
    SELECT p.*,
      u.display_name as owner_name,
      (SELECT COUNT(*) FROM tickets WHERE project_id = p.id) as ticket_count,
      (SELECT COUNT(*) FROM tickets WHERE project_id = p.id AND status = 'open') as open_tickets,
      (SELECT COUNT(*) FROM tickets WHERE project_id = p.id AND status IN ('closed', 'resolved')) as closed_tickets
    FROM projects p
    LEFT JOIN users u ON p.owner_id = u.id
    WHERE p.id = ?
  `).get(req.params.id)

  if (!project) {
    return res.status(404).json({ error: 'Project not found' })
  }

  // also get recent tickets for this project
  const recentTickets = db.prepare('SELECT id, title, status, priority, created_at FROM tickets WHERE project_id = ? ORDER BY created_at DESC LIMIT 10').all(req.params.id)
  project.recent_tickets = recentTickets

  res.json(project)
})

// create project
router.post('/', (req: any, res: any) => {
  try {
    const db: any = getDB()
    const { name, description, slug, owner_id } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' })
    }

    const result = db.prepare('INSERT INTO projects (name, description, slug, owner_id) VALUES (?, ?, ?, ?)').run(
      name,
      description || null,
      slug || name.toLowerCase().replace(/\s+/g, '-'),
      owner_id || 1
    )

    const project: any = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json(project)
  } catch(err: any) {
    console.log('Error creating project: ' + err.message)
    res.status(500).json({ error: 'Failed to create project' })
  }
})

export { router }
