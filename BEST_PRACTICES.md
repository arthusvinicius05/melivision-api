# Mercado Libre API Best Practices & Guidelines

This document covers important best practices and considerations when working with the Mercado Libre API based on official documentation.

## 🔐 Authentication & Authorization

### OAuth 2.0 Flow

Mercado Libre uses OAuth 2.0 protocol for authentication. It's recommended to generate a secure random value and send it as a state parameter to increase security in the token acquisition process.

**Best Practices:**
1. Always validate the state parameter when receiving the callback
2. Remember that the redirect_uri must match exactly what is registered in your application settings
3. Never expose your client_secret in client-side code
4. Store tokens securely (never in localStorage or client-side)

### Token Management

Tokens can be invalidated before expiration if the user changes their password or if there's an internal revocation (device unlinkage, fraud detection).

**Important Considerations:**
- Access tokens and refresh tokens will be invalidated if authorization between the seller's account and your application is revoked
- Implement automatic token refresh before expiration
- Handle 401 errors gracefully and re-authenticate
- The user that logs in must be a manager account, not an operator/partner, to obtain an access_token with sufficient permissions

### Common Authentication Errors

Understanding error codes helps troubleshoot authentication issues:

- `invalid_client`: Invalid client_id and/or client_secret
- `invalid_grant`: Authorization grant is invalid, expired, or revoked
- `invalid_scope`: Requested scope is invalid (valid values: "offline_access", "write", "read")
- `invalid_request`: Missing required parameter or malformed request
- `invalid_operator_user_id`: User is an operator/collaborator and cannot grant the application

## 🔍 Search & Items API

### Search Best Practices

For public resources of Items and Searches, the "sold_quantity" and "available_quantity" fields will show referential values.

**Endpoint Types:**
- **Public resource** (`/sites/{site_id}/search`): Get results of active items from ML listings
- **Private resource** (`/users/{user_id}/items/search`): Get items published by a specific seller

### Searching Over 1000 Results

For searches over 1000 records in Items or Questions APIs, you must send the parameter search_type=scan and not use the offset parameter.

**Correct Usage:**
```
GET /users/USER_ID/items/search?search_type=scan
```

### Search by Seller

You can search for items by seller_id or by nickname if you don't know the seller_id:

```
GET /sites/SITE_ID/search?seller_id=SELLER_ID
GET /sites/SITE_ID/search?nickname=NICKNAME
```

### Search Filters

Check the "available_filters" and "available_sorts" fields in search results to see available filtering and sorting options.

Common filters:
- `shipping=free` - Free shipping items
- `condition=new|used` - Item condition
- `price_min` and `price_max` - Price range
- `reputation_health_gauge=unhealthy|warning|healthy` - Items reputation status

## 📦 Products & Catalog

### Catalog Products

For an item to be published in the catalog, it must be associated with a catalog product (PDP - Product Detail Page). Catalog products are created by Mercado Libre with complete datasheets so buyers know precisely what they're buying.

**Product Types:**
- **Parent products**: Superior level products that group specific products but are not suitable to be purchased themselves (e.g., "Motorola Moto G6" without capacity or color specified)
- **Children products**: Specific products that can be used to publish and buy if active

### Product Search

When searching products, you must enter at least 3 different attributes in the attributes field, and all attributes must have an id (attribute id) and a value_id or value_name.

**Search Parameters:**
- `product_identifier`: GTIN (EAN, UPC, ISBN) - mandatory if not sending q
- `q`: String with search keywords including attribute details
- `domain_id`: Domain where you want to publish
- `site_id`: Required parameter

## 🛡️ Security Requirements

### Input Validation

All input validations performed client-side must also be performed server-side, as users can bypass client-side validations.

**Validation Types:**
- **Syntactic validation**: Value is correctly formed for expected data type
- **Semantic validation**: Value makes sense in the business context

### Best Practices:
1. Use typecasting for primitive data types
2. Implement regular expressions for specific parameters
3. Parameterize database queries to prevent SQL injection
4. Use encoding or sanitization for parameters returned to frontend

## 🚦 Rate Limiting

