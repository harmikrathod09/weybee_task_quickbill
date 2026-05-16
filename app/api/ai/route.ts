import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import Order from '@/models/Order';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (decoded.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { prompt } = await request.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured on the server.' }, { status: 500 });
    }

    // Fetch context to give the AI about the store
    await dbConnect();
    const products = await Product.find({}, 'name sku price stock category').lean();
    const orders = await Order.find({}).sort({ createdAt: -1 }).limit(100).lean(); // Last 100 orders
    const orderCount = await Order.countDocuments();

    const productListContext = products.map((p: any) => 
      `- ${p.name} (SKU: ${p.sku}) | Category: ${p.category} | Price: ₹${p.price} | Stock: ${p.stock}`
    ).join('\n');

    const orderListContext = orders.map((o: any) => 
      `- Invoice #${o.invoiceNumber} | Date: ${new Date(o.createdAt).toLocaleDateString()} | Total: ₹${o.totalAmount} | Status: ${o.status} | Items: ${o.items.map((i:any) => `${i.quantity}x ${i.name}`).join(', ')}`
    ).join('\n');

    const systemContext = `You are QuickBill AI. Your SOLE purpose is to help the owner with the QuickBill POS system and their store.

STRICT RULES:
1. If the user asks about products, stock, prices, sales, orders, invoices, marketing, business advice, or basic math, you MUST answer accurately using the store data below.
2. If the user asks about ANYTHING ELSE (including sports, programming, history, geography, or general chit-chat like "how are you"), you MUST NOT answer. You must output EXACTLY the following string and absolutely nothing else:
"Sorry, this question is not related to the project."

Current system context: The store has processed ${orderCount} total orders.

Here is the current inventory list of the store's actual products:
${productListContext}

Here is the recent order history (last 100 invoices):
${orderListContext}`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: systemContext
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return NextResponse.json({ response: responseText });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate response' }, { status: 500 });
  }
}
