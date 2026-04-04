#!/bin/bash

echo "=========================================="
echo "PayPal Configuration Test"
echo "=========================================="
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    exit 1
fi

echo "✅ .env file found"
echo ""

# Check PayPal variables
echo "Checking PayPal environment variables..."
echo ""

PAYPAL_CLIENT_ID=$(grep "^PAYPAL_CLIENT_ID=" .env | cut -d'=' -f2 | head -1)
PAYPAL_SECRET=$(grep "^PAYPAL_CLIENT_SECRET=" .env | cut -d'=' -f2 | head -1)
NEXT_PUBLIC_PAYPAL=$(grep "^NEXT_PUBLIC_PAYPAL_CLIENT_ID=" .env | cut -d'=' -f2 | head -1)

if [ -z "$PAYPAL_CLIENT_ID" ] || [ "$PAYPAL_CLIENT_ID" = "your_paypal_client_id_here" ]; then
    echo "❌ PAYPAL_CLIENT_ID not configured"
else
    echo "✅ PAYPAL_CLIENT_ID: ${PAYPAL_CLIENT_ID:0:10}..."
fi

if [ -z "$PAYPAL_SECRET" ] || [ "$PAYPAL_SECRET" = "your_paypal_client_secret_here" ]; then
    echo "❌ PAYPAL_CLIENT_SECRET not configured"
else
    echo "✅ PAYPAL_CLIENT_SECRET: ${PAYPAL_SECRET:0:10}..."
fi

if [ -z "$NEXT_PUBLIC_PAYPAL" ] || [ "$NEXT_PUBLIC_PAYPAL" = "your_paypal_client_id_here" ]; then
    echo "❌ NEXT_PUBLIC_PAYPAL_CLIENT_ID not configured"
else
    echo "✅ NEXT_PUBLIC_PAYPAL_CLIENT_ID: ${NEXT_PUBLIC_PAYPAL:0:10}..."
fi

echo ""
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo ""
echo "1. Start dev server: npm run dev"
echo "2. Go to checkout page"
echo "3. Select 'PayPal' as payment method"
echo "4. You should see PayPal buttons"
echo ""
echo "If buttons don't appear, check:"
echo "- Browser console for errors"
echo "- Network tab for PayPal SDK loading"
echo ""