Mercado Libre enforces rate limits. Error code 429 (local_rate_limited) indicates excessive calls.

**Best Practices:**
- Implement exponential backoff
- Cache frequently accessed data
- Use webhooks instead of polling when possible
- Monitor your API usage

## 🔔 Webhooks & Notifications

Always validate the origin of notifications to ensure they're from Mercado Libre, and check URLs when receiving notifications to make sure the resources are valid.

**Security Measures:**
1. Validate notification signatures
2. Verify the resource URLs before accessing them
3. Implement idempotency to handle duplicate notifications
4. Use HTTPS endpoints for webhooks

## 📊 Item Quality & Attributes

### Required Attributes

Use the /categories/{category_id}/attributes endpoint to learn which fields are required when creating an item in a specific category.

### SKU Management

You can search items by SKU in two ways:
- `seller_custom_field`: SKU in the "seller_custom_field" field
- `seller_sku`: SKU in the "SELLER_SKU" attribute

## 🏪 User & Seller Information

### Account Types

Only manager accounts can grant application permissions. Operator/partner accounts will return invalid_operator_user_id error.

### Reputation

Access seller reputation data to understand:
- Power seller status
- Transaction history
- Customer ratings
- Dispute history

## 🚚 Orders & Shipping

### Order Access

Orders require authentication and proper permissions. You can only access:
- Orders where you're the seller
- Your own purchase orders
- Orders with proper scope permissions

### Shipment Information

Use the shipments endpoint to:
- Track package status
- Get shipping labels
- Calculate shipping costs
- Manage fulfillment

## 💡 Common Patterns & Tips

### 1. Progressive Data Loading
- Load essential data first
- Use pagination for large datasets
- Implement lazy loading for details

### 2. Error Handling
```typescript
try {
  const result = await apiCall();
  return result;
} catch (error) {
  if (error.status === 401) {
    // Refresh token and retry
  } else if (error.status === 429) {
    // Implement backoff and retry
  } else {
    // Log and handle other errors
  }
}
```

### 3. Data Caching
- Cache static data (categories, attributes)
- Set appropriate TTL for cached data
- Implement cache invalidation strategy

### 4. Monitoring & Logging
- Log all authentication events
- Monitor token refresh rates
- Track API error rates
- Set up alerts for rate limit warnings

## 🔗 Official Resources

- [Mercado Libre Developer Portal](https://developers.mercadolibre.com/)
- [API Documentation](https://developers.mercadolibre.com/en_us/api-docs)
- [Authentication Guide](https://developers.mercadolibre.com/en_us/authentication-and-authorization)
- [Security Best Practices](https://developers.mercadolibre.com/en_us/security-requirements-and-validations)

## 📋 Checklist for Production

- [ ] Implement proper token storage (database/Redis)
- [ ] Set up webhook endpoints with signature validation
- [ ] Implement comprehensive error handling
- [ ] Add request/response logging
- [ ] Configure rate limiting and backoff strategies
- [ ] Set up monitoring and alerting
- [ ] Use HTTPS for all connections
- [ ] Implement data caching strategy
- [ ] Test token refresh flow
- [ ] Validate all user inputs
- [ ] Set up proper environment configuration
- [ ] Implement retry logic for transient errors
- [ ] Document your integration
- [ ] Test with Mercado Libre sandbox environment
- [ ] Handle all possible error codes gracefully

## 🎯 Performance Optimization

1. **Batch Requests**: Use bulk endpoints when available
2. **Parallel Requests**: Make independent requests in parallel
3. **Compression**: Enable gzip compression
4. **Connection Pooling**: Reuse HTTP connections
5. **Caching**: Cache immutable or slowly-changing data

## 🧪 Testing Recommendations

1. Use test users provided by Mercado Libre
2. Test the complete OAuth flow
3. Test token refresh scenarios
4. Test error handling for all error codes
5. Test rate limiting behavior
6. Validate webhook signature verification
7. Test with expired tokens
8. Test concurrent request handling

---

Remember: Always refer to the [official Mercado Libre documentation](https://developers.mercadolibre.com/) for the most up-to-date information and requirements.
