import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// In-memory / initial state API store
let inventoryStore: any[] = [];
let reportsStore: any[] = [];
let profileStore: any = null;

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'AUX Air Conditioner Inventory & Service Management API' });
});

// Inventory API Endpoints
app.get('/api/inventory', (req, res) => {
  res.json(inventoryStore);
});

app.post('/api/inventory', (req, res) => {
  const data = req.body;
  if (Array.isArray(data)) {
    inventoryStore = data;
    return res.json({ message: 'Inventory synced successfully', count: inventoryStore.length });
  }
  if (!data || !data.itemName) {
    return res.status(400).json({ error: 'Item name is required' });
  }
  inventoryStore.push(data);
  res.status(201).json({ message: 'Item created successfully', item: data });
});

app.put('/api/inventory/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const updatedItem = req.body;
  const index = inventoryStore.findIndex(i => i.id === id);
  if (index !== -1) {
    inventoryStore[index] = { ...inventoryStore[index], ...updatedItem };
    return res.json({ message: 'Item updated successfully', item: inventoryStore[index] });
  }
  res.status(404).json({ error: 'Item not found' });
});

// Toggle Archive route
app.put('/api/inventory/:id/archive', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const index = inventoryStore.findIndex(i => i.id === id);
  if (index !== -1) {
    inventoryStore[index].isArchived = !inventoryStore[index].isArchived;
    return res.json({ 
      message: inventoryStore[index].isArchived ? 'Item archived' : 'Item restored', 
      item: inventoryStore[index] 
    });
  }
  res.status(404).json({ error: 'Item not found' });
});

app.delete('/api/inventory/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  inventoryStore = inventoryStore.filter(i => i.id !== id);
  res.json({ message: 'Item deleted successfully', id });
});

// Reports API Endpoints
app.get('/api/reports', (req, res) => {
  res.json(reportsStore);
});

app.post('/api/reports', (req, res) => {
  const data = req.body;
  if (Array.isArray(data)) {
    reportsStore = data;
    return res.json({ message: 'Reports synced successfully', count: reportsStore.length });
  }
  if (!data || !data.customer) {
    return res.status(400).json({ error: 'Customer name is required' });
  }
  reportsStore.unshift(data);
  res.status(201).json({ message: 'Service report created', report: data });
});

app.put('/api/reports/:id', (req, res) => {
  const id = req.params.id;
  const updatedReport = req.body;
  const index = reportsStore.findIndex(r => r.id === id);
  if (index !== -1) {
    reportsStore[index] = { ...reportsStore[index], ...updatedReport };
    return res.json({ message: 'Report updated successfully', report: reportsStore[index] });
  }
  res.status(404).json({ error: 'Report not found' });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AUX Service Desk Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
