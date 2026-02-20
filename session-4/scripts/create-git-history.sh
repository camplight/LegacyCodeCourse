#!/bin/bash

# Create realistic git history for the legacy e-commerce system
# This script creates backdated commits with ACTUAL file changes so that
# git log --name-only analysis works correctly for the workshop exercises.
#
# Each "evolution" commit appends a legacy-style change comment to the
# relevant source file (common in real legacy codebases where developers
# used inline comments as a poor substitute for proper version control).

set -e

cd "$(dirname "$0")/../legacy-system"

# Initialize git repo if not already initialized
if [ ! -d ".git" ]; then
  git init
fi

# Configure git for backdating
export GIT_COMMITTER_NAME="Legacy Bot"
export GIT_COMMITTER_EMAIL="bot@legacy-ecommerce.com"

# Helper: commit with backdated timestamp
backdated_commit() {
  local date="$1"
  local author="$2"
  local email="$3"
  local message="$4"

  GIT_AUTHOR_NAME="$author" \
  GIT_AUTHOR_EMAIL="$email" \
  GIT_AUTHOR_DATE="$date" \
  GIT_COMMITTER_DATE="$date" \
  git commit -m "$message"
}

# Helper: stage a source file for its first commit (clean add)
add_src_file() {
  local filename="$1"
  git add "src/$filename"
}

# Helper: evolve a source file by appending a legacy change comment
# This simulates real file modification so git log --name-only works
evolve_src() {
  local filename="$1"
  local date="$2"     # YYYY-MM-DD format
  local summary="$3"

  printf '// [%s] %s\n' "$date" "$summary" >> "src/$filename"
  git add "src/$filename"
}

# ============================================================
# Initial commit: config, tests, and support files (Feb 2024)
# ============================================================
git add README.md package.json tsconfig.json jest.config.js
git add tests/
git add src/models.ts src/utils.ts src/index.ts
GIT_AUTHOR_NAME="John Legacy" \
GIT_AUTHOR_EMAIL="john@example.com" \
GIT_AUTHOR_DATE="2024-02-12 10:00:00" \
GIT_COMMITTER_DATE="2024-02-12 10:00:00" \
git commit -m "Initial e-commerce system implementation"

# ============================================================
# OrderProcessor evolution (18 commits: 12 features, 6 bugs)
# ============================================================

add_src_file "order-processor.ts"
backdated_commit "2024-03-05 14:20:00" "John Legacy" "john@example.com" \
  "feat: add order creation and validation"

evolve_src "order-processor.ts" "2024-04-12" "implement discount calculation logic"
backdated_commit "2024-04-12 09:15:00" "Sarah Maintainer" "sarah@example.com" \
  "feat: implement discount calculation logic"

evolve_src "order-processor.ts" "2024-04-18" "null check in order validation"
backdated_commit "2024-04-18 16:30:00" "Sarah Maintainer" "sarah@example.com" \
  "fix: null check in order validation"

evolve_src "order-processor.ts" "2024-05-03" "add tax calculation by region"
backdated_commit "2024-05-03 11:00:00" "Mike Feature" "mike@example.com" \
  "feat: add tax calculation by region"

evolve_src "order-processor.ts" "2024-05-15" "correct UK tax rate calculation"
backdated_commit "2024-05-15 13:45:00" "John Legacy" "john@example.com" \
  "fix: correct UK tax rate calculation"

evolve_src "order-processor.ts" "2024-06-08" "add bulk order discounts"
backdated_commit "2024-06-08 10:30:00" "Mike Feature" "mike@example.com" \
  "feat: add bulk order discounts"

evolve_src "order-processor.ts" "2024-07-14" "implement order caching for performance"
backdated_commit "2024-07-14 15:20:00" "John Legacy" "john@example.com" \
  "feat: implement order caching for performance"

evolve_src "order-processor.ts" "2024-08-02" "prevent cache corruption on concurrent orders"
backdated_commit "2024-08-02 09:00:00" "Sarah Maintainer" "sarah@example.com" \
  "fix: prevent cache corruption on concurrent orders"

evolve_src "order-processor.ts" "2024-09-10" "integrate promotion code application"
backdated_commit "2024-09-10 14:15:00" "Mike Feature" "mike@example.com" \
  "feat: integrate promotion code application"

