#!/bin/bash

# Create realistic git history for the ClinicFlow legacy system
# This script creates backdated commits with ACTUAL file changes so that
# git log --name-only analysis works correctly for the workshop exercises.
#
# Each "evolution" commit appends a legacy-style change comment to the
# relevant source file (common in real legacy codebases).

set -e

cd "$(dirname "$0")/../legacy-system"

# Initialize git repo if not already initialized
if [ ! -d ".git" ]; then
  git init
fi

# Configure git for backdating
export GIT_COMMITTER_NAME="Legacy Bot"
export GIT_COMMITTER_EMAIL="bot@clinicflow.com"

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

# Helper: stage a source file for its first commit
add_src_file() {
  local filename="$1"
  git add "src/$filename"
}

# Helper: evolve a source file by appending a legacy change comment
evolve_src() {
  local filename="$1"
  local date="$2"
  local summary="$3"

  printf '// [%s] %s\n' "$date" "$summary" >> "src/$filename"
  git add "src/$filename"
}

# Helper: evolve a test file
evolve_test() {
  local filename="$1"
  local date="$2"
  local summary="$3"

  printf '// [%s] %s\n' "$date" "$summary" >> "tests/$filename"
  git add "tests/$filename"
}

# ============================================================
# Initial commit: config, models, utils (Jul 2024)
# ============================================================
git add .gitignore README.md package.json tsconfig.json jest.config.js
git add src/models.ts src/utils.ts
GIT_AUTHOR_NAME="Dr. Dev" \
GIT_AUTHOR_EMAIL="dev@clinicflow.com" \
GIT_AUTHOR_DATE="2024-07-10 10:00:00" \
GIT_COMMITTER_DATE="2024-07-10 10:00:00" \
git commit -m "Initial ClinicFlow system setup"

# ============================================================
# doctor-schedule.ts evolution (6 commits: 5 features, 1 bug fix)
# ============================================================

add_src_file "doctor-schedule.ts"
backdated_commit "2024-07-15 14:00:00" "Dr. Dev" "dev@clinicflow.com" \
  "feat: add doctor registration and schedule management"

evolve_src "doctor-schedule.ts" "2024-08-22" "add availability checking"
backdated_commit "2024-08-22 09:30:00" "Sarah Scheduler" "sarah@clinicflow.com" \
  "feat: add doctor availability checking"

evolve_src "doctor-schedule.ts" "2024-09-18" "add available slots endpoint"
backdated_commit "2024-09-18 11:15:00" "Dr. Dev" "dev@clinicflow.com" \
  "feat: add available time slots calculation"

evolve_src "doctor-schedule.ts" "2024-11-05" "handle break time overlap edge case"
backdated_commit "2024-11-05 16:00:00" "Sarah Scheduler" "sarah@clinicflow.com" \
  "fix: handle break time overlap edge case in availability"

evolve_src "doctor-schedule.ts" "2024-12-12" "add specialty-based doctor search"
backdated_commit "2024-12-12 10:45:00" "Dr. Dev" "dev@clinicflow.com" \
  "feat: add specialty-based doctor filtering"

evolve_src "doctor-schedule.ts" "2025-03-20" "add week schedule retrieval"
backdated_commit "2025-03-20 14:30:00" "Sarah Scheduler" "sarah@clinicflow.com" \
  "feat: add full week schedule retrieval"

# ============================================================
# prescription-manager.ts evolution (4 commits: 4 features, 0 bugs)
# ============================================================

add_src_file "prescription-manager.ts"
backdated_commit "2024-07-20 10:00:00" "Dr. Dev" "dev@clinicflow.com" \
  "feat: add prescription creation and management"

evolve_src "prescription-manager.ts" "2024-09-08" "add drug interaction checking"
backdated_commit "2024-09-08 13:00:00" "Dr. Dev" "dev@clinicflow.com" \
  "feat: add drug interaction checking for prescriptions"

evolve_src "prescription-manager.ts" "2024-11-25" "add prescription renewal flow"
backdated_commit "2024-11-25 11:30:00" "Sarah Scheduler" "sarah@clinicflow.com" \
  "feat: add prescription renewal workflow"

