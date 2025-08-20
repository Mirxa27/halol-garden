import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Mock product data for demonstration
    const mockProduct = {
      id: id,
      name: 'Sample Medical Device',
      nameAr: 'جهاز طبي نموذجي',
      description: 'This is a sample medical device for demonstration purposes.',
      price: 1299.99,
      currency: 'USD',
      category: 'DIAGNOSTIC',
      status: 'ACTIVE',
      condition: 'NEW',
      images: ['/images/products/sample-device.jpg'],
      specifications: {
        weight: '2.5kg',
        dimensions: '30x20x15cm',
        powerRequirement: '110-240V AC',
        warranty: '2 years',
      },
      supplier: {
        id: 'supplier-1',
        name: 'Medical Devices Inc.',
        rating: 4.8,
        verified: true,
      },
      availability: {
        inStock: 25,
        lowStockThreshold: 5,
        nextRestockDate: '2024-01-15',
      },
      ratings: {
        average: 4.6,
        totalReviews: 127,
        distribution: {
          5: 78,
          4: 32,
          3: 12,
          2: 3,
          1: 2,
        },
      },
      createdAt: '2023-12-01T00:00:00Z',
      updatedAt: '2023-12-20T00:00:00Z',
    };

    return NextResponse.json({
      success: true,
      data: mockProduct,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Mock update response
    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      data: { id, ...body },
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Mock delete response
    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
      data: { id },
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}