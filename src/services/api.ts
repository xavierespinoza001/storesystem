import { Product, User, Movement, Category, Sale, SaleItem } from "../types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// --- Mock Data Setup ---

let MOCK_CATEGORIES: Category[] = [
  { id: "1", name: "Electronics", description: "Gadgets and devices", status: "active" },
  { id: "2", name: "Furniture", description: "Office and home furniture", status: "active" },
  { id: "3", name: "Accessories", description: "Cables, chargers, etc.", status: "active" },
  { id: "4", name: "Clothing", description: "Uniforms and apparel", status: "active" },
];

let MOCK_USERS: User[] = [
  { id: "1", name: "Super Admin", email: "admin@store.com", role: "admin", active: true, avatar: "https://ui-avatars.com/api/?name=Super+Admin&background=0D8ABC&color=fff" },
  { id: "2", name: "Sales Rep", email: "sales@store.com", role: "sales", active: true, avatar: "https://ui-avatars.com/api/?name=Sales+Rep&background=random" },
  { id: "3", name: "Guest Viewer", email: "viewer@store.com", role: "viewer", active: true, avatar: "https://ui-avatars.com/api/?name=Guest+Viewer&background=random" },
];

let MOCK_PRODUCTS: Product[] = [
  { id: "1", sku: "PROD-001", name: "Wireless Headphones", description: "Noise cancelling headphones", price: 120.00, categoryId: "1", categoryName: "Electronics", stock: 15, minStock: 5, status: "active" },
  { id: "2", sku: "PROD-002", name: "Mechanical Keyboard", description: "RGB Gaming Keyboard", price: 85.50, categoryId: "1", categoryName: "Electronics", stock: 3, minStock: 10, status: "active" },
  { id: "3", sku: "PROD-003", name: "Office Chair", description: "Ergonomic chair", price: 250.00, categoryId: "2", categoryName: "Furniture", stock: 8, minStock: 2, status: "active" },
  { id: "4", sku: "PROD-004", name: "USB-C Cable", description: "2m fast charging cable", price: 12.00, categoryId: "3", categoryName: "Accessories", stock: 100, minStock: 20, status: "active" },
  { id: "5", sku: "PROD-005", name: "Monitor 24\"", description: "IPS 1080p Display", price: 180.00, categoryId: "1", categoryName: "Electronics", stock: 12, minStock: 5, status: "active" },
];

let MOCK_MOVEMENTS: Movement[] = [
  { id: "1", productId: "1", productName: "Wireless Headphones", type: "in", quantity: 10, date: new Date().toISOString(), userId: "1", userName: "Super Admin", reason: "Initial Stock" },
  { id: "2", productId: "2", productName: "Mechanical Keyboard", type: "out", quantity: 2, date: new Date(Date.now() - 86400000).toISOString(), userId: "2", userName: "Sales Rep", reason: "Sale #1234" },
];

let MOCK_SALES: Sale[] = [];