evolve_src "prescription-manager.ts" "2025-02-10" "add doctor prescription listing"
backdated_commit "2025-02-10 09:00:00" "Dr. Dev" "dev@clinicflow.com" \
  "feat: add per-doctor prescription listing"

# ============================================================
# patient-registry.ts evolution (12 commits: 9 features, 3 bugs)
# ============================================================

add_src_file "patient-registry.ts"
backdated_commit "2024-07-25 14:00:00" "Mike Records" "mike@clinicflow.com" \
  "feat: add patient registration system"

evolve_src "patient-registry.ts" "2024-08-10" "add patient search functionality"
backdated_commit "2024-08-10 10:30:00" "Mike Records" "mike@clinicflow.com" \
  "feat: add patient search by name"

evolve_src "patient-registry.ts" "2024-08-28" "add email and phone search"
backdated_commit "2024-08-28 15:00:00" "Dr. Dev" "dev@clinicflow.com" \
  "feat: add search by email, phone, insurance ID"

evolve_src "patient-registry.ts" "2024-09-15" "fix duplicate detection case sensitivity"
backdated_commit "2024-09-15 11:00:00" "Mike Records" "mike@clinicflow.com" \
  "fix: duplicate detection not case-insensitive"

evolve_src "patient-registry.ts" "2024-10-05" "add medical history tracking"
backdated_commit "2024-10-05 09:45:00" "Dr. Dev" "dev@clinicflow.com" \
  "feat: add medical history entries for patients"

evolve_src "patient-registry.ts" "2024-10-22" "add patient deactivation"
backdated_commit "2024-10-22 14:15:00" "Mike Records" "mike@clinicflow.com" \
  "feat: add patient deactivation (soft delete)"

evolve_src "patient-registry.ts" "2024-11-10" "fix missing medicalHistory initialization"
backdated_commit "2024-11-10 16:30:00" "Sarah Scheduler" "sarah@clinicflow.com" \
  "fix: medical history array not initialized for some patients"

evolve_src "patient-registry.ts" "2024-12-02" "add insurance info to patient"
backdated_commit "2024-12-02 10:00:00" "Mike Records" "mike@clinicflow.com" \
  "feat: add insurance provider and ID to patient records"

evolve_src "patient-registry.ts" "2025-01-08" "add patient update endpoint"
backdated_commit "2025-01-08 13:30:00" "Dr. Dev" "dev@clinicflow.com" \
  "feat: add full patient record update"

evolve_src "patient-registry.ts" "2025-02-15" "add status-based patient filtering"
backdated_commit "2025-02-15 11:00:00" "Mike Records" "mike@clinicflow.com" \
  "feat: add patient filtering by status"

evolve_src "patient-registry.ts" "2025-04-10" "fix email validation not catching empty string"
backdated_commit "2025-04-10 15:45:00" "Sarah Scheduler" "sarah@clinicflow.com" \
  "fix: email validation accepts empty strings"

evolve_src "patient-registry.ts" "2025-06-20" "add getAllPatients endpoint"
backdated_commit "2025-06-20 09:30:00" "Mike Records" "mike@clinicflow.com" \
  "feat: add list all patients endpoint"

# ============================================================
# billing-service.ts evolution (10 commits: 6 features, 4 bugs)
# ============================================================

add_src_file "billing-service.ts"
backdated_commit "2024-08-05 10:00:00" "Sarah Scheduler" "sarah@clinicflow.com" \
  "feat: add invoice generation for appointments"

evolve_src "billing-service.ts" "2024-08-30" "add insurance discount calculation"
backdated_commit "2024-08-30 14:00:00" "Dr. Dev" "dev@clinicflow.com" \
  "feat: add insurance discount calculations"

evolve_src "billing-service.ts" "2024-09-22" "fix rounding errors in invoice totals"
backdated_commit "2024-09-22 11:15:00" "Sarah Scheduler" "sarah@clinicflow.com" \
  "fix: rounding errors in invoice total calculations"

