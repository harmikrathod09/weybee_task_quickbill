import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await dbConnect();
    const orders = await Order.find({}).sort({ createdAt: -1 });
    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await dbConnect();
    const { items, subtotal, discountAmount, taxAmount, totalAmount } = await request.json();

    // 1. Generate Invoice Number
    const count = await Order.countDocuments();
    const invoiceNumber = `QB-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;

    // 2. Validate Stock and Update
    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      if (!product) {
        throw new Error(`Product ${item.name} not found`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${item.name}. Available: ${product.stock}`);
      }
      product.stock -= item.quantity;
      await product.save({ session });
    }

    // 3. Create Order
    const order = await Order.create([{
      items,
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      invoiceNumber,
      status: 'confirmed'
    }], { session });

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json(order[0], { status: 201 });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
