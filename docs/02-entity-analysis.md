# Entity Analysis - 3D Print TFM

## 📊 Data Model

### Entity Overview

The system has **18 main models** organized into 4 functional categories:

```
┌─────────────────────────────────────────┐
│           USERS & AUTH                │
├─────────────────────────────────────────┤
│ • User                                  │
│ • Account (NextAuth)                    │
│ • Session                               │
│ • VerificationToken                     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│           CATALOG & SHOP                │
├─────────────────────────────────────────┤
│ • Product                               │
│ • Category                              │
│ • Material                              │
│ • Stock/Movements                       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│           PURCHASES & PAYMENTS          │
├─────────────────────────────────────────┤
│ • Cart                                  │
│ • CartItem                              │
│ • Order                                 │
│ • OrderDetail                           │
│ • Payment                               │
│ • Invoice                               │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│           ADMIN & LOGS                  │
├─────────────────────────────────────────┤
│ • Address                               │
│ • Alert                                 │
│ • OrderMessage                          │
│ • AuditLog                              │
│ • InventoryMovement                     │
└─────────────────────────────────────────┘
```

---

## 👤 USER ENTITIES

### User
**Purpose**: System user management

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| email | String | Unique email for login |
| password | String | Bcrypt password hash |
| name | String | Full name |
| role | Enum | CUSTOMER / ADMIN |
| nif | String | Spanish NIF (billing) |
| phone | String | Contact phone |
| active | Boolean | Account status |
| emailVerified | DateTime | Email verification |
| createdAt | DateTime | Registration date |

**Relations**:
- One-to-many: Orders, Invoices, Addresses, Alerts
- One-to-one: Account (NextAuth)

**Business Rules**:
- Email must be unique
- Default role: CUSTOMER
- NIF validated (Spanish format: 8 digits + letter)

---

## 🛍️ CATALOG ENTITIES

### Product
**Purpose**: 3D printed product catalog

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| name | String | Product name |
| slug | String | Unique SEO-friendly URL |
| description | String | Long description |
| shortDescription | String | Summary (140 chars) |
| price | Decimal | Price in EUR |
| stock | Int | Available units |
| minStock | Int | Low stock alert threshold |
| sku | String | Unique product code |
| category | Enum | DECORATION / TECHNICAL / JEWELRY / ART / HOME |
| material | Enum | PLA / PETG / ABS / FLEX / RESIN |
| color | String | Available color |
| printTime | Int | Estimated minutes |
| weight | Decimal | Filament grams |
| dimensions | Json | {length, width, height} |
| images | Json | Array of URLs |
| active | Boolean | Visible in store |
| featured | Boolean | Appears on home |

**Relations**:
- One-to-many: CartItems, OrderDetail, InventoryMovements, Alerts
- Many-to-one: Category (implicit), Material (implicit)

**Business Rules**:
- Unique, SEO-friendly slug
- Stock cannot be negative
- Price > 0
- Main image required

---

### Material
**Purpose**: Available filament types

| Field | Type | Description |
|-------|------|-------------|
| type | Enum | PLA / PETG / ABS / FLEX / RESIN |
| name | String | Commercial name |
| description | String | Features |
| pricePerKg | Decimal | Cost per kg |
| biodegradable | Boolean | Eco-friendly |
| temperature | Int | Print temp (°C) |

**Supported Materials**:
- **PLA**: Biodegradable, easy to print, many colors
- **PETG**: Resistant, transparent, food-safe
- **ABS**: Impact resistant, high temp
- **FLEX**: Flexible, TPU
- **RESIN**: High quality, fine detail

---

## 🛒 PURCHASE ENTITIES

### Cart
**Purpose**: Temporary shopping cart

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Identifier |
| userId | UUID | Cart owner |
| sessionId | String | For anonymous users |
| items | Relation | Products in cart |
| createdAt | DateTime | Creation date |
| updatedAt | DateTime | Last modification |

**Business Rules**:
- One cart per user
- Items expire after 30 days
- Stock checked at checkout