evolve_src "order-processor.ts" "2024-09-25" "prevent discount from exceeding total"
backdated_commit "2024-09-25 16:00:00" "John Legacy" "john@example.com" \
  "fix: prevent discount from exceeding total"

evolve_src "order-processor.ts" "2024-10-08" "add comprehensive order validation"
backdated_commit "2024-10-08 11:30:00" "Sarah Maintainer" "sarah@example.com" \
  "feat: add comprehensive order validation"

evolve_src "order-processor.ts" "2024-10-22" "handle empty item arrays in validation"
backdated_commit "2024-10-22 13:00:00" "Sarah Maintainer" "sarah@example.com" \
  "fix: handle empty item arrays in validation"

evolve_src "order-processor.ts" "2024-11-05" "integrate payment processing in finalize"
backdated_commit "2024-11-05 10:00:00" "Mike Feature" "mike@example.com" \
  "feat: integrate payment processing in finalize"

evolve_src "order-processor.ts" "2024-12-01" "add email confirmation on order finalization"
backdated_commit "2024-12-01 14:45:00" "John Legacy" "john@example.com" \
  "feat: add email confirmation on order finalization"

evolve_src "order-processor.ts" "2024-12-15" "improve payment error handling"
backdated_commit "2024-12-15 09:30:00" "Sarah Maintainer" "sarah@example.com" \
  "fix: improve payment error handling"

evolve_src "order-processor.ts" "2025-01-10" "support multiple promotions per order"
backdated_commit "2025-01-10 11:00:00" "Mike Feature" "mike@example.com" \
  "feat: support multiple promotions per order"

evolve_src "order-processor.ts" "2025-01-28" "correct pricing calculation with promotions"
backdated_commit "2025-01-28 15:15:00" "John Legacy" "john@example.com" \
  "fix: correct pricing calculation with promotions"

evolve_src "order-processor.ts" "2025-02-05" "add cache clearing utility function"
backdated_commit "2025-02-05 10:45:00" "Sarah Maintainer" "sarah@example.com" \
  "feat: add cache clearing utility function"

# ============================================================
# EmailNotifier evolution (22 commits: 8 features, 14 bugs)
# ============================================================

add_src_file "email-notifier.ts"
backdated_commit "2024-03-08 11:00:00" "John Legacy" "john@example.com" \
  "feat: implement order confirmation emails"

evolve_src "email-notifier.ts" "2024-03-12" "add null check for customer in email"
backdated_commit "2024-03-12 14:30:00" "Sarah Maintainer" "sarah@example.com" \
  "fix: add null check for customer in email"

evolve_src "email-notifier.ts" "2024-04-05" "add shipping update notifications"
backdated_commit "2024-04-05 09:00:00" "Mike Feature" "mike@example.com" \
  "feat: add shipping update notifications"

evolve_src "email-notifier.ts" "2024-04-20" "correct email template formatting"
backdated_commit "2024-04-20 16:00:00" "John Legacy" "john@example.com" \
  "fix: correct email template formatting"

evolve_src "email-notifier.ts" "2024-05-08" "handle special characters in email content"
backdated_commit "2024-05-08 10:15:00" "Sarah Maintainer" "sarah@example.com" \
  "fix: handle special characters in email content"

evolve_src "email-notifier.ts" "2024-06-15" "implement invoice email generation"
backdated_commit "2024-06-15 13:30:00" "Mike Feature" "mike@example.com" \
  "feat: implement invoice email generation"

evolve_src "email-notifier.ts" "2024-06-22" "correct currency formatting in emails"
backdated_commit "2024-06-22 11:00:00" "John Legacy" "john@example.com" \
  "fix: correct currency formatting in emails"

evolve_src "email-notifier.ts" "2024-07-10" "prevent null pointer in invoice generation"
backdated_commit "2024-07-10 15:45:00" "Sarah Maintainer" "sarah@example.com" \
  "fix: prevent null pointer in invoice generation"

evolve_src "email-notifier.ts" "2024-08-05" "add email queue for batch processing"
backdated_commit "2024-08-05 09:30:00" "Mike Feature" "mike@example.com" \
  "feat: add email queue for batch processing"

