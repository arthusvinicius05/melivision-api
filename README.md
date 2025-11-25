# Meli Vision NestJS API Integration

NestJS application that integrates with the Mercado Libre API. This project implements OAuth 2.0 authentication, comprehensive API endpoints, Swagger documentation, and follows NestJS best practices.

## 🚀 Features

- **OAuth 2.0 Authentication** - Complete authorization flow following ML best practices
- **Comprehensive API Coverage** - All major Mercado Libre API endpoints
- **Swagger Documentation** - Interactive API documentation at `/docs`
- **Type Safety** - Full TypeScript support with DTOs and validation
- **Error Handling** - Robust error handling with proper status codes
- **Rate Limiting** - Built-in throttling to respect API limits
- **Security** - Helmet, CORS, input validation
- **Modular Architecture** - Clean separation of concerns with modules
- **Production Ready** - Logger, config management, environment variables

## 📋 Prerequisites

- Node.js >= 18.x
- npm or yarn
- A Mercado Libre developer account and application

## 🔧 Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd melivision-nestjs-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and fill in your Mercado Libre credentials:

```env
# Get these from https://developers.mercadolibre.com/apps/
ML_CLIENT_ID=your_client_id_here
ML_CLIENT_SECRET=your_client_secret_here
ML_REDIRECT_URI=http://localhost:3000/api/auth/callback
ML_SITE_ID=MLB
```

### 4. Start the application

Development mode with hot reload:

```bash
npm run start:dev
```

Production mode:

```bash
npm run build
npm run start:prod
```

## 📚 Getting Your Mercado Libre Credentials

