ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
UPDATE tasks SET status = 'Pending' WHERE status = 'In Progress';
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check CHECK (status IN ('Pending', 'Completed'));