evolve_src "email-notifier.ts" "2024-08-18" "improve SMTP connection handling"
backdated_commit "2024-08-18 14:00:00" "John Legacy" "john@example.com" \
  "fix: improve SMTP connection handling"

evolve_src "email-notifier.ts" "2024-09-03" "validate tracking number before sending email"
backdated_commit "2024-09-03 10:00:00" "Sarah Maintainer" "sarah@example.com" \
  "fix: validate tracking number before sending email"

evolve_src "email-notifier.ts" "2024-09-20" "correct date formatting in shipping emails"
backdated_commit "2024-09-20 16:30:00" "John Legacy" "john@example.com" \
  "fix: correct date formatting in shipping emails"

evolve_src "email-notifier.ts" "2024-10-12" "support HTML email templates"
backdated_commit "2024-10-12 11:15:00" "Mike Feature" "mike@example.com" \
  "feat: support HTML email templates"

evolve_src "email-notifier.ts" "2024-10-25" "prevent template injection vulnerability"
backdated_commit "2024-10-25 13:00:00" "Sarah Maintainer" "sarah@example.com" \
  "fix: prevent template injection vulnerability"

evolve_src "email-notifier.ts" "2024-11-08" "handle orders with missing items in email"
backdated_commit "2024-11-08 09:45:00" "John Legacy" "john@example.com" \
  "fix: handle orders with missing items in email"

evolve_src "email-notifier.ts" "2024-11-22" "correct total price display in confirmation"
backdated_commit "2024-11-22 15:00:00" "Sarah Maintainer" "sarah@example.com" \
  "fix: correct total price display in confirmation"

evolve_src "email-notifier.ts" "2024-12-05" "add email queue processor function"
backdated_commit "2024-12-05 10:30:00" "Mike Feature" "mike@example.com" \
  "feat: add email queue processor function"

evolve_src "email-notifier.ts" "2024-12-18" "prevent queue deadlock on errors"
backdated_commit "2024-12-18 14:15:00" "John Legacy" "john@example.com" \
  "fix: prevent queue deadlock on errors"

evolve_src "email-notifier.ts" "2025-01-12" "add retry logic for failed emails"
backdated_commit "2025-01-12 11:00:00" "Sarah Maintainer" "sarah@example.com" \
  "fix: add retry logic for failed emails"

evolve_src "email-notifier.ts" "2025-01-25" "handle missing customer name in shipping email"
backdated_commit "2025-01-25 16:45:00" "John Legacy" "john@example.com" \
  "fix: handle missing customer name in shipping email"

evolve_src "email-notifier.ts" "2025-02-08" "correct tax amount display in invoice"
backdated_commit "2025-02-08 09:15:00" "Sarah Maintainer" "sarah@example.com" \
  "fix: correct tax amount display in invoice"

evolve_src "email-notifier.ts" "2025-02-10" "improve error handling for SMTP failures"
backdated_commit "2025-02-10 13:30:00" "Mike Feature" "mike@example.com" \
  "fix: improve error handling for SMTP failures"

# ============================================================
# PricingEngine evolution (12 commits: 8 features, 4 bugs)
# ============================================================

add_src_file "pricing-engine.ts"
backdated_commit "2024-03-15 10:00:00" "Mike Feature" "mike@example.com" \
  "feat: implement basic pricing calculation"

evolve_src "pricing-engine.ts" "2024-04-22" "add regional shipping rates"
backdated_commit "2024-04-22 14:30:00" "Mike Feature" "mike@example.com" \
  "feat: add regional shipping rates"

evolve_src "pricing-engine.ts" "2024-05-18" "implement tax rate calculation"
backdated_commit "2024-05-18 11:15:00" "John Legacy" "john@example.com" \
  "feat: implement tax rate calculation"

evolve_src "pricing-engine.ts" "2024-06-25" "handle missing country in tax calculation"
backdated_commit "2024-06-25 15:00:00" "Sarah Maintainer" "sarah@example.com" \
  "fix: handle missing country in tax calculation"

evolve_src "pricing-engine.ts" "2024-07-20" "add free shipping for premium customers"
backdated_commit "2024-07-20 09:30:00" "Mike Feature" "mike@example.com" \
  "feat: add free shipping for premium customers"

evolve_src "pricing-engine.ts" "2024-08-28" "implement promotion code system"
backdated_commit "2024-08-28 13:45:00" "Mike Feature" "mike@example.com" \
  "feat: implement promotion code system"