1. Go to [Mercado Libre Developers](https://developers.mercadolibre.com/)
2. Sign in with your Mercado Libre account
3. Navigate to "My Applications"
4. Create a new application
5. Configure the redirect URI to match your `.env` file
6. Copy the Client ID and Client Secret to your `.env` file

**Important:** The `ML_REDIRECT_URI` in your `.env` must exactly match the redirect URI configured in your ML application settings.

## 🔐 Authentication Flow

This API implements the OAuth 2.0 authorization code flow:

### 1. Get Authorization URL

```
GET /api/auth/authorize
```

Returns the URL to redirect your user to for authorization.

### 2. User Authorization

Redirect the user to the authorization URL. They will log in to Mercado Libre and grant permissions.

### 3. Handle Callback

```
GET /api/auth/callback?code=TG-xxxxx
```

The user is redirected back to your callback endpoint with an authorization code. The API automatically exchanges this code for an access token.

### 4. Make Authenticated Requests

Once authenticated, the API will automatically include the access token in all requests to Mercado Libre.

### 5. Token Refresh

The API automatically refreshes the token when it expires. You can also manually refresh:

```
POST /api/auth/refresh
{
  "refresh_token": "TG-xxxxx"
}
```

## 📖 API Documentation

Once the application is running, visit:

```
http://localhost:3000/docs
```

This provides interactive Swagger documentation where you can:

- Browse all available endpoints
- See request/response schemas
- Test API calls directly from the browser
- View detailed descriptions and examples

## 🛣️ API Endpoints

### Authentication

- `GET /api/auth/authorize` - Get authorization URL
- `GET /api/auth/login` - Redirect to ML login
- `GET /api/auth/callback` - OAuth callback
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/status` - Check auth status
- `POST /api/auth/logout` - Clear tokens

### Sites

- `GET /api/sites` - List all sites
- `GET /api/sites/:siteId` - Get site details
- `GET /api/sites/:siteId/categories` - Get site categories

### Locations

- `GET /api/countries` - List countries
- `GET /api/countries/:countryId` - Get country details
- `GET /api/countries/:countryId/states` - List states
- `GET /api/states/:stateId` - Get state details
- `GET /api/states/:stateId/cities` - List cities
- `GET /api/cities/:cityId` - Get city details

### Categories

- `GET /api/categories/:categoryId` - Get category details
- `GET /api/categories/:categoryId/children` - List subcategories
- `GET /api/categories/:categoryId/attributes` - Get category attributes
- `GET /api/categories/:categoryId/brands` - List category brands

### Search

- `GET /api/search/sites/:siteId` - Search products
- `GET /api/search/sites/:siteId/search_suggestions` - Get search suggestions
- `GET /api/search/products` - Search catalog products
- `GET /api/search/products/:productId` - Get catalog product

### Items

- `GET /api/items/:itemId` - Get item details
- `GET /api/items/:itemId/description` - Get item description
- `GET /api/items/:itemId/questions` - Get item questions
- `GET /api/items/:itemId/reviews` - Get item reviews
- `GET /api/items/:itemId/shipping_options` - Get shipping options

### Users

- `GET /api/users/:userId` - Get user info
- `GET /api/users/:userId/reputation` - Get user reputation
- `GET /api/users/:userId/items/search` - Search user items
- `GET /api/users/:userId/feedback` - Get user feedback
- `GET /api/users/:userId/listings` - Get user listings (auth required)
- `GET /api/users/me` - Get current user (auth required)

### Orders (Authentication Required)

- `GET /api/orders/received` - List received orders
- `GET /api/orders/received/:orderId` - Get order details
- `GET /api/orders/:orderId/shipments` - Get order shipments

### Messages (Authentication Required)

- `GET /api/messages/received` - List received messages
- `GET /api/messages/notifications` - Get notifications
- `GET /api/messages/bookmarks` - Get bookmarks

### Other

- `GET /api/currencies` - List currencies
- `GET /api/currencies/:currencyId` - Get currency details
- `GET /api/attributes` - List attributes
- `GET /api/attributes/:attributeId` - Get attribute details
- `GET /api/brands/:brandId` - Get brand details
- `GET /api/trends/:siteId` - Get trending searches
- `GET /api/health` - Health check

## 🎯 Usage Examples

### Example 1: Search for Products

```typescript
// Search for iPhones in Brazil
GET /api/search/sites/MLB?q=iPhone&condition=new&limit=10

// Filter by price range
GET /api/search/sites/MLB?q=iPhone&price_min=2000&price_max=5000

// Search with free shipping only
GET /api/search/sites/MLB?q=iPhone&shipping=free
```

### Example 2: Get Item Details

```typescript
// Get complete item information
GET /api/items/MLB123456789

// Get item description
GET /api/items/MLB123456789/description

// Get shipping options to a specific location
GET /api/items/MLB123456789/shipping_options?zip_code=01310-100
```

### Example 3: Get Seller Information

```typescript
// Get seller details
GET /api/users/123456789

// Get seller reputation
GET /api/users/123456789/reputation

// List all seller's products
GET /api/users/123456789/items/search?status=active&limit=50
```

## 🏗️ Architecture

```
src/
├── config/                 # Configuration files
│   └── configuration.ts    # Environment configuration
├── modules/
│   ├── auth/              # Authentication module
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   └── dto/           # Data Transfer Objects
│   └── mercadolibre/      # Mercado Libre API module
│       ├── controllers/   # API controllers
│       ├── mercadolibre.service.ts
│       └── mercadolibre.module.ts
├── app.module.ts          # Root module
├── main.ts                # Application entry point
└── health.controller.ts   # Health check endpoint
```

## 🔒 Security Best Practices

Following Mercado Libre's security recommendations:

1. **State Parameter** - Always validate the state parameter in OAuth flow
2. **Token Storage** - Never expose tokens in logs or client-side code
3. **Token Refresh** - Implement automatic token refresh before expiration
4. **Input Validation** - All inputs are validated using class-validator
5. **Rate Limiting** - Respects API rate limits with throttling
6. **HTTPS** - Always use HTTPS in production
7. **Environment Variables** - Sensitive data in environment variables only

## ⚠️ Important ML API Considerations

### Rate Limits

- Mercado Libre enforces rate limits (429 error)
- The API includes built-in throttling
- For high-volume applications, implement request queuing

### Pagination

- Most list endpoints support `limit` and `offset` parameters
- For searches over 1000 results, use `search_type=scan`
- Don't use `offset` with `search_type=scan`

### Token Expiration

- Access tokens expire after 6 hours (21600 seconds)
- Refresh tokens to extend expiration
- The API automatically handles token refresh

### Authentication Requirements

- Some endpoints require authentication (marked in Swagger)
- Public endpoints work without authentication
- Private resources need a valid access token

## 🐛 Troubleshooting

### "Invalid Client ID/Secret"

- Verify your credentials in `.env` match your ML application
- Ensure no extra spaces or quotes in environment variables

### "Redirect URI Mismatch"

- The redirect URI in `.env` must exactly match your ML app settings
- Check for trailing slashes and http vs https

### "Token Expired"

- The API should auto-refresh, but you can manually refresh
- Use POST /api/auth/refresh with your refresh_token

### "Rate Limit Exceeded (429)"

- Wait before making more requests
- Implement exponential backoff in your client
- Consider caching frequently accessed data

## 📝 Development

### Running Tests

```bash
npm run test
npm run test:watch
npm run test:cov
```

### Linting

```bash
npm run lint
npm run format
```

### Building

```bash
npm run build
```

## 🚀 Deployment

1. Set `NODE_ENV=production` in your environment
2. Configure proper `ML_REDIRECT_URI` for your domain
3. Use strong `SESSION_SECRET`
4. Enable HTTPS
5. Set up proper logging and monitoring
6. Consider using a database for token storage in production

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📚 Additional Resources

- [Mercado Libre API Documentation](https://developers.mercadolibre.com/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [OAuth 2.0 Specification](https://oauth.net/2/)

## ⚡ Quick Start Guide

1. Get ML credentials from https://developers.mercadolibre.com/
2. Copy `.env.example` to `.env` and fill in your credentials
3. Run `npm install`
4. Run `npm run start:dev`
5. Visit http://localhost:3000/docs
6. Click "GET /api/auth/login" to authenticate
7. Start making API calls!

## 💡 Tips

- Use the Swagger UI at `/docs` to explore and test endpoints
- Check the health endpoint at `/api/health` to verify the API is running
- Review logs for debugging authentication issues
- Store tokens securely in production (database, Redis, etc.)
- Implement webhook handlers for real-time updates from ML

---

Built with ❤️ using NestJS and following Mercado Libre API best practices.
