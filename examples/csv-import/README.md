# CSV Import Examples

This directory contains sample CSV files for importing data into the admin panel.

## Available Imports

### 1. Clients Import

**API Endpoint:** `POST /api/admin/clients/import`

**Required Columns:**

- `email` - Unique email address
- `name` - Full name

**Optional Columns:**

- `role` - Either `CUSTOMER` or `ADMIN` (default: `CUSTOMER`)
- `phone` - Phone number

**Sample:** See `clients-sample.csv`

---

### 2. Orders Import

**API Endpoint:** `POST /api/admin/orders/import`

**Required Columns:**

- `userEmail` - Email of existing user (will create if `createMissingUsers: true`)
- `items` - JSON array with productId and quantity: `[{"productId":"uuid","quantity":2}]`

**Optional Columns:**

- `status` - Order status: `PENDING`, `CONFIRMED`, `PREPARING`, `SHIPPED`, `DELIVERED`, `CANCELLED` (default: `DELIVERED`)
- `shippingCost` - Shipping cost (default: 0)
- `paymentMethod` - `CARD`, `PAYPAL`, `BIZUM`, `TRANSFER` (default: `CARD`)
- `customerNotes` - Notes for the order

**Options:**

- `createMissingUsers: true` - Create users that don't exist

**Sample:** See `orders-sample.csv`

---

### 3. Coupons Import

**API Endpoint:** `POST /api/admin/coupons/import`

**Required Columns:**

- `code` - Unique coupon code
- `type` - `PERCENTAGE`, `FIXED`, or `FREE_SHIPPING`
- `value` - Discount value (percentage or fixed amount)
- `validFrom` - Start date (ISO format: YYYY-MM-DD)
- `validUntil` - End date (ISO format: YYYY-MM-DD)

**Optional Columns:**

- `maxUses` - Maximum number of uses (default: unlimited)
- `minOrderAmount` - Minimum order amount required (default: none)
- `isActive` - `true` or `false` (default: `true`)

**Sample:** See `coupons-sample.csv`

---

## General Options

All imports support:

- **Preview** - Shows first 10 rows before import
- **Validation** - Checks required columns and data types
- **Error reporting** - Lists errors with row numbers
- **Warnings** - Shows non-critical issues
- **Skip duplicates** - Option to skip existing records

## Authentication

All import endpoints require:

1. Active user session
2. ADMIN role

## Response Format

```json
{
  "success": true|false,
  "imported": 42,
  "errors": [{ "row": 5, "message": "Email already exists" }],
  "warnings": [{ "row": 10, "message": "User created automatically" }],
  "message": "42 clients imported successfully"
}
```
