import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';

export async function GET() {
  try {
    await dbConnect();

    const financialStats = await Order.aggregate([
      { $match: { status: 'confirmed' } },
      { 
        $group: { 
          _id: null, 
          totalRevenue: { $sum: '$subtotal' },
          totalTax: { $sum: '$taxAmount' },
          totalDiscount: { $sum: '$discountAmount' },
          totalEarnings: { $sum: '$totalAmount' }
        } 
      }
    ]);

    const orderCount = await Order.countDocuments({ status: 'confirmed' });
    const productCount = await Product.countDocuments();
    const lowStockCount = await Product.countDocuments({ stock: { $lt: 10 } });

    const recentSales = await Order.find({ status: 'confirmed' })
      .sort({ createdAt: -1 })
      .limit(5);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailySales = await Order.find({ 
      status: 'confirmed',
      createdAt: { $gte: thirtyDaysAgo }
    }).select('subtotal totalAmount createdAt');

    const monthlySales = await Order.aggregate([
      { $match: { status: 'confirmed' } },
      {
        $group: {
          _id: { 
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" }
          },
          revenue: { $sum: "$subtotal" },
          earnings: { $sum: "$totalAmount" }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 6 }
    ]);

    const stockLevels = await Product.find({})
      .select('name stock sku')
      .sort({ stock: 1 })
      .limit(10);

    return NextResponse.json({
      totalSales: financialStats[0]?.totalEarnings || 0,
      totalRevenue: financialStats[0]?.totalRevenue || 0,
      totalTax: financialStats[0]?.totalTax || 0,
      totalDiscount: financialStats[0]?.totalDiscount || 0,
      orderCount,
      productCount,
      lowStockCount,
      recentSales,
      dailySales,
      monthlySales,
      stockLevels
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
