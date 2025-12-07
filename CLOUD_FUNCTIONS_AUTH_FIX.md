# Cloud Functions UNAUTHENTICATED Error Fix

## Problem

After redeploying Firebase Cloud Functions (v2/Gen 2) to a new region, you may encounter:

```
ERROR: UNAUTHENTICATED
The request was not authorized to invoke this service.
```

This happens even when:
- User is logged in with valid Firebase Auth
- `getIdToken()` returns a valid token
- Token length is correct (e.g., 1173 characters)
- Function code has proper `request.auth` checks

## Root Cause

Firebase Cloud Functions v2 (Gen 2) run on **Cloud Run**. When functions are deployed to a new region or redeployed after failures, the **IAM permissions are not automatically set**.

By default, Cloud Run requires IAM authentication at the infrastructure level, which blocks requests before Firebase can validate the auth token.

## Security Model (Safe to Use)

```
Public Access (Cloud Run IAM: allUsers)
              ↓
    Firebase SDK validates token automatically
              ↓
    request.auth is populated (or null if invalid/missing token)
              ↓
    Your function code checks: if (!request.auth) → REJECT with 'unauthenticated'
              ↓
    Process request with verified user (request.auth.uid)
```

**Important:** Setting `allUsers` as Cloud Run Invoker does NOT bypass Firebase Authentication. It only allows the request to reach Cloud Run. Firebase still validates the auth token, and your function code still rejects unauthenticated users.

## Solution

### Prerequisites

1. Install Google Cloud CLI: https://cloud.google.com/sdk/docs/install
2. Authenticate: `gcloud auth login`

### PowerShell Script

Save as `set-cloud-run-iam.ps1` and run:

```powershell
# Cloud Functions IAM Permission Setup Script
# Sets allUsers -> Cloud Run Invoker for all Stripe functions
# Security: All functions verify Firebase Auth token via request.auth check

Write-Host "=====================================" -ForegroundColor Yellow
Write-Host "CLOUD FUNCTIONS IAM PERMISSION SETUP" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Security Model:" -ForegroundColor Cyan
Write-Host "  1. Cloud Run allows public invocation (allUsers)" -ForegroundColor White
Write-Host "  2. Firebase SDK validates auth token automatically" -ForegroundColor White
Write-Host "  3. Function code rejects if request.auth is null" -ForegroundColor White
Write-Host "  4. Only authenticated Firebase users can execute" -ForegroundColor White
Write-Host ""

# Stripe functions
$stripeFunctions = @(
    "getstripepaymentmethods",
    "getorcreatestripecustomer",
    "createstripepaymentintent",
    "confirmstripepayment",
    "createstripesetupintent",
    "confirmstripesetupintent",
    "refundstripepayment",
    "removestripepaymentmethod",
    "setdefaultstripepaymentmethod",
    "getstripepaymentstatus",
    "updatedriverearnings"
)

# Safety functions
$safetyFunctions = @(
    "issuestrike",
    "resolveappeal",
    "resolvedispute",
    "getsafetydashboard"
)

# Messaging functions
$messagingFunctions = @(
    "sendmessagenotification"
)

# Tracking functions
$trackingFunctions = @(
    "createtrackingsession",
    "updatetrackinglocation",
    "completetrackingsession",
    "gettrackingsession"
)

# Combine all functions
$allFunctions = $stripeFunctions + $safetyFunctions + $messagingFunctions + $trackingFunctions

Write-Host "Updating $($allFunctions.Count) functions..." -ForegroundColor Cyan
Write-Host ""

foreach ($fn in $allFunctions) {
    Write-Host "Setting allUsers -> Cloud Run Invoker for: $fn" -ForegroundColor White
    gcloud run services add-iam-policy-binding $fn `
        --region=us-east1 `
        --member="allUsers" `
        --role="roles/run.invoker" `
        --project=drift-global `
        --quiet 2>$null

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Done" -ForegroundColor Green
    } else {
        Write-Host "  Skipped (may not exist or already set)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Yellow
Write-Host "COMPLETE" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Yellow
```

### Single Command (Quick Fix)

For just Stripe functions:

```powershell
@("getstripepaymentmethods","getorcreatestripecustomer","createstripepaymentintent","confirmstripepayment","createstripesetupintent","confirmstripesetupintent","refundstripepayment","removestripepaymentmethod","setdefaultstripepaymentmethod","getstripepaymentstatus","updatedriverearnings") | ForEach-Object { gcloud run services add-iam-policy-binding $_ --region=us-east1 --member="allUsers" --role="roles/run.invoker" --project=drift-global --quiet }
```

### Manual Fix (Google Cloud Console)

1. Go to: https://console.cloud.google.com/run?project=drift-global
2. Click on each function service
3. Go to **PERMISSIONS** tab
4. Click **+ GRANT ACCESS**
5. Add principal: `allUsers`
6. Select role: `Cloud Run Invoker`
7. Save

## Function Code Requirements

Every callable function MUST have this auth check at the beginning:

```typescript
export const myFunction = onCall(callableOptions, async (request) => {
  // REQUIRED: Verify Firebase authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Safe to proceed - user is authenticated
  const userId = request.auth.uid;
  // ... rest of function
});
```

## Prevention

In `functions/src/*.ts`, use these callable options to auto-set permissions on deploy:

```typescript
const callableOptions = {
  region: 'us-east1' as const,
  invoker: 'public' as const, // Sets allUsers on deploy
};

export const myFunction = onCall(callableOptions, async (request) => {
  // ...
});
```

**Note:** The `invoker: 'public'` option should set permissions automatically, but if deployment fails and retries, permissions may not be applied. Always verify after region changes.

## Verification

Check current IAM policy for a function:

```powershell
gcloud run services get-iam-policy getstripepaymentmethods --region=us-east1 --project=drift-global
```

Should show:

```yaml
bindings:
- members:
  - allUsers
  role: roles/run.invoker
```

## Related Issues

- GitHub: [invertase/react-native-firebase#8492](https://github.com/invertase/react-native-firebase/issues/8492)
- Stack Overflow: [Firebase Functions v2 UNAUTHENTICATED](https://stackoverflow.com/questions/76380806/firebase-cloud-functions-v2-the-request-was-not-authorized-to-invoke-this-servi)

## Date

Last updated: 2025-12-06
