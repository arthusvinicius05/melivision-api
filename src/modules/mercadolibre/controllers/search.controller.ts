import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { MercadolibreService } from '../mercadolibre.service';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly mlService: MercadolibreService) {}

  @Get('sites/:siteId')
  @ApiOperation({
    summary: 'Search products',
    description:
      'Search for products/items in Mercado Libre. ' +
      'This is the main search endpoint that supports various filters. ' +
      'Note: For searches over 1000 results, use search_type=scan parameter.',
  })
  @ApiParam({
    name: 'siteId',
    description: 'Site ID to search in',
    example: 'MLB',
  })
  @ApiQuery({
    name: 'q',
    description: 'Search query (keywords)',
    required: false,
    example: 'iPhone 13',
  })
  @ApiQuery({
    name: 'category',
    description: 'Filter by category ID',
    required: false,
    example: 'MLB1051',
  })
  @ApiQuery({
    name: 'seller_id',
    description: 'Filter by seller ID',
    required: false,
    example: '123456789',
  })
  @ApiQuery({
    name: 'official_store_id',
    description: 'Filter by official store ID',
    required: false,
  })
  @ApiQuery({
    name: 'price_min',
    description: 'Minimum price',
    required: false,
    example: 100,
  })
  @ApiQuery({
    name: 'price_max',
    description: 'Maximum price',
    required: false,
    example: 5000,
  })
  @ApiQuery({
    name: 'shipping',
    description: 'Filter by shipping type (e.g., "free" for free shipping)',
    required: false,
    example: 'free',
  })
  @ApiQuery({
    name: 'condition',
    description: 'Filter by condition ("new" or "used")',
    required: false,
    example: 'new',
  })
  @ApiQuery({
    name: 'sort',
    description: 'Sort results (e.g., "price_asc", "price_desc")',
    required: false,
    example: 'price_asc',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of results per page (max 50)',
    required: false,
    example: 50,
  })
  @ApiQuery({
    name: 'offset',
    description: 'Results offset for pagination',
    required: false,
    example: 0,
  })
  @ApiQuery({
    name: 'search_type',
    description: 'Search type ("scan" for results over 1000)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Search results',
    schema: {
      type: 'object',
      properties: {
        site_id: { type: 'string', example: 'MLB' },
        query: { type: 'string', example: 'iPhone 13' },
        paging: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 1500 },
            limit: { type: 'number', example: 50 },
            offset: { type: 'number', example: 0 },
          },
        },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              price: { type: 'number' },
              thumbnail: { type: 'string' },
            },
          },
        },
        available_sorts: { type: 'array' },
        available_filters: { type: 'array' },
      },
    },
  })
  async searchProducts(
    @Param('siteId') siteId: string,
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('seller_id') sellerId?: string,
    @Query('official_store_id') officialStoreId?: string,
    @Query('price_min') priceMin?: number,
    @Query('price_max') priceMax?: number,
    @Query('shipping') shipping?: string,
    @Query('condition') condition?: string,
    @Query('sort') sort?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('search_type') searchType?: string,
  ) {
    const params: any = {};

    if (q) params.q = q;
    if (category) params.category = category;
    if (sellerId) params.seller_id = sellerId;
    if (officialStoreId) params.official_store_id = officialStoreId;
    if (priceMin) params.price_min = priceMin;
    if (priceMax) params.price_max = priceMax;
    if (shipping) params.shipping = shipping;
    if (condition) params.condition = condition;
    if (sort) params.sort = sort;
    if (limit) params.limit = limit;
    if (offset !== undefined) params.offset = offset;
    if (searchType) params.search_type = searchType;

    return this.mlService.get(`/sites/${siteId}/search`, params);
  }

  @Get('sites/:siteId/search_suggestions')
  @ApiOperation({
    summary: 'Get search suggestions',
    description: 'Returns search query suggestions based on partial input',
  })
  @ApiParam({
    name: 'siteId',
    description: 'Site ID',
    example: 'MLB',
  })
  @ApiQuery({
    name: 'q',
    description: 'Partial search query',
    required: true,
    example: 'ipho',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of suggestions',
    required: false,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Search suggestions',
    schema: {
      type: 'object',
      properties: {
        suggested_queries: { type: 'array', items: { type: 'object' } },
      },
    },
  })
  async getSearchSuggestions(
    @Param('siteId') siteId: string,
    @Query('q') q: string,
    @Query('limit') limit?: number,
  ) {
    const params: any = { q };
    if (limit) params.limit = limit;

    return this.mlService.get(`/sites/${siteId}/autosuggest`, params);
  }

  @Get('products')
  @ApiOperation({
    summary: 'Search catalog products',
    description:
      'Search for products in the Mercado Libre catalog. ' +
      'The catalog contains products created by ML with complete datasheets.',
  })
  @ApiQuery({
    name: 'site_id',
    description: 'Site ID',
    required: true,
    example: 'MLB',
  })
  @ApiQuery({
    name: 'q',
    description: 'Search query with product details',
    required: false,
    example: 'Samsung Galaxy S21 64GB Black',
  })
  @ApiQuery({
    name: 'product_identifier',
    description: 'Product identifier (GTIN, EAN, UPC, ISBN)',
    required: false,
    example: '7891234567890',
  })
  @ApiQuery({
    name: 'domain_id',
    description: 'Domain ID to filter results',
    required: false,
  })
  @ApiQuery({
    name: 'status',
    description: 'Product status filter',
    required: false,
    example: 'active',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of results',
    required: false,
    example: 20,
  })
  @ApiQuery({
    name: 'offset',
    description: 'Results offset',
    required: false,
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Product search results from catalog',
  })
  async searchCatalogProducts(
    @Query('site_id') siteId: string,
    @Query('q') q?: string,
    @Query('product_identifier') productIdentifier?: string,
    @Query('domain_id') domainId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const params: any = { site_id: siteId };

    if (q) params.q = q;
    if (productIdentifier) params.product_identifier = productIdentifier;
    if (domainId) params.domain_id = domainId;
    if (status) params.status = status;
    if (limit) params.limit = limit;
    if (offset !== undefined) params.offset = offset;

    return this.mlService.get('/products/search', params);
  }

  @Get('products/:productId')
  @ApiOperation({
    summary: 'Get catalog product details',
    description: 'Returns detailed information about a catalog product',
  })
  @ApiParam({
    name: 'productId',
    description: 'Product ID from catalog',
    example: 'MLB123456',
  })
  @ApiResponse({
    status: 200,
    description: 'Catalog product details',
  })
  async getProduct(@Param('productId') productId: string) {
    return this.mlService.get(`/products/${productId}`);
  }
}