evolve_src "pricing-engine.ts" "2024-09-15" "correct discount calculation for promotions"
backdated_commit "2024-09-15 10:15:00" "John Legacy" "john@example.com" \
  "fix: correct discount calculation for promotions"

evolve_src "pricing-engine.ts" "2024-10-18" "add customer tier discount system"
backdated_commit "2024-10-18 14:00:00" "Mike Feature" "mike@example.com" \
  "feat: add customer tier discount system"

evolve_src "pricing-engine.ts" "2024-11-12" "support international shipping rates"
backdated_commit "2024-11-12 11:30:00" "Mike Feature" "mike@example.com" \
  "feat: support international shipping rates"

evolve_src "pricing-engine.ts" "2024-12-20" "correct free shipping threshold logic"
backdated_commit "2024-12-20 15:45:00" "Sarah Maintainer" "sarah@example.com" \
  "fix: correct free shipping threshold logic"

evolve_src "pricing-engine.ts" "2025-01-15" "add EU VAT rates"
backdated_commit "2025-01-15 10:00:00" "Mike Feature" "mike@example.com" \
  "feat: add EU VAT rates"

evolve_src "pricing-engine.ts" "2025-02-03" "apply VIP discount correctly in pricing"
backdated_commit "2025-02-03 14:30:00" "John Legacy" "john@example.com" \
  "fix: apply VIP discount correctly in pricing"

# ============================================================
# Stable modules (few commits each)
# ============================================================

# InventoryManager (4 commits - no bugs, stable)
add_src_file "inventory-manager.ts"
backdated_commit "2024-03-20 10:00:00" "Mike Feature" "mike@example.com" \
  "feat: implement inventory management"

evolve_src "inventory-manager.ts" "2024-06-10" "add inventory reservation system"
backdated_commit "2024-06-10 14:00:00" "Mike Feature" "mike@example.com" \
  "feat: add inventory reservation system"

evolve_src "inventory-manager.ts" "2024-09-05" "add product management functions"
backdated_commit "2024-09-05 11:30:00" "Sarah Maintainer" "sarah@example.com" \
  "feat: add product management functions"

evolve_src "inventory-manager.ts" "2024-12-10" "add stock level updates"
backdated_commit "2024-12-10 15:00:00" "Mike Feature" "mike@example.com" \
  "feat: add stock level updates"

# PaymentGateway (3 commits - no bugs, stable)
add_src_file "payment-gateway.ts"
backdated_commit "2024-04-08 09:00:00" "Mike Feature" "mike@example.com" \
  "feat: implement payment processing"

evolve_src "payment-gateway.ts" "2024-08-15" "add refund functionality"
backdated_commit "2024-08-15 13:30:00" "Mike Feature" "mike@example.com" \
  "feat: add refund functionality"

evolve_src "payment-gateway.ts" "2025-01-05" "add payment validation"
backdated_commit "2025-01-05 10:45:00" "Mike Feature" "mike@example.com" \
  "feat: add payment validation"

# ShippingCalculator (2 commits - no bugs, most stable)
add_src_file "shipping-calculator.ts"
backdated_commit "2024-05-25 11:00:00" "Mike Feature" "mike@example.com" \
  "feat: implement shipping calculator"

evolve_src "shipping-calculator.ts" "2024-11-18" "add delivery date estimation"
backdated_commit "2024-11-18 14:15:00" "Mike Feature" "mike@example.com" \
  "feat: add delivery date estimation"

echo "✅ Git history created successfully!"
echo "📊 Summary:"
echo "  - Total commits: 62"
echo "  - Date range: Feb 2024 - Feb 2025 (~2 years)"
echo "  - Authors: John Legacy, Sarah Maintainer, Mike Feature"
echo ""
echo "Verify with (run from legacy-system directory):"
echo "  git log --name-only --pretty=format:'' | grep 'src/' | sort | uniq -c | sort -rn"
echo ""
echo "Expected output:"
echo "   22 src/email-notifier.ts"
echo "   18 src/order-processor.ts"
echo "   12 src/pricing-engine.ts"
echo "    4 src/inventory-manager.ts"
echo "    3 src/payment-gateway.ts"
echo "    2 src/shipping-calculator.ts"
