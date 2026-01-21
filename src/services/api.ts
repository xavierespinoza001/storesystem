import { Product, User, Movement, Category, Sale, SaleItem, PaymentMethod } from "../types";
import categoriesData from "../data/categories.json";
import usersData from "../data/users.json";
import productsData from "../data/products.json";
import movementsData from "../data/movements.json";
import salesData from "../data/sales.json";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// --- In-Memory State Initialization ---
// We initialize state from JSON files to simulate a DB. 
// Changes persist only during the session (SPA behavior).

let MOCK_CATEGORIES: Category[] = [...categoriesData] as Category[];
let MOCK_USERS: User[] = [...usersData] as User[];
let MOCK_PRODUCTS: Product[] = [...productsData] as Product[];
let MOCK_MOVEMENTS: Movement[] = [...movementsData] as Movement[];
let MOCK_SALES: Sale[] = [...salesData] as Sale[];

// Helper to generate historical sales data if empty
const generateMockHistory = () => {
    if (MOCK_SALES.length > 0) return; 

    const today = new Date();
    for (let i = 0; i < 14; i++) { 
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
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
                documentType: Math.random() > 0.5 ? 'receipt' : 'invoice',
                paymentMethods: [{ id: "1", type: "cash", amount: subtotal }],
                isCredit: false,
                pendingAmount: 0,
                observations: "Auto-generated history"
            });
        }
    }
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
    create: async (
      items: SaleItem[], 
      documentType: 'receipt' | 'invoice', 
      user: User,
      paymentData: {
        methods: PaymentMethod[],
        isCredit: boolean,
        pendingAmount: number,
        observations: string
      }
    ): Promise<Sale> => {
        await delay(800);
        
        // 1. Validate Stock
        for (const item of items) {
            const product = MOCK_PRODUCTS.find(p => p.id === item.productId);
            if (!product) throw new Error(`Product ${item.productName} not found`);
            if (product.stock < item.quantity) throw new Error(`Insufficient stock for ${item.productName}`);
        }

        const saleId = Math.random().toString(36).substr(2, 9).toUpperCase();
        const date = new Date().toISOString();

        // 2. Process Sale (Deduct Stock)
        items.forEach(item => {
            const productIndex = MOCK_PRODUCTS.findIndex(p => p.id === item.productId);
            if (productIndex !== -1) {
                MOCK_PRODUCTS[productIndex].stock -= item.quantity;
                
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

        const total = items.reduce((acc, item) => acc + item.subtotal, 0);

        const newSale: Sale = {
            id: saleId,
            date,
            total,
            items,
            userId: user.id,
            userName: user.name,
            documentType,
            paymentMethods: paymentData.methods,
            isCredit: paymentData.isCredit,
            pendingAmount: paymentData.pendingAmount,
            observations: paymentData.observations
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
