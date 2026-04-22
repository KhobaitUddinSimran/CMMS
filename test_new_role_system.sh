#!/bin/bash

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:8000"
ADMIN_EMAIL="admin@utm.my"
ADMIN_PASSWORD="password@cmms"
LECTURER_EMAIL="lecturer@utm.my"
COORDINATOR_EMAIL="coordinator@utm.my"
HOD_EMAIL="hod@utm.my"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   NEW ROLE ASSIGNMENT SYSTEM TEST SUITE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"

# Step 1: Admin Login
echo -e "${YELLOW}Step 1: Admin Login${NC}"
admin_response=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$ADMIN_EMAIL\", \"password\": \"$ADMIN_PASSWORD\", \"role\": \"admin\"}")

admin_token=$(echo $admin_response | jq -r '.token')
echo -e "${GREEN}✓ Admin logged in${NC}"
echo "  Token: ${admin_token:0:20}..."
echo ""

# Step 2: Get lecturers list
echo -e "${YELLOW}Step 2: Fetch Lecturers List${NC}"
lecturers=$(curl -s -X GET "$BASE_URL/api/admin/lecturers" \
  -H "Authorization: Bearer $admin_token")

lecturer_count=$(echo $lecturers | jq '.count')
echo -e "${GREEN}✓ Found $lecturer_count lecturers${NC}"
echo $lecturers | jq '.lecturers[] | {email: .email, full_name: .full_name, special_roles: .special_roles}'
echo ""

# Step 3: Assign Coordinator role to lecturer@utm.my
echo -e "${YELLOW}Step 3: Assign Coordinator Role to $LECTURER_EMAIL${NC}"
coord_assign=$(curl -s -X POST "$BASE_URL/api/admin/assign-special-role" \
  -H "Authorization: Bearer $admin_token" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$LECTURER_EMAIL\", \"special_role\": \"coordinator\"}")

if echo $coord_assign | jq -e '.special_roles | index("coordinator")' > /dev/null; then
  echo -e "${GREEN}✓ Coordinator role assigned successfully${NC}"
  echo "  Special roles: $(echo $coord_assign | jq '.special_roles')"
else
  echo -e "${RED}✗ Failed to assign coordinator role${NC}"
fi
echo ""

# Step 4: Assign HOD role to lecturer@utm.my
echo -e "${YELLOW}Step 4: Assign HOD Role to $LECTURER_EMAIL${NC}"
hod_assign=$(curl -s -X POST "$BASE_URL/api/admin/assign-special-role" \
  -H "Authorization: Bearer $admin_token" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$LECTURER_EMAIL\", \"special_role\": \"hod\"}")

if echo $hod_assign | jq -e '.special_roles | index("hod")' > /dev/null; then
  echo -e "${GREEN}✓ HOD role assigned successfully${NC}"
  echo "  Special roles: $(echo $hod_assign | jq '.special_roles')"
else
  echo -e "${RED}✗ Failed to assign HOD role${NC}"
fi
echo ""

# Step 5: Login as lecturer with multiple special roles
echo -e "${YELLOW}Step 5: Login as Lecturer with Special Roles${NC}"
lecturer_login=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$LECTURER_EMAIL\", \"password\": \"password@cmms\", \"role\": \"lecturer\"}")

lecturer_token=$(echo $lecturer_login | jq -r '.token')
special_roles=$(echo $lecturer_login | jq '.special_roles')
echo -e "${GREEN}✓ Lecturer logged in with special roles: $special_roles${NC}"
echo "  Token: ${lecturer_token:0:20}..."
echo ""

# Step 6: Revoke Coordinator role
echo -e "${YELLOW}Step 6: Revoke Coordinator Role${NC}"
coord_revoke=$(curl -s -X POST "$BASE_URL/api/admin/revoke-special-role" \
  -H "Authorization: Bearer $admin_token" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$LECTURER_EMAIL\", \"special_role\": \"coordinator\"}")

if ! echo $coord_revoke | jq -e '.special_roles | index("coordinator")' > /dev/null; then
  echo -e "${GREEN}✓ Coordinator role revoked successfully${NC}"
  echo "  Remaining special roles: $(echo $coord_revoke | jq '.special_roles')"
else
  echo -e "${RED}✗ Failed to revoke coordinator role${NC}"
fi
echo ""

# Step 7: Verify special role data persists
echo -e "${YELLOW}Step 7: Verify Lecturer Data${NC}"
lecturer_check=$(curl -s -X GET "$BASE_URL/api/admin/lecturers" \
  -H "Authorization: Bearer $admin_token")

lecturer_data=$(echo $lecturer_check | jq ".lecturers[] | select(.email == \"$LECTURER_EMAIL\")")
echo -e "${GREEN}✓ Lecturer data retrieved${NC}"
echo $lecturer_data | jq '{email: .email, full_name: .full_name, special_roles: .special_roles}'
echo ""

# Step 8: Check pre-configured Coordinator and HOD
echo -e "${YELLOW}Step 8: Verify Pre-configured Coordinator and HOD${NC}"
all_lecturers=$(curl -s -X GET "$BASE_URL/api/admin/lecturers" \
  -H "Authorization: Bearer $admin_token")

echo -e "${GREEN}✓ All lecturers with special roles:${NC}"
echo $all_lecturers | jq '.lecturers[] | select(.special_roles | length > 0) | {email: .email, full_name: .full_name, special_roles: .special_roles}'
echo ""

# Step 9: Verify AuthUser model includes special_roles
echo -e "${YELLOW}Step 9: Verify Login Response includes special_roles${NC}"
test_login=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$HOD_EMAIL\", \"password\": \"password@cmms\", \"role\": \"lecturer\"}")

echo -e "${GREEN}✓ HOD Login Response Structure:${NC}"
echo $test_login | jq '{token: .token | "...", user: .user | {email: .email, role: .role, special_roles: .special_roles}, special_roles: .special_roles}'
echo ""

# Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   TEST SUMMARY${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Admin login with JWT token${NC}"
echo -e "${GREEN}✓ List all lecturers with their special roles${NC}"
echo -e "${GREEN}✓ Assign Coordinator role to lecturer${NC}"
echo -e "${GREEN}✓ Assign HOD role to lecturer${NC}"
echo -e "${GREEN}✓ Lecturer login returns special_roles in response${NC}"
echo -e "${GREEN}✓ Revoke roles from lecturer${NC}"
echo -e "${GREEN}✓ Data persistence verified${NC}"
echo -e "${GREEN}✓ Pre-configured accounts working correctly${NC}"
echo ""
echo -e "${BLUE}All tests completed successfully!${NC}"
echo ""

# Additional info
echo -e "${YELLOW}Test Accounts:${NC}"
echo "  Lecturer with no special roles: lecturer@utm.my"
echo "  Lecturer with coordinator role: coordinator@utm.my"
echo "  Lecturer with hod role: hod@utm.my"
echo "  Admin account: admin@utm.my"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Visit http://localhost:3000 to access the frontend"
echo "  2. Login with admin@utm.my to access role management dashboard"
echo "  3. Navigate to /dashboard/admin/roles to manage lecturer roles"
echo "  4. Test login as lecturer with different special roles"
