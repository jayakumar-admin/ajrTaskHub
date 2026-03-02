const db = require('../config/db');

exports.getTodos = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      'SELECT * FROM personal_todos WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result?.rows || []);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
};

exports.addTodo = async (req, res) => {
  try {
    const userId = req.user.id;
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const result = await db.query(
      'INSERT INTO personal_todos (user_id, text) VALUES ($1, $2) RETURNING *',
      [userId, text]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding todo:', error);
    res.status(500).json({ error: 'Failed to add todo' });
  }
};

exports.updateTodo = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { is_completed } = req.body;

    const result = await db.query(
      'UPDATE personal_todos SET is_completed = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [is_completed, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Failed to update todo' });
  }
};

exports.deleteTodo = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM personal_todos WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
};
