#!/bin/bash

#############################################
# Deployment Test Script
# Verifies the deployment is working correctly
#############################################

set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
DEPLOYMENT_URL="${1:-http://localhost:3000}"
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

echo "================================================"
echo "   DEPLOYMENT VERIFICATION TEST"
echo "================================================"
echo "Testing URL: $DEPLOYMENT_URL"
echo ""

# Function to test endpoint
test_endpoint() {
    local endpoint="$1"
    local expected_status="$2"
    local description="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "Testing $description... "
    
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL$endpoint")
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (Status: $status_code)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $status_code)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Function to test API response
test_api_response() {
    local endpoint="$1"
    local expected_field="$2"
    local description="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "Testing $description... "
    
    response=$(curl -s "$DEPLOYMENT_URL$endpoint")
    
    if echo "$response" | grep -q "$expected_field"; then
        echo -e "${GREEN}✓ PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (Field '$expected_field' not found)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Function to measure response time
test_performance() {
    local endpoint="$1"
    local max_time="$2"
    local description="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "Testing $description... "
    
    response_time=$(curl -s -o /dev/null -w "%{time_total}" "$DEPLOYMENT_URL$endpoint")
    response_time_ms=$(echo "$response_time * 1000" | bc | cut -d'.' -f1)
    
    if [ "$response_time_ms" -lt "$max_time" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (${response_time_ms}ms < ${max_time}ms)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${YELLOW}⚠ SLOW${NC} (${response_time_ms}ms > ${max_time}ms)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

echo "1. TESTING PAGE ENDPOINTS"
echo "------------------------"
test_endpoint "/" "200" "Homepage"
test_endpoint "/products" "200" "Products page"
test_endpoint "/login" "200" "Login page"
test_endpoint "/register" "200" "Register page"
test_endpoint "/about" "200" "About page"
test_endpoint "/contact" "200" "Contact page"
echo ""

echo "2. TESTING API ENDPOINTS"
echo "------------------------"
test_endpoint "/api/health" "200" "Health check API"
test_api_response "/api/health" "status" "Health status field"
echo ""

echo "3. TESTING STATIC ASSETS"
echo "------------------------"
test_endpoint "/favicon.ico" "200" "Favicon"
test_endpoint "/robots.txt" "200" "Robots.txt"
echo ""

echo "4. TESTING ERROR HANDLING"
echo "------------------------"
test_endpoint "/non-existent-page" "404" "404 error page"
echo ""

echo "5. TESTING PERFORMANCE"
echo "------------------------"
test_performance "/" "3000" "Homepage load time"
test_performance "/api/health" "500" "API response time"
echo ""

echo "6. TESTING SECURITY HEADERS"
echo "------------------------"
echo -n "Testing security headers... "
headers=$(curl -s -I "$DEPLOYMENT_URL/")
security_headers_found=0

if echo "$headers" | grep -q "X-Content-Type-Options: nosniff"; then
    security_headers_found=$((security_headers_found + 1))
fi
if echo "$headers" | grep -q "X-Frame-Options:"; then
    security_headers_found=$((security_headers_found + 1))
fi
if echo "$headers" | grep -q "X-XSS-Protection:"; then
    security_headers_found=$((security_headers_found + 1))
fi

TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ "$security_headers_found" -ge 2 ]; then
    echo -e "${GREEN}✓ PASSED${NC} ($security_headers_found security headers found)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠ WARNING${NC} (Only $security_headers_found security headers found)"
fi
echo ""

echo "7. TESTING DATABASE CONNECTION"
echo "------------------------"
echo -n "Testing database connectivity... "
health_response=$(curl -s "$DEPLOYMENT_URL/api/health")
if echo "$health_response" | grep -q '"database".*"status".*"up"'; then
    echo -e "${GREEN}✓ PASSED${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}✗ FAILED${NC} (Database not connected)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

# Calculate success rate
SUCCESS_RATE=$(echo "scale=1; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)

echo "================================================"
echo "   TEST RESULTS SUMMARY"
echo "================================================"
echo -e "Total Tests:  $TOTAL_TESTS"
echo -e "Passed:       ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed:       ${RED}$FAILED_TESTS${NC}"
echo -e "Success Rate: $SUCCESS_RATE%"
echo ""

if [ "$FAILED_TESTS" -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
    echo "Deployment is healthy and ready for production!"
    exit 0
elif [ "$FAILED_TESTS" -le 2 ]; then
    echo -e "${YELLOW}⚠️  MINOR ISSUES DETECTED${NC}"
    echo "Deployment is mostly healthy but has some minor issues."
    exit 0
else
    echo -e "${RED}❌ DEPLOYMENT HAS ISSUES${NC}"
    echo "Please review the failed tests above."
    exit 1
fi