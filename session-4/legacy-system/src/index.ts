// Main entry point for the e-commerce system
// This is just a demo - not a real application

import express from 'express';
import { createOrder, finalizeOrder } from './order-processor';
import { OrderItem, Customer } from './models';

const app = express();
app.use(express.json());

const PORT = 3000;

app.get('/', (req, res) => {
  res.json({ message: 'Legacy E-Commerce System API' });
});

app.post('/orders', (req, res) => {
  try {
    const { customerId, items } = req.body;
    const order = createOrder(customerId, items);
    res.json({ success: true, order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export { app };
