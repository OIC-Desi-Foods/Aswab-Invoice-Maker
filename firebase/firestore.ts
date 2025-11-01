import { db } from './config';
import { doc, getDoc, setDoc, updateDoc, DocumentData, collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, deleteDoc, writeBatch, runTransaction, where, getDocs, limit, startAfter, deleteField, Timestamp } from '@firebase/firestore';
import { UserData, User, SavedInvoice, Invoice, SavedClient, Product, ThemeSettings, InventoryTransaction } from '../types';
import { INITIAL_INVOICE, THEMES } from '../constants';
import { User as FirebaseAuthUser } from '@firebase/auth';

export const getUserData = async (uid: string): Promise<UserData | null> => {
    const userDocRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
        const data = docSnap.data() as UserData;
        // Provide a default theme if one isn't set
        if (!data.themeSettings) {
            data.themeSettings = THEMES.light;
        }
        return data;
    }
    return null;
};

export const updateUserData = (uid: string, data: Partial<UserData>) => {
    const userDocRef = doc(db, 'users', uid);
    return updateDoc(userDocRef, data as DocumentData);
};

export const initializeUserData = async (user: FirebaseAuthUser | User): Promise<UserData> => {
    const userDocRef = doc(db, 'users', user.uid);
    
    const name = ('displayName' in user ? user.displayName : user.name) || 'My Company';
    const email = user.email || '';
    
    const accountData: NonNullable<UserData['accountData']> = {
        company: { ...INITIAL_INVOICE.company, name, email },
        currency: 'Rs',
    };
    
    const initialUserData: UserData = {
        accountData,
        savedInvoiceProfiles: [],
        activeInvoiceProfileId: null,
        themeSettings: THEMES.light,
    };
    await setDoc(userDocRef, initialUserData);
    return initialUserData;
};

// --- INVOICE FUNCTIONS ---
const processInvoiceStockUpdate = async (uid: string, invoiceData: Invoice, products: Product[]) => {
    if (!invoiceData.isPaid) return;

    await runTransaction(db, async (transaction) => {
        for (const item of invoiceData.lineItems) {
            if (item.productId) {
                const productRef = doc(db, 'users', uid, 'products', item.productId);
                const productDoc = await transaction.get(productRef);
                if (!productDoc.exists()) {
                    throw new Error(`Product with ID ${item.productId} not found.`);
                }
                
                const product = productDoc.data() as Product;
                const totalStock = product.myStock + product.partnerStock;
                if (totalStock < item.quantity) {
                    throw new Error(`Not enough stock for '${product.name}'. Available: ${totalStock}, Needed: ${item.quantity}.`);
                }

                // Simple deduction logic: deduct from 'myStock' first, then 'partnerStock'.
                const myStockDeduction = Math.min(product.myStock, item.quantity);
                const partnerStockDeduction = item.quantity - myStockDeduction;

                const newMyStock = product.myStock - myStockDeduction;
                const newPartnerStock = product.partnerStock - partnerStockDeduction;

                transaction.update(productRef, { myStock: newMyStock, partnerStock: newPartnerStock });

                const transactionLogRef = doc(collection(db, 'users', uid, 'inventoryTransactions'));
                transaction.set(transactionLogRef, {
                    productId: item.productId,
                    productName: product.name,
                    changeMyStock: -myStockDeduction,
                    changePartnerStock: -partnerStockDeduction,
                    reason: 'invoice_paid',
                    referenceId: invoiceData.invoiceNumber,
                    timestamp: serverTimestamp(),
                });
            }
        }
    });
};

const transformInvoiceForFirestore = (invoiceData: Partial<Invoice> | Partial<SavedInvoice>) => {
    const data: DocumentData = { ...invoiceData };
    if (data.issueDate && typeof data.issueDate === 'string') {
        data.issueDate = Timestamp.fromDate(new Date(data.issueDate));
    }
    if (data.dueDate && typeof data.dueDate === 'string') {
        data.dueDate = Timestamp.fromDate(new Date(data.dueDate));
    }
    
    // Firestore doesn't support `undefined`. If logo or signature are undefined,
    // they should be removed from the object before saving.
    if (data.logo === undefined) {
        delete data.logo;
    }
    if (data.signature === undefined) {
        delete data.signature;
    }
    
    return data;
};

const transformInvoiceFromFirestore = (data: DocumentData): Partial<Invoice> => {
    const invoice: DocumentData = { ...data };
    if (invoice.issueDate && invoice.issueDate.toDate) {
        invoice.issueDate = invoice.issueDate.toDate().toISOString().split('T')[0];
    }
    if (invoice.dueDate && invoice.dueDate.toDate) {
        invoice.dueDate = invoice.dueDate.toDate().toISOString().split('T')[0];
    }
    if (invoice.createdAt && invoice.createdAt.toDate) {
        invoice.createdAt = invoice.createdAt.toDate().toISOString();
    }
    return invoice;
};