evolve_src "billing-service.ts" "2024-10-15" "add payment tracking"
backdated_commit "2024-10-15 09:30:00" "Mike Records" "mike@clinicflow.com" \
  "feat: add payment tracking and markAsPaid"

evolve_src "billing-service.ts" "2024-11-20" "fix paying already-cancelled invoice"
backdated_commit "2024-11-20 16:00:00" "Dr. Dev" "dev@clinicflow.com" \
  "fix: allow paying cancelled invoices (should throw)"

evolve_src "billing-service.ts" "2024-12-18" "add duration surcharge calculation"
backdated_commit "2024-12-18 10:45:00" "Sarah Scheduler" "sarah@clinicflow.com" \
  "feat: add surcharge for extended appointment durations"

evolve_src "billing-service.ts" "2025-01-22" "add revenue reporting functions"
backdated_commit "2025-01-22 13:00:00" "Dr. Dev" "dev@clinicflow.com" \
  "feat: add revenue and pending amount calculations"

evolve_src "billing-service.ts" "2025-03-05" "fix insurance discount for unknown providers"
backdated_commit "2025-03-05 15:30:00" "Mike Records" "mike@clinicflow.com" \
  "fix: unknown insurance provider returns NaN discount"

evolve_src "billing-service.ts" "2025-05-12" "add invoice cancellation"
backdated_commit "2025-05-12 11:00:00" "Sarah Scheduler" "sarah@clinicflow.com" \
  "feat: add invoice cancellation endpoint"

evolve_src "billing-service.ts" "2025-07-08" "fix double-tax on insurance discount calculation"
backdated_commit "2025-07-08 09:15:00" "Dr. Dev" "dev@clinicflow.com" \
  "fix: tax calculated on pre-discount amount instead of post-discount"

# ============================================================
# notification-service.ts evolution (18 commits: 8 features, 10 bugs)
# ============================================================

add_src_file "notification-service.ts"
backdated_commit "2024-08-12 10:00:00" "Mike Records" "mike@clinicflow.com" \
  "feat: add appointment email notifications"

evolve_src "notification-service.ts" "2024-08-20" "add SMS notification support"
backdated_commit "2024-08-20 14:30:00" "Dr. Dev" "dev@clinicflow.com" \
  "feat: add SMS notification support"

evolve_src "notification-service.ts" "2024-09-05" "fix email not sent when address missing"
backdated_commit "2024-09-05 09:00:00" "Mike Records" "mike@clinicflow.com" \
  "fix: email notification crashes when address is undefined"

evolve_src "notification-service.ts" "2024-09-18" "fix SMTP timeout not handled"
backdated_commit "2024-09-18 16:15:00" "Sarah Scheduler" "sarah@clinicflow.com" \
  "fix: SMTP connection timeout not handled gracefully"

evolve_src "notification-service.ts" "2024-10-02" "add appointment confirmation emails"
backdated_commit "2024-10-02 11:30:00" "Dr. Dev" "dev@clinicflow.com" \
  "feat: add appointment confirmation email template"

evolve_src "notification-service.ts" "2024-10-20" "fix confirmation email missing doctor name"
backdated_commit "2024-10-20 15:00:00" "Mike Records" "mike@clinicflow.com" \
  "fix: confirmation email template missing doctor name"

evolve_src "notification-service.ts" "2024-11-05" "fix SMS sent even when phone is empty"
backdated_commit "2024-11-05 10:00:00" "Sarah Scheduler" "sarah@clinicflow.com" \
  "fix: SMS notification sent when phone number is empty"

evolve_src "notification-service.ts" "2024-11-22" "add cancellation notice emails"
backdated_commit "2024-11-22 13:45:00" "Dr. Dev" "dev@clinicflow.com" \
  "feat: add appointment cancellation notice emails"

evolve_src "notification-service.ts" "2024-12-08" "fix cancellation email sent twice"
backdated_commit "2024-12-08 09:30:00" "Mike Records" "mike@clinicflow.com" \
  "fix: cancellation notification sent twice in some cases"

