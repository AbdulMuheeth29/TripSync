// Script to add authentication middleware to all trip routes

const fs = require('fs');
const path = require('path');

const routesPath = path.join(__dirname, 'server', 'routes.ts');
let content = fs.readFileSync(routesPath, 'utf8');

// Routes that need requireAuth + requireTripAccess
const tripRoutes = [
  'app.post("/api/trips/:tripId/items/:itemId/vote"',
  'app.post("/api/trips/:tripId/items/:itemId/comments"',
  'app.patch("/api/trips/:tripId/items/:itemId"',
  'app.post("/api/trips/:tripId/expenses"',
  'app.patch("/api/trips/:tripId/expenses/:expenseId"',
  'app.get("/api/trips/:tripId/invites"',
  'app.post("/api/trips/:tripId/invites"',
  'app.get("/api/trips/:tripId/preferences"',
  'app.put("/api/trips/:tripId/preferences"',
  'app.get("/api/trips/:tripId/chat"',
  'app.post("/api/trips/:tripId/chat"',
  'app.get("/api/trips/:tripId/photos"',
  'app.post("/api/trips/:tripId/photos"',
  'app.patch("/api/trips/:tripId/members/:memberId"',
  'app.post("/api/trips/:tripId/polls"',
  'app.post("/api/trips/:tripId/polls/:pollId/vote"',
  'app.post("/api/trips/:tripId/packing"',
  'app.patch("/api/trips/:tripId/packing/:itemId"',
  'app.post("/api/trips/:tripId/transportation"',
  'app.patch("/api/trips/:tripId/transportation/:entryId"',
  'app.put("/api/trips/:tripId/availability"',
  'app.get("/api/trips/:tripId/documents"',
  'app.post("/api/trips/:tripId/documents"',
  'app.delete("/api/trips/:tripId/documents/:docId"',
  'app.get("/api/trips/:tripId/emergency-contacts"',
  'app.post("/api/trips/:tripId/emergency-contacts"',
  'app.patch("/api/trips/:tripId/emergency-contacts/:contactId"',
  'app.delete("/api/trips/:tripId/emergency-contacts/:contactId"',
  'app.post("/api/trips/:tripId/satisfaction"',
  'app.put("/api/trips/:tripId/location"',
  'app.get("/api/trips/:tripId/analytics"',
  'app.post("/api/trips/:tripId/suggest-resolution"',
  'app.post("/api/trips/:tripId/planning-chat"',
];

// Add requireAuth, requireTripAccess to all trip routes
tripRoutes.forEach(route => {
  // Find the route definition
  const routeRegex = new RegExp(`(${route.replace(/[()]/g, '\\$&')}, async)`, 'g');
  content = content.replace(routeRegex, `${route}, requireAuth, requireTripAccess, async`);
});

// Route that only needs requireAuth
content = content.replace(
  'app.post("/api/trips/join/:code", async',
  'app.post("/api/trips/join/:code", requireAuth, async'
);

// Routes that need requireAuth only (user insights)
content = content.replace(
  'app.get("/api/users/:userId/insights", async',
  'app.get("/api/users/:userId/insights", requireAuth, async'
);

fs.writeFileSync(routesPath, content, 'utf8');
console.log('Routes updated with authentication middleware');
