import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    // Mock products data
    const mockProducts = [
      {
        id: '1',
        name: 'Digital Blood Pressure Monitor',
        nameAr: 'جهاز قياس ضغط الدم الرقمي',
        price: 89.99,
        currency: 'USD',
        category: 'DIAGNOSTIC',
        image: '/images/products/blood-pressure.jpg',
        rating: 4.5,
        reviews: 23,
        supplier: 'MedTech Solutions',
        inStock: true,
      },
      {
        id: '2',
        name: 'Pulse Oximeter',
        nameAr: 'جهاز قياس الأكسجين',
        price: 45.99,
        currency: 'USD',
        category: 'MONITORING',
        image: '/images/products/pulse-oximeter.jpg',
        rating: 4.8,
        reviews: 156,
        supplier: 'HealthCare Innovations',
        inStock: true,
      },
      {
        id: '3',
        name: 'Digital Thermometer',
        nameAr: 'ميزان حرارة رقمي',
        price: 15.99,
        currency: 'USD',
        category: 'DIAGNOSTIC',
        image: '/images/products/thermometer.jpg',
        rating: 4.2,
        reviews: 89,
        supplier: 'Medical Supplies Co',
        inStock: true,
      },
    ];

    // Simple filtering
    let filteredProducts = mockProducts;
    
    if (category) {
      filteredProducts = filteredProducts.filter(p => p.category === category);
    }
    
    if (search) {
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.nameAr.includes(search)
      );
    }

    // Simple pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: {
        products: paginatedProducts,
        pagination: {
          page,
          limit,
          total: filteredProducts.length,
          totalPages: Math.ceil(filteredProducts.length / limit),
          hasNext: endIndex < filteredProducts.length,
          hasPrev: page > 1,
        },
        filters: {
          categories: ['DIAGNOSTIC', 'MONITORING', 'SURGICAL', 'LABORATORY'],
          priceRange: { min: 15.99, max: 5000 },
        },
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Mock product creation
    const newProduct = {
      id: Date.now().toString(),
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      data: newProduct,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}