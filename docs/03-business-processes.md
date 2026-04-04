# Business Processes - 3D Print TFM

## 🔄 Flow Diagrams

### 1. PURCHASE PROCESS (Customer Journey)

```
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: DISCOVERY                                           │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────┐
│   Entry      │  User arrives at the website
└──────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  Browse Catalog                   │
│  • View featured products         │
│  • Filter by category             │
│  • Search by name                 │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  Product Selection                │
│  • View details                   │
│  • View images                    │
│  • View specifications            │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  Add to Cart                      │
│  • Choose quantity                │
│  • Validate stock                 │
│  • Confirm addition               │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  CONTINUE SHOPPING?               │
│  ├─ YES → Return to catalog       │
│  └─ NO → Go to checkout           │
└──────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PHASE 2: CHECKOUT                                            │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  Review Cart                      │
│  • View items                     │
│  • Modify quantities              │
│  • Remove items                   │
│  • View totals                    │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  User Logged In?                  │
│  ├─ YES → Continue                │
│  └─ NO → Login/Register           │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  Select Address                   │
│  • Choose saved address           │
│  • Or create new address          │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  Confirm Order                    │
│  • Review summary                 │
│  • Accept terms                   │
│  • Proceed to payment             │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  PAYMENT WITH STRIPE              │
│  • Redirect to Stripe Checkout    │
│  • Enter card details             │
│  • Confirm payment                │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  Stripe Webhook                   │
│  • Payment confirmation           │
│  • Update order                   │
│  • Send email                     │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  ✅ ORDER CONFIRMED               │
│  • Display success page           │
│  • Order number                   │
│  • Next steps instructions        │
└──────────────────────────────────┘
```

---

### 2. PRODUCTION PROCESS (Admin)

```
┌─────────────────────────────────────────────────────────────┐
│  RECEIPT OF PAID ORDER                                        │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  Admin Dashboard                  │
│  • View notification              │
│  • View order detail              │
│  • Items to manufacture           │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  VALIDATE STOCK                   │
│  ├─ Sufficient stock              │
│  └─ Insufficient stock → Alert    │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  MARK: PREPARING                  │
│  • Customer receives notification │
│  • Estimated time: 1-3 days       │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  MANUFACTURING                    │
│  • Prepare G-code files           │
│  • Configure printer              │
│  • Print products                 │
│  • Post-processing (cleaning)     │
│  • Quality control                │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  PACKAGING                        │
│  • Protective packaging           │
│  • Add branding                   │
│  • Include instructions           │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  MARK: SHIPPED                    │
│  • Add tracking                   │
│  • Generate label                 │
│  • Deliver to courier             │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  Tracking                         │
│  • Customer sees tracking         │
│  • Status notifications           │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  MARK: DELIVERED                  │
│  • Reception confirmation         │
│  • Enable reviews                 │
│  • Close order                    │
└──────────────────────────────────┘
```

---

### 3. PRODUCT MANAGEMENT PROCESS

```
┌─────────────────────────────────────────────────────────────┐
│  CREATE NEW PRODUCT                                           │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  Admin Form                       │
│  • Name and description           │
│  • Select category                │
│  • Set price                      │
│  • Select material                │
│  • Upload images                  │
│  • Configure stock                │
│  • Set dimensions                 │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  VALIDATION                       │
│  ├─ Complete data                 │
│  │   ├─ Price > 0                  │
│  │   ├─ Stock ≥ 0                  │
│  │   └─ Main image                   │
│  └─ Error → Fix                   │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  GENERATE SLUG                    │
│  • Unique friendly URL            │
│  • Ex: "modern-phone-stand"       │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  CALCULATE COSTS                  │
│  • Filament grams                 │
│  • Printing time                  │
│  • Electricity cost               │
│  • Profit margin                  │
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  PUBLISH                          │
│  • Active product                 │
│  • Visible in catalog             │
│  • Indexed for SEO                │
└──────────────────────────────────┘
```

---

## 🎭 User vs Admin Processes

### User (Customer)