evolve_src "notification-service.ts" "2024-12-22" "add billing notification"
backdated_commit "2024-12-22 14:00:00" "Dr. Dev" "dev@clinicflow.com" \
  "feat: add billing notification emails"

evolve_src "notification-service.ts" "2025-01-15" "fix billing email amount formatting"
backdated_commit "2025-01-15 11:00:00" "Sarah Scheduler" "sarah@clinicflow.com" \
  "fix: billing notification shows wrong amount format"

evolve_src "notification-service.ts" "2025-02-05" "fix random SMTP failures not logged"
backdated_commit "2025-02-05 16:30:00" "Mike Records" "mike@clinicflow.com" \
  "fix: random SMTP failures silently swallowed"

evolve_src "notification-service.ts" "2025-03-12" "add appointment reminder notifications"
backdated_commit "2025-03-12 10:15:00" "Dr. Dev" "dev@clinicflow.com" \
  "feat: add appointment reminder notifications"

evolve_src "notification-service.ts" "2025-04-02" "fix reminder sent after appointment time"
backdated_commit "2025-04-02 14:45:00" "Sarah Scheduler" "sarah@clinicflow.com" \
  "fix: reminder notification sent after appointment has passed"

evolve_src "notification-service.ts" "2025-05-18" "fix email template XSS vulnerability"
backdated_commit "2025-05-18 09:00:00" "Mike Records" "mike@clinicflow.com" \
  "fix: email template vulnerable to HTML injection"

evolve_src "notification-service.ts" "2025-06-25" "add sent notification logging"
backdated_commit "2025-06-25 13:30:00" "Dr. Dev" "dev@clinicflow.com" \
  "feat: add sent notification history logging"

evolve_src "notification-service.ts" "2025-08-10" "fix notification log memory leak"
backdated_commit "2025-08-10 11:15:00" "Sarah Scheduler" "sarah@clinicflow.com" \
  "fix: notification log grows unbounded in memory"

evolve_src "notification-service.ts" "2025-09-05" "add notification report helper"
backdated_commit "2025-09-05 15:00:00" "Mike Records" "mike@clinicflow.com" \
  "feat: add notification delivery report helper"

# ============================================================
# appointment-scheduler.ts evolution (22 commits: 14 features, 8 bugs)
# ============================================================

add_src_file "appointment-scheduler.ts"
backdated_commit "2024-08-18 10:00:00" "Dr. Dev" "dev@clinicflow.com" \
  "feat: add core appointment scheduling"

evolve_src "appointment-scheduler.ts" "2024-08-28" "add appointment validation"
backdated_commit "2024-08-28 14:00:00" "Sarah Scheduler" "sarah@clinicflow.com" \
  "feat: add appointment validation rules"

evolve_src "appointment-scheduler.ts" "2024-09-10" "add conflict detection"
backdated_commit "2024-09-10 09:30:00" "Dr. Dev" "dev@clinicflow.com" \
  "feat: add appointment conflict detection"

evolve_src "appointment-scheduler.ts" "2024-09-25" "fix double-booking not caught for overlapping slots"
backdated_commit "2024-09-25 16:00:00" "Mike Records" "mike@clinicflow.com" \
  "fix: double-booking not caught for overlapping time slots"

evolve_src "appointment-scheduler.ts" "2024-10-08" "add rescheduling support"
backdated_commit "2024-10-08 11:00:00" "Sarah Scheduler" "sarah@clinicflow.com" \
  "feat: add appointment rescheduling"

evolve_src "appointment-scheduler.ts" "2024-10-22" "add cancellation with reason"
backdated_commit "2024-10-22 14:30:00" "Dr. Dev" "dev@clinicflow.com" \
  "feat: add appointment cancellation with reason tracking"

evolve_src "appointment-scheduler.ts" "2024-11-05" "fix cancelling already-cancelled appointment"
backdated_commit "2024-11-05 10:15:00" "Mike Records" "mike@clinicflow.com" \
  "fix: cancelling already-cancelled appointment should throw error"

evolve_src "appointment-scheduler.ts" "2024-11-18" "add billing integration"
backdated_commit "2024-11-18 13:00:00" "Sarah Scheduler" "sarah@clinicflow.com" \
  "feat: integrate billing service with appointment creation"

