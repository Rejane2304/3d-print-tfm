# Use Cases - 3D Print TFM

## 👤 Customer Use Cases

### UC-001: Register
**Actor**: Potential Customer
**Description**: Create a new account
**Preconditions**: Not logged in
**Main Flow**:
1. User accesses /auth (register tab)
2. Completes: name, email, password, confirmPassword
3. System validates data (Zod)
4. System verifies unique email
5. System creates user (bcrypt hash)
6. System displays success message and switches to login tab

**Alternative Flows**:
- Duplicate email: Display error
- Weak password: Display requirements
- Empty fields: HTML5 validation
- Old URLs (/register): Redirect to /auth?tab=register

**Postconditions**: User created in DB

---

### UC-002: Log In
**Actor**: Registered User
**Description**: Authenticate in the system
**Preconditions**: Have an account
**Main Flow**:
1. User accesses /auth (login tab)
2. Enters email and password
3. System verifies credentials
4. System creates session (JWT)
5. Redirect to previous page or home

**Alternative Flows**:
- Invalid credentials: Display error
- Unverified account: Appropriate message
- ADMIN user: Redirect to /admin/dashboard
- Old URLs (/login): Redirect to /auth

**Postconditions**: Active session

---

### UC-003: Browse Catalog
**Actor**: Any user
**Description**: View available products
**Main Flow**:
1. Accesses /productos
2. Sees paginated product grid
3. Applies filters (category, material, price)
4. Sorts by price or newest
5. Selects product for detail

**Alternative Flows**:
- No results: "No products" message
- Loading error: Automatic retry

---

### UC-004: Add to Cart
**Actor**: Authenticated user
**Description**: Save product for purchase
**Preconditions**: Be logged in
**Main Flow**:
1. On product detail, selects quantity
2. Click "Add to cart"
3. System checks stock
4. System updates cart in DB
5. Visual success notification

**Alternative Flows**:
- Insufficient stock: Display maximum available quantity
- Product already in cart: Increment quantity

---

### UC-005: Checkout
**Actor**: User with items in cart
**Description**: Complete purchase
**Preconditions**: Items in cart, be logged in
**Main Flow**:
1. Goes to /carrito
2. Reviews items and totals
3. Proceeds to checkout
4. Selects shipping address
5. Reviews order summary
6. Click "Pay with Stripe"
7. Redirect to Stripe Checkout
8. Completes payment in Stripe
9. Webhook confirms payment
10. System creates CONFIRMED order
11. Redirect to /checkout/success

**Alternative Flows**:
- Failed payment: Return to checkout with error
- Cancel in Stripe: Order PENDING (waiting)
- Out of stock: Alert and remove item

**Postconditions**: Order created, payment processed

---

### UC-006: View Order History
**Actor**: Customer
**Description**: Check previous orders
**Main Flow**:
1. Accesses /cuenta/pedidos
2. Sees ordered list of orders
3. Click on order for detail
4. Sees: products, status, tracking, total

---

### UC-007: Edit Profile
**Actor**: Customer
**Description**: Update personal data
**Main Flow**:
1. Goes to /cuenta/perfil
2. Modifies: name, phone, NIF
3. Saves changes
4. System validates (Zod)
5. Updates DB
6. Confirms success

**Alternative Flows**:
- Change password: Requires current password

---

## 👔 Administrator Use Cases

### UC-101: Metrics Dashboard
**Actor**: Admin
**Description**: View business summary
**Main Flow**:
1. Login as admin
2. Redirect to /admin/dashboard
3. Sees widgets: today's orders, monthly sales, low stock, alerts
4. Quick access to sections

---

### UC-102: Create Product
**Actor**: Admin
**Description**: Add new product to catalog
**Main Flow**:
1. Goes to /admin/productos/nuevo
2. Completes form:
   - Name, description
   - Category, material
   - Price, stock
   - Dimensions, weight
   - Images
3. System validates
4. Generates automatic slug
5. Saves in DB
6. Product visible in store

---

### UC-103: Manage Orders
**Actor**: Admin
**Description**: Update order status
**Main Flow**:
1. Goes to /admin/pedidos
2. Sees list with filters (status, date)
3. Click on order for detail
4. Updates status:
   - PENDING → CONFIRMED
   - CONFIRMED → PREPARING
   - PREPARING → SHIPPED (+tracking)
   - SHIPPED → DELIVERED
5. Customer receives notification

