import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';

export async function GET() {
  try {
    await dbConnect();

    const totalSales = await Order.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const orderCount = await Order.countDocuments({ status: 'confirmed' });
    const productCount = await Product.countDocuments();
    const lowStockCount = await Product.countDocuments({ stock: { $lt: 10 } });

    const recentSales = await Order.find({ status: 'confirmed' })
      .sort({ createdAt: -1 })
      .limit(5);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const chartSales = await Order.find({ 
      status: 'confirmed',
      createdAt: { $gte: sevenDaysAgo }
    }).select('totalAmount createdAt');

    const stockLevels = await Product.find({})
      .select('name stock sku')
      .sort({ stock: 1 })
      .limit(10);

    return NextResponse.json({
      totalSales: totalSales[0]?.total || 0,
      orderCount,
      productCount,
      lowStockCount,
      recentSales,
      chartSales,
      stockLevels
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