| Process | Interaction | Time |
|---------|-------------|--------|
| **Registration** | Form → Confirmation email | 2 min |
| **Browsing** | Browse → Filters → Detail | 1-5 min |
| **Add to cart** | Click → Quantity → Confirm | 30 sec |
| **Checkout** | Cart → Login → Address → Payment | 3-5 min |
| **Order tracking** | Login → My orders → Tracking | 1 min |
| **Contact support** | Order → Chat → Message | 2 min |

### Admin

| Process | Interaction | Time |
|---------|-------------|--------|
| **Manage order** | Dashboard → Order → Update status | 1-2 min |
| **Create product** | Form → Upload images → Publish | 10-15 min |
| **Manage stock** | Product → Adjust quantity → Save | 1 min |
| **View alerts** | Alerts → View detail → Resolve | 2 min |
| **Generate invoice** | Order → Create invoice → Download PDF | 1 min |
| **Reply to message** | Chat → Write → Send | 2 min |

---

## 📊 Process Metrics

### Conversion

| Step | Estimated Rate |
|------|----------------|
| Visit → Product view | 40% |
| Product view → Add to cart | 15% |
| Cart → Checkout | 60% |
| Checkout → Payment completed | 70% |
| **Total conversion** | **2.5%** |

### Response Times

| Process | Target | Maximum |
|---------|--------|---------|
| Page load | <2s | 3s |
| Filter products | <500ms | 1s |
| Add to cart | <200ms | 500ms |
| Stripe checkout | <3s | 5s |
| Generate PDF invoice | <2s | 5s |

---

## 🔄 States and Transitions

### Order

```
[PENDING] ────────→ [CONFIRMED] ───────→ [PREPARING]
      │                      │                      │
      │                      │                      │
      ▼                      ▼                      ▼
[CANCELLED]            [CANCELLED]            [CANCELLED]
                               │                      │
                               ▼                      ▼
                         [SHIPPED] ────────────→ [DELIVERED]
```

**Rules**:
- PENDING: Waiting for Stripe payment
- CONFIRMED: Payment received, awaiting production
- PREPARING: In manufacturing
- SHIPPED: Delivered to courier
- DELIVERED: Confirmed by customer
- CANCELLED: Can be cancelled until PREPARING

### Payment

```
[PENDING] → [COMPLETED]
      │
      └──────→ [FAILED]
                │
                └──────→ [RETRY] → [COMPLETED]
                              │
                              └──────→ [FAILED] (final)
```

### Invoice

```
[PENDING] → [ISSUED]
                   │
                   └──────→ [CANCELLED] (with credit note)
```

**Note**: Issued invoices cannot be deleted, only cancelled.

---

## 🚨 Exception Processes

### Payment Error

```
1. Stripe returns error
2. Show message to user
3. Offer to retry
4. Log in alert system
5. If persists → Contact support
```

### Insufficient Stock

```
1. Verify stock at checkout
2. If insufficient:
   - Show error
   - Suggest maximum quantity
   - Notify admin (automatic alert)
3. Option: Pre-order if available
```

### Return

```
1. Customer requests return (48h)
2. Admin evaluates:
   - Defective product → Accept
   - Change of mind → Policy
3. Generate credit note
4. Process Stripe refund
5. Update inventory
```

---

## 📱 Multi-Device Flows

### Desktop vs Mobile

| Process | Desktop | Mobile |
|---------|---------|--------|
| Navigation | Sidebar + Grid | Drawer + Scroll |
| Filters | Fixed sidebar | Bottom sheet |
| Checkout | 3 columns | Step by step |
| Admin | Full dashboard | Simplified cards |

---

## ✅ Process Checklist

### Before Launch

- [ ] Complete purchase process tested
- [ ] Stripe checkout in test mode
- [ ] Confirmation webhook working
- [ ] Admin order management operational
- [ ] Alert system configured
- [ ] Confirmation emails sending
- [ ] Shipping tracking integrated
- [ ] Return process documented

### Post-Launch

- [ ] Conversion monitoring
- [ ] Load time optimization
- [ ] UX improvement based on feedback
- [ ] Automation of repetitive processes
- [ ] Edge case documentation

---

**Status**: ✅ Processes documented and tested