---

### Order
**Purpose**: Completed purchase record

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| orderNumber | String | P-20260001 (sequential) |
| userId | UUID | Customer |
| status | Enum | PENDING / CONFIRMED / PREPARING / SHIPPED / DELIVERED / CANCELLED |
| subtotal | Decimal | Item sum |
| shipping | Decimal | Shipping cost |
| total | Decimal | Total to pay |
| shippingName | String | Recipient |
| shippingAddress | String | Full address |
| shippingPhone | String | Contact phone |
| paymentMethod | Enum | CARD / TRANSFER |
| notes | String | Special instructions |
| createdAt | DateTime | Order date |

**Relations**:
- Many-to-one: User
- One-to-many: OrderDetail, Payment, Invoice, Messages

**Lifecycle**:
```
PENDING → CONFIRMED → PREPARING → SHIPPED → DELIVERED
     ↓
CANCELLED (at any point)
```

---

### Payment
**Purpose**: Payment transaction record

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Identifier |
| orderId | UUID | Associated order |
| stripeSessionId | String | Stripe reference |
| stripePaymentIntentId | String | Stripe payment ID |
| amount | Decimal | Amount paid |
| status | Enum | PENDING / COMPLETED / FAILED / REFUNDED |
| method | String | Card, transfer |
| receipt | String | Receipt URL |

---

### Invoice
**Purpose**: Spanish legal invoicing

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Identifier |
| invoiceNumber | String | F-2026-000001 (unique) |
| series | String | F (fixed) |
| number | Int | Sequential number |
| orderId | UUID | Invoiced order |
| companyName | String | Seller data |
| companyNif | String | B12345678 |
| customerName | String | Buyer data |
| customerNif | String | Customer NIF |
| baseAmount | Decimal | Subtotal |
| vatRate | Decimal | 21% (Spanish VAT) |
| vatAmount | Decimal | VAT amount |
| total | Decimal | Total with VAT |
| cancelled | Boolean | Cancelled invoice |
| pdfUrl | String | Generated PDF URL |

**Legal Format**:
- Numbering: F-YYYY-NNNNNN
- 21% VAT applicable
- Full issuer and receiver data
- Cannot be deleted (only cancelled)

---

## 📍 AUXILIARY ENTITIES

### Address
**Purpose**: Saved shipping addresses

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Identifier |
| userId | UUID | Owner |
| name | String | Title ("Home", "Office") |
| street | String | Full address |
| city | String | City |
| province | String | Province |
| zip | String | Postal code |
| country | String | Spain (default) |
| main | Boolean | Default address |

---

## 🔔 ADMIN ENTITIES

### Alert
**Purpose**: System notification system

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Identifier |
| type | Enum | LOW_STOCK / OUT_OF_STOCK / UNPAID_ORDER / LATE_ORDER / SYSTEM_ERROR |
| severity | Enum | LOW / MEDIUM / HIGH / CRITICAL |
| title | String | Short summary |
| message | String | Full description |
| productId | UUID | Related product (optional) |
| orderId | UUID | Related order (optional) |
| status | Enum | PENDING / IN_PROGRESS / RESOLVED / IGNORED |
| resolvedBy | UUID | Admin who resolved |
| resolvedAt | DateTime | Resolution date |
| resolutionNotes | String | Internal notes |

**Rules**:
- Automatically generated by the system
- Low stock: when stock < minStock
- Unpaid order: >24h since creation

---

### OrderMessage
**Purpose**: Chat between admin and customers in orders

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Identifier |
| orderId | UUID | Associated order |
| userId | UUID | Message author |
| message | String | Content (max 1000 chars) |
| fromCustomer | Boolean | true = customer, false = admin |
| attachments | Json | URLs of attached files |
| read | Boolean | Read status |
| readAt | DateTime | Read date |
| createdAt | DateTime | Sent date |

**Rules**:
- Only participants: admin and order owner
- Messages ordered by date
