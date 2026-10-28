const apiDocumentation = {
  openapi: '3.0.0',
  info: {
    title: 'Cabbage API',
    version: '1.0.0',
    description: 'Authentication, catalog, product, and administration endpoints.',
  },
  servers: [{ url: 'http://localhost:5000' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  paths: {
    '/api/v1/user/categories': {
      get: { tags: ['Catalog'], summary: 'List active categories', responses: { 200: { description: 'Categories' } } },
    },
    '/api/v1/user/products': {
      get: { tags: ['Products'], summary: 'List approved products', responses: { 200: { description: 'Products and pagination' } } },
    },
    '/api/v1/user/products/{id}': {
      get: {
        tags: ['Products'],
        summary: 'Get an approved product by ID or slug',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Product' }, 404: { description: 'Product not found' } },
      },
    },
    '/api/v1/vendor/create/category': {
      post: {
        tags: ['Vendor catalog'],
        summary: 'Create a category for review',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' } } } } } },
        responses: { 201: { description: 'Category created' }, 401: { description: 'Authentication required' } },
      },
    },
    '/api/v1/vendor/create/subcategory': {
      post: {
        tags: ['Vendor catalog'],
        summary: 'Create a subcategory for review',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name', 'parentCategory'], properties: { name: { type: 'string' }, parentCategory: { type: 'string' } } } } } },
        responses: { 201: { description: 'Subcategory created' }, 401: { description: 'Authentication required' } },
      },
    },
    '/api/v1/vendor/products/create': {
      post: {
        tags: ['Vendor products'],
        summary: 'Create a product for review',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', required: ['title', 'price', 'category', 'subCategory'], properties: { title: { type: 'string' }, price: { type: 'number' }, category: { type: 'string' }, subCategory: { type: 'string' }, images: { type: 'array', items: { type: 'string', format: 'binary' } } } } } } },
        responses: { 201: { description: 'Product created' }, 401: { description: 'Authentication required' } },
      },
    },
    '/api/v1/vendor/products/{id}': {
      delete: {
        tags: ['Vendor products'],
        summary: 'Delete an owned product',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Product deleted' }, 404: { description: 'Product not found' } },
      },
    },
    '/api/v1/admin/products/{id}/status': {
      patch: {
        tags: ['Administration'],
        summary: 'Approve or reject a product',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['pending', 'approved', 'rejected'] } } } } } },
        responses: { 200: { description: 'Product review updated' }, 401: { description: 'Authentication required' } },
      },
    },
  },
}

module.exports = apiDocumentation