export const addInvoice = async (uid: string, invoiceData: Omit<SavedInvoice, 'id' | 'uid' | 'createdAt'>, products: Product[]): Promise<string> => {
    await processInvoiceStockUpdate(uid, invoiceData, products);
    const invoicesCol = collection(db, 'users', uid, 'invoices');
    const dataToSave = transformInvoiceForFirestore(invoiceData);
    const docRef = await addDoc(invoicesCol, { ...dataToSave, createdAt: serverTimestamp() });
    return docRef.id;
};

export const updateInvoice = async (uid: string, invoiceId: string, invoiceData: Partial<SavedInvoice>, oldInvoiceData: SavedInvoice | undefined, products: Product[]): Promise<void> => {
    const becamePaid = !oldInvoiceData?.isPaid && invoiceData.isPaid;
    if (becamePaid) {
        await processInvoiceStockUpdate(uid, { ...oldInvoiceData, ...invoiceData } as Invoice, products);
    }
    const invoiceDocRef = doc(db, 'users', uid, 'invoices', invoiceId);
    const dataToUpdate = transformInvoiceForFirestore(invoiceData);
    return updateDoc(invoiceDocRef, { ...dataToUpdate, updatedAt: serverTimestamp() });
};


export const deleteInvoiceFromDb = (uid: string, invoiceId: string) => {
    const invoiceDocRef = doc(db, 'users', uid, 'invoices', invoiceId);
    return deleteDoc(invoiceDocRef);
};

export const listenForInvoices = (uid: string, callback: (invoices: SavedInvoice[]) => void) => {
    const invoicesCol = collection(db, 'users', uid, 'invoices');
    const q = query(invoicesCol, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const invoices = snapshot.docs.map(doc => {
            const data = doc.data();
            const transformedData = transformInvoiceFromFirestore(data);
            return {
                ...(data as Invoice),
                ...transformedData,
                id: doc.id,
                uid,
                name: data.name,
            } as SavedInvoice;
        });
        callback(invoices);
    }, (error) => { console.error(`Error listening for invoices:`, error); callback([]); });
};

// --- CLIENT FUNCTIONS ---
export const addClient = async (uid: string, clientData: Omit<SavedClient, 'id'>) => {
    const clientsCol = collection(db, 'users', uid, 'clients');
    const docRef = await addDoc(clientsCol, { ...clientData });
    return docRef.id;
};
export const updateClient = (uid: string, clientId: string, clientData: Omit<SavedClient, 'id'>) => {
    const clientDocRef = doc(db, 'users', uid, 'clients', clientId);
    return updateDoc(clientDocRef, clientData as DocumentData);
};
export const deleteClient = (uid: string, clientId: string) => {
    const clientDocRef = doc(db, 'users', uid, 'clients', clientId);
    return deleteDoc(clientDocRef);
};
export const listenForClients = (uid: string, callback: (clients: SavedClient[]) => void) => {
    const clientsCol = collection(db, 'users', uid, 'clients');
    const q = query(clientsCol, orderBy('name'));
    return onSnapshot(q, (snapshot) => {
        const clients = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SavedClient));
        callback(clients);
    }, (error) => { console.error(`Error listening for clients:`, error); callback([]); });
};


// --- PRODUCT FUNCTIONS ---
export const addProduct = async (uid: string, productData: Omit<Product, 'id' | 'name'>) => {
    const productsCol = collection(db, 'users', uid, 'products');
    const { name, ...rest } = productData as any; // Exclude unified name field from being saved
    const docRef = await addDoc(productsCol, { ...rest, createdAt: serverTimestamp(), archived: false });
    return docRef.id;
};
export const updateProduct = (uid: string, productId: string, productData: Partial<Product>) => {
    const productDocRef = doc(db, 'users', uid, 'products', productId);
    const { name, ...rest } = productData as any; // Exclude unified name field from being saved
    const dataToUpdate: DocumentData = { ...rest, updatedAt: serverTimestamp() };
    
    // On update, remove the old unified 'name' field if it exists, to rely on name_en/name_ur
    if (productData.name_en || productData.name_ur) {
        dataToUpdate.name = deleteField();
    }
    
    return updateDoc(productDocRef, dataToUpdate);
};

export const deleteProduct = (uid: string, productId: string) => {
    const productDocRef = doc(db, 'users', uid, 'products', productId);
    return deleteDoc(productDocRef);
};

