ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed'));
UPDATE tasks SET status = 'Completed' WHERE completed = TRUE;
UPDATE tasks SET status = 'Pending' WHERE completed = FALSE;