**Alternative Flows**:
- Cancel order: Only if PENDING or CONFIRMED

---

### UC-104: Generate Invoice
**Actor**: Admin
**Description**: Create invoice for delivered order
**Preconditions**: Order DELIVERED
**Main Flow**:
1. Goes to order detail
2. Click "Generate Invoice"
3. System verifies order delivered
4. Generates number F-2026-NNNNNN
5. Calculates 21% VAT
6. Saves invoice in DB
7. Generates PDF (HTML)
8. Shows preview
9. Option to download PDF

---

### UC-105: Respond to Alerts
**Actor**: Admin
**Description**: Manage system alerts
**Main Flow**:
1. Sees alert notification
2. Goes to /admin/alertas
3. Filters by: type, severity, status
4. Click on alert for detail
5. Marks as "In progress" or "Resolved"
6. Adds resolution notes
7. If low stock: Restock

**Alert Types**:
- LOW_STOCK: Product below minimum
- UNPAID_ORDER: >24h without payment
- SYSTEM_ERROR: Webhook failure, etc.

---

### UC-106: Messaging with Customer
**Actor**: Admin
**Description**: Chat in orders
**Main Flow**:
1. Goes to order detail
2. Sees messages section
3. Writes message to customer
4. Marks "isAdmin: true"
5. Customer receives notification
6. Customer responds
7. Cycle continues until resolution

---

## 🔒 System Use Cases

### UC-201: Generate Low Stock Alert
**Actor**: System (automatic)
**Description**: Detect and notify low stock
**Trigger**: Stock < stockMinimo
**Flow**:
1. Check stock periodically
2. If stock < minimum:
3. Create LOW_STOCK alert
4. Notify admin on dashboard
5. Show in alerts list

---

### UC-202: Process Stripe Webhook
**Actor**: System
**Description**: Confirm payments
**Trigger**: Stripe event
**Flow**:
1. Receives POST /api/webhooks/stripe
2. Verifies webhook signature
3. Processes event:
   - checkout.session.completed
   - payment_intent.succeeded
4. Updates payment status
5. Updates order status
6. Sends confirmation email

---

### UC-203: Authorization Middleware
**Actor**: System
**Description**: Protect routes
**Flow**:
1. User requests protected route
2. Middleware verifies session
3. If not authenticated → /auth
4. If authenticated, verifies role:
   - Route /admin → ADMIN only
   - Route /carrito → No ADMIN (redirect)
5. If authorized → Continue

---

## 📊 Actors vs Use Cases Matrix

| Use Case | Customer | Admin | System |
|----------|----------|-------|--------|
| UC-001 Registration | ✅ | ❌ | ❌ |
| UC-002 Login | ✅ | ✅ | ❌ |
| UC-003 Browse | ✅ | ✅ | ❌ |
| UC-004 Cart | ✅ | ❌ | ❌ |
| UC-005 Checkout | ✅ | ❌ | ❌ |
| UC-006 History | ✅ | ❌ | ❌ |
| UC-007 Profile | ✅ | ❌ | ❌ |
| UC-101 Dashboard | ❌ | ✅ | ❌ |
| UC-102 Products | ❌ | ✅ | ❌ |
| UC-103 Orders | ❌ | ✅ | ❌ |
| UC-104 Invoices | ❌ | ✅ | ❌ |
| UC-105 Alerts | ❌ | ✅ | ❌ |
| UC-106 Messages | ✅ | ✅ | ❌ |
| UC-201 Stock | ❌ | ❌ | ✅ |
| UC-202 Webhook | ❌ | ❌ | ✅ |
| UC-203 Auth | ❌ | ❌ | ✅ |

**Total**: 16 main use cases

## 🔄 Recent Changes (Auth Unification)

### 2026-04-01: Login/Register Unification
- **Before**: Separate pages `/login` and `/register`
- **Now**: Unified page `/auth` with tabs
- **Benefits**:
  - Improved UX (instant switch between login/register)
  - Shared email between tabs
  - More maintainable code
  - Modern header with icons
- **Compatibility**: Old URLs redirect to `/auth`
- **Tests**: 96 E2E tests updated and passing

---

## ✅ Acceptance Criteria

### For each Use Case

- [ ] Main flow documented
- [ ] Alternative flows identified
- [ ] Pre/post conditions defined
- [ ] E2E tests implemented
- [ ] Integration tests passing
- [ ] Complete Zod validation

**Status**: ✅ 16/16 use cases implemented and tested