// Helper to generate historical sales data
const generateMockHistory = () => {
    if (MOCK_SALES.length > 0) return; // Already generated

    const today = new Date();
    for (let i = 0; i < 14; i++) { // Last 14 days
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        // Random number of sales per day (0-5)
        const dailySalesCount = Math.floor(Math.random() * 6);
        
        for (let j = 0; j < dailySalesCount; j++) {
            const product = MOCK_PRODUCTS[Math.floor(Math.random() * MOCK_PRODUCTS.length)];
            const qty = Math.floor(Math.random() * 3) + 1;
            const subtotal = product.price * qty;
            
            MOCK_SALES.push({
                id: Math.random().toString(36).substr(2, 9).toUpperCase(),
                date: new Date(date.setHours(Math.random() * 12 + 8, Math.random() * 60)).toISOString(),
                total: subtotal,
                items: [{
                    productId: product.id,
                    productName: product.name,
                    quantity: qty,
                    price: product.price,
                    subtotal: subtotal
                }],
                userId: "2",
                userName: "Sales Rep",
                documentType: Math.random() > 0.5 ? 'receipt' : 'invoice'
            });
        }
    }
    // Sort by date desc
    MOCK_SALES.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

generateMockHistory();

// --- API Service ---

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<User> => {
      await delay(800);
      const user = MOCK_USERS.find(u => u.email === email);
      if (user) return user;
      throw new Error("Invalid credentials");
    },
    logout: async () => {
      await delay(500);
    }
  },
  categories: {
    getAll: async (): Promise<Category[]> => {
      await delay(400);
      return [...MOCK_CATEGORIES];
    },
    create: async (data: Omit<Category, "id">): Promise<Category> => {
      await delay(500);
      const newCat = { ...data, id: Math.random().toString(36).substr(2, 9) };
      MOCK_CATEGORIES.push(newCat);
      return newCat;
    },
    update: async (id: string, data: Partial<Category>): Promise<Category> => {
      await delay(500);
      const index = MOCK_CATEGORIES.findIndex(c => c.id === id);
      if (index === -1) throw new Error("Category not found");
      MOCK_CATEGORIES[index] = { ...MOCK_CATEGORIES[index], ...data };
      return MOCK_CATEGORIES[index];
    },
    delete: async (id: string): Promise<void> => {
      await delay(500);
      MOCK_CATEGORIES = MOCK_CATEGORIES.filter(c => c.id !== id);
    }
  },
  products: {
    getAll: async (): Promise<Product[]> => {
      await delay(600);
      return MOCK_PRODUCTS.map(p => {
        const cat = MOCK_CATEGORIES.find(c => c.id === p.categoryId);
        return { ...p, categoryName: cat ? cat.name : "Unknown" };
      });
    },
    create: async (product: Omit<Product, "id">): Promise<Product> => {
      await delay(600);
      const newProduct = { ...product, id: Math.random().toString(36).substr(2, 9) };
      MOCK_PRODUCTS.push(newProduct);
      return newProduct;
    },
    update: async (id: string, data: Partial<Product>): Promise<Product> => {
      await delay(600);
      const index = MOCK_PRODUCTS.findIndex(p => p.id === id);
      if (index === -1) throw new Error("Product not found");
      MOCK_PRODUCTS[index] = { ...MOCK_PRODUCTS[index], ...data };
      return MOCK_PRODUCTS[index];
    },
    delete: async (id: string): Promise<void> => {
      await delay(600);
      MOCK_PRODUCTS = MOCK_PRODUCTS.filter(p => p.id !== id);
    }
  },
  inventory: {
    getMovements: async (): Promise<Movement[]> => {
      await delay(600);
      return [...MOCK_MOVEMENTS].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    registerMovement: async (movement: Omit<Movement, "id" | "date" | "userName">, user: User): Promise<Movement> => {
      await delay(600);
      const newMovement: Movement = {
        ...movement,
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        userName: user.name,
      };
      MOCK_MOVEMENTS.unshift(newMovement);
      
      const productIndex = MOCK_PRODUCTS.findIndex(p => p.id === movement.productId);
      if (productIndex !== -1) {
        if (movement.type === 'in') {
          MOCK_PRODUCTS[productIndex].stock += movement.quantity;
        } else {
          MOCK_PRODUCTS[productIndex].stock -= movement.quantity;
        }
      }
      
      return newMovement;
    }
  },
  sales: {
    getAll: async (): Promise<Sale[]> => {
        await delay(500);
        return [...MOCK_SALES].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    create: async (items: SaleItem[], documentType: 'receipt' | 'invoice', user: User): Promise<Sale> => {
        await delay(800);
        
        // 1. Validate Stock
        for (const item of items) {
            const product = MOCK_PRODUCTS.find(p => p.id === item.productId);
            if (!product) throw new Error(`Product ${item.productName} not found`);
            if (product.stock < item.quantity) throw new Error(`Insufficient stock for ${item.productName}`);
        }

        const saleId = Math.random().toString(36).substr(2, 9).toUpperCase();
        const date = new Date().toISOString();

        // 2. Process Sale
        items.forEach(item => {
            const productIndex = MOCK_PRODUCTS.findIndex(p => p.id === item.productId);
            if (productIndex !== -1) {
                // Deduct Stock
                MOCK_PRODUCTS[productIndex].stock -= item.quantity;
                
                // Record Movement
                MOCK_MOVEMENTS.unshift({
                    id: Math.random().toString(36).substr(2, 9),
                    productId: item.productId,
                    productName: item.productName,
                    type: 'out',
                    quantity: item.quantity,
                    date: date,
                    userId: user.id,
                    userName: user.name,
                    reason: `Sale #${saleId}`
                });
            }
        });

        const newSale: Sale = {
            id: saleId,
            date,
            total: items.reduce((acc, item) => acc + item.subtotal, 0),
            items,
            userId: user.id,
            userName: user.name,
            documentType
        };

        MOCK_SALES.unshift(newSale);
        return newSale;
    }
  },
  users: {
    getAll: async (): Promise<User[]> => {
      await delay(600);
      return [...MOCK_USERS];
    },
    create: async (data: Omit<User, "id">): Promise<User> => {
      await delay(600);
      const newUser = { 
        ...data, 
        id: Math.random().toString(36).substr(2, 9),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`
      };
      MOCK_USERS.push(newUser);
      return newUser;
    },
    update: async (id: string, data: Partial<User>): Promise<User> => {
      await delay(600);
      const index = MOCK_USERS.findIndex(u => u.id === id);
      if (index === -1) throw new Error("User not found");
      MOCK_USERS[index] = { ...MOCK_USERS[index], ...data };
      return MOCK_USERS[index];
    },
    toggleStatus: async (id: string): Promise<void> => {
        await delay(400);
        const index = MOCK_USERS.findIndex(u => u.id === id);
        if (index !== -1) {
            MOCK_USERS[index].active = !MOCK_USERS[index].active;
        }
    }
  }
};