evolve_src "appointment-scheduler.ts" "2024-12-02" "add notification integration"
backdated_commit "2024-12-02 09:45:00" "Dr. Dev" "dev@clinicflow.com" \
  "feat: integrate notification service for appointment events"

evolve_src "appointment-scheduler.ts" "2024-12-15" "fix billing not cancelled on appointment cancel"
backdated_commit "2024-12-15 15:30:00" "Mike Records" "mike@clinicflow.com" \
  "fix: invoice not cancelled when appointment is cancelled"

evolve_src "appointment-scheduler.ts" "2025-01-05" "add emergency appointment override"
backdated_commit "2025-01-05 10:00:00" "Sarah Scheduler" "sarah@clinicflow.com" \
  "feat: add emergency appointment schedule override"

evolve_src "appointment-scheduler.ts" "2025-01-20" "add max daily appointments limit"
backdated_commit "2025-01-20 14:00:00" "Dr. Dev" "dev@clinicflow.com" \
  "feat: add maximum daily appointments per doctor limit"

evolve_src "appointment-scheduler.ts" "2025-02-08" "fix business hours check not including end time"
backdated_commit "2025-02-08 11:30:00" "Mike Records" "mike@clinicflow.com" \
  "fix: business hours validation doesn't check appointment end time"

evolve_src "appointment-scheduler.ts" "2025-03-01" "add appointment caching by date"
backdated_commit "2025-03-01 09:00:00" "Sarah Scheduler" "sarah@clinicflow.com" \
  "feat: add appointment caching by date for performance"

evolve_src "appointment-scheduler.ts" "2025-03-18" "fix cache not invalidated on reschedule"
backdated_commit "2025-03-18 16:00:00" "Dr. Dev" "dev@clinicflow.com" \
  "fix: appointment cache not invalidated on reschedule"

evolve_src "appointment-scheduler.ts" "2025-04-15" "add patient conflict detection"
backdated_commit "2025-04-15 10:30:00" "Mike Records" "mike@clinicflow.com" \
  "feat: add patient double-booking detection"

evolve_src "appointment-scheduler.ts" "2025-05-05" "add complete and no-show status"
backdated_commit "2025-05-05 14:15:00" "Sarah Scheduler" "sarah@clinicflow.com" \
  "feat: add appointment complete and no-show status tracking"

evolve_src "appointment-scheduler.ts" "2025-06-10" "fix reschedule validation not checking past dates"
backdated_commit "2025-06-10 11:00:00" "Dr. Dev" "dev@clinicflow.com" \
  "fix: reschedule allows scheduling in the past"

evolve_src "appointment-scheduler.ts" "2025-07-15" "add slot locking for concurrent scheduling"
backdated_commit "2025-07-15 15:45:00" "Mike Records" "mike@clinicflow.com" \
  "feat: add slot locking mechanism for concurrent scheduling"

evolve_src "appointment-scheduler.ts" "2025-08-22" "fix slot lock not released on error"
backdated_commit "2025-08-22 09:30:00" "Sarah Scheduler" "sarah@clinicflow.com" \
  "fix: slot lock not released when scheduling fails"

evolve_src "appointment-scheduler.ts" "2025-10-05" "add appointment queries by doctor and patient"
backdated_commit "2025-10-05 13:00:00" "Dr. Dev" "dev@clinicflow.com" \
  "feat: add appointment listing by doctor and patient"

evolve_src "appointment-scheduler.ts" "2025-11-18" "fix cache corruption when multiple appointments same date"
backdated_commit "2025-11-18 10:15:00" "Mike Records" "mike@clinicflow.com" \
  "fix: cache corruption when multiple appointments on same date"

# ============================================================
# reporting.ts evolution (8 commits: 6 features, 2 bugs)
# ============================================================

add_src_file "reporting.ts"
backdated_commit "2024-10-28 10:00:00" "Dr. Dev" "dev@clinicflow.com" \
  "feat: add daily report generation"