export const listenForProducts = (uid: string, callback: (products: Product[]) => void) => {
    const productsCol = collection(db, 'users', uid, 'products');
    const q = query(productsCol, orderBy('name_en'));
    return onSnapshot(q, (snapshot) => {
        const products = snapshot.docs.map(doc => {
            const data = doc.data();
            // Unify name for backward compatibility and display
            const unifiedName = [data.name_ur, data.name_en].filter(Boolean).join(' / ') || data.name || 'Unnamed Product';
            return { 
                ...data, 
                id: doc.id,
                name: unifiedName,
            } as Product;
        });
        callback(products);
    }, (error) => { console.error(`Error listening for products:`, error); callback([]); });
};

// --- INVENTORY & PARTNER FUNCTIONS ---
export const adjustStock = async (uid: string, productId: string, adjustmentType: 'sold_to_partner' | 'sold_to_customer' | 'received_new_stock', quantity: number, salePrice?: number, isPaid?: boolean) => {
    if (quantity <= 0) {
        throw new Error("Quantity must be positive.");
    }
    const productRef = doc(db, 'users', uid, 'products', productId);
    
    await runTransaction(db, async (transaction) => {
        const productDoc = await transaction.get(productRef);
        if (!productDoc.exists()) {
            throw new Error("Product not found.");
        }
        const product = productDoc.data();
        const productName = [product.name_ur, product.name_en].filter(Boolean).join(' / ') || 'Unnamed Product';

        let newMyStock = product.myStock;
        let newPartnerStock = product.partnerStock;
        let newAmountReceived = product.amountReceivedFromPartner || 0;
        let changeMyStock = 0;
        let changePartnerStock = 0;
        const updateData: DocumentData = {};

        switch (adjustmentType) {
            case 'sold_to_partner':
                if (product.myStock < quantity) throw new Error("Not enough 'My Stock' to sell to partner.");
                newMyStock -= quantity;
                newPartnerStock += quantity;
                changeMyStock = -quantity;
                changePartnerStock = +quantity;
                if (isPaid && salePrice !== undefined) {
                    newAmountReceived += quantity * salePrice;
                    updateData.amountReceivedFromPartner = newAmountReceived;
                }
                break;
            case 'sold_to_customer':
                 if (product.myStock < quantity) throw new Error("Not enough 'My Stock' to sell to customer.");
                newMyStock -= quantity;
                changeMyStock = -quantity;
                break;
            case 'received_new_stock':
                newMyStock += quantity;
                changeMyStock = +quantity;
                break;
        }

        updateData.myStock = newMyStock;
        updateData.partnerStock = newPartnerStock;
        transaction.update(productRef, updateData);
        
        const transactionLogRef = doc(collection(db, 'users', uid, 'inventoryTransactions'));
        const logData: Omit<InventoryTransaction, 'id'|'timestamp'> = {
            productId,
            productName,
            changeMyStock,
            changePartnerStock,
            reason: adjustmentType,
        };
        
        if ( (adjustmentType === 'sold_to_customer' || adjustmentType === 'sold_to_partner') && salePrice !== undefined) {
            logData.salePrice = salePrice;
        }
        
        if (adjustmentType === 'sold_to_partner') {
            logData.isPaid = !!isPaid;
        }

        transaction.set(transactionLogRef, {...logData, timestamp: serverTimestamp()});
    });
};

export const recordPartnerPayment = async (uid: string, productId: string, amount: number) => {
    if (amount <= 0) {
        throw new Error("Payment amount must be positive.");
    }
    const productRef = doc(db, 'users', uid, 'products', productId);
    
    await runTransaction(db, async (transaction) => {
        const productDoc = await transaction.get(productRef);
        if (!productDoc.exists()) {
            throw new Error("Product not found.");
        }
        const product = productDoc.data() as Product;

        const currentAmountReceived = product.amountReceivedFromPartner || 0;
        const newAmountReceived = currentAmountReceived + amount;
        
        transaction.update(productRef, { amountReceivedFromPartner: newAmountReceived });
    });
};


export const listenForInventoryTransactions = (uid: string, callback: (transactions: InventoryTransaction[]) => void, once = false) => {
    const transactionsCol = collection(db, 'users', uid, 'inventoryTransactions');
    const q = query(transactionsCol, orderBy('timestamp', 'desc'), limit(100));
    
    if (once) {
        return getDocs(q).then(snapshot => {
            const transactions = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as InventoryTransaction));
            callback(transactions);
            return transactions;
        });
    }

    return onSnapshot(q, (snapshot) => {
        const transactions = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as InventoryTransaction));
        callback(transactions);
    }, (error) => { console.error(`Error listening for inventory transactions:`, error); callback([]); });
};