evolve_src "reporting.ts" "2024-11-28" "add appointment statistics"
backdated_commit "2024-11-28 14:30:00" "Sarah Scheduler" "sarah@clinicflow.com" \
  "feat: add appointment statistics report"

evolve_src "reporting.ts" "2024-12-28" "add revenue reporting"
backdated_commit "2024-12-28 11:00:00" "Dr. Dev" "dev@clinicflow.com" \
  "feat: add revenue and billing report"

evolve_src "reporting.ts" "2025-02-20" "fix daily report counting cancelled appointments"
backdated_commit "2025-02-20 15:15:00" "Mike Records" "mike@clinicflow.com" \
  "fix: daily report incorrectly counts cancelled appointments"

evolve_src "reporting.ts" "2025-04-25" "add notification delivery report"
backdated_commit "2025-04-25 10:30:00" "Sarah Scheduler" "sarah@clinicflow.com" \
  "feat: add notification delivery statistics report"

evolve_src "reporting.ts" "2025-06-30" "add system overview report"
backdated_commit "2025-06-30 14:00:00" "Dr. Dev" "dev@clinicflow.com" \
  "feat: add system-wide overview report"

evolve_src "reporting.ts" "2025-08-05" "add per-patient revenue breakdown"
backdated_commit "2025-08-05 09:45:00" "Mike Records" "mike@clinicflow.com" \
  "feat: add per-patient revenue breakdown in reports"

evolve_src "reporting.ts" "2025-10-15" "fix revenue report double-counting pending invoices"
backdated_commit "2025-10-15 13:30:00" "Sarah Scheduler" "sarah@clinicflow.com" \
  "fix: revenue report double-counts pending invoices"

# ============================================================
# server.ts evolution (3 commits: 3 features, 0 bugs)
# ============================================================

add_src_file "server.ts"
backdated_commit "2024-09-01 10:00:00" "Dr. Dev" "dev@clinicflow.com" \
  "feat: add Express API server with patient and doctor routes"

evolve_src "server.ts" "2024-11-15" "add appointment, billing, prescription routes"
backdated_commit "2024-11-15 14:00:00" "Dr. Dev" "dev@clinicflow.com" \
  "feat: add appointment, billing, and prescription API routes"

evolve_src "server.ts" "2025-05-01" "add reporting routes and health check"
backdated_commit "2025-05-01 11:00:00" "Dr. Dev" "dev@clinicflow.com" \
  "feat: add reporting API routes and health check endpoint"

# ============================================================
# Test files (added at various points)
# ============================================================

git add tests/doctor-schedule.test.ts
backdated_commit "2024-09-20 10:00:00" "Sarah Scheduler" "sarah@clinicflow.com" \
  "test: add doctor schedule tests"

git add tests/prescription-manager.test.ts
backdated_commit "2024-10-01 10:00:00" "Dr. Dev" "dev@clinicflow.com" \
  "test: add prescription manager tests"

git add tests/billing-service.test.ts
backdated_commit "2024-11-01 10:00:00" "Sarah Scheduler" "sarah@clinicflow.com" \
  "test: add billing service tests"

git add tests/patient-registry.test.ts
backdated_commit "2025-01-10 10:00:00" "Mike Records" "mike@clinicflow.com" \
  "test: add patient registry tests (partial coverage)"

echo ""
echo "Git history created successfully!"
echo ""
echo "Summary:"
echo "  - Total commits: ~80"
echo "  - Date range: Jul 2024 - Nov 2025 (~18 months)"
echo "  - Authors: Dr. Dev, Sarah Scheduler, Mike Records"
echo ""
echo "Verify with (run from legacy-system directory):"
echo "  git log --name-only --pretty=format:'' | grep 'src/' | sort | uniq -c | sort -rn"
echo ""
echo "Expected output:"
echo "   22 src/appointment-scheduler.ts"
echo "   18 src/notification-service.ts"
echo "   12 src/patient-registry.ts"
echo "   10 src/billing-service.ts"
echo "    8 src/reporting.ts"
echo "    6 src/doctor-schedule.ts"
echo "    4 src/prescription-manager.ts"
echo "    3 src/server.ts"
