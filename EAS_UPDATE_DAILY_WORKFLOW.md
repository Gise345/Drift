# 🔄 Drift - EAS Update Daily Workflow Guide

## Complete guide for publishing updates, testing, and managing your live app

---

## 🎯 QUICK REFERENCE

### Most Common Commands

```bash
# Push update to all users (PRODUCTION)
eas update --branch production --message "Bug fixes and improvements"

# Test with team first (PREVIEW)
eas update --branch preview --message "Testing new feature"

# See what's live
eas update:list --branch production

# Rollback if something breaks
eas update:rollback --branch production
```

---

## 📊 UNDERSTANDING BRANCHES

Think of branches like different versions of your app running simultaneously:

### Production Branch
- **Who sees it:** ALL users who downloaded from Play Store
- **When to use:** Stable, tested features and bug fixes
- **Command:** `eas update --branch production --message "..."`

### Preview Branch  
- **Who sees it:** Your internal testing team
- **When to use:** Testing features before releasing to everyone
- **Command:** `eas update --branch preview --message "..."`
- **Note:** Requires a preview build: `eas build --profile preview`

### Development Branch
- **Who sees it:** Just you on your dev machine
- **When to use:** Local testing
- **Command:** `eas update --branch development --message "..."`
- **Note:** Use with dev client: `eas build --profile development`

---

## 🚀 DAILY WORKFLOWS

### Workflow 1: Quick Bug Fix (Most Common)

**Scenario:** User reports app crash, you need to fix it ASAP

```bash
# 1. Fix the bug in your code
# Edit the file, test locally
npx expo start

# 2. Test that it works
# Verify the fix on your local device

# 3. Commit to git (optional but recommended)
git add .
git commit -m "Fix: Profile screen crash on Android"
git push

# 4. Push fix to ALL users
eas update --branch production --message "Fixed profile screen crash"

# 5. Verify it published
eas update:view --branch production

# Done! Users get the fix in 5-30 minutes 🎉
```

**Timeline:**
- 10am: Bug reported
- 10:30am: Fixed and tested
- 10:35am: Published
- 11am: All users have the fix

---

### Workflow 2: New Feature (Safe Method)

**Scenario:** Built new "favorite locations" feature, want to test before releasing

```bash
# 1. Build the feature
# Code your new feature

# 2. Test locally thoroughly
npx expo start

# 3. Push to PREVIEW for team testing
eas update --branch preview --message "New feature: Favorite locations"

# 4. Your team tests it on preview build
# (They need preview build installed: eas build --profile preview)

# 5. Team confirms it works!

# 6. Push to PRODUCTION for all users
eas update --branch production --message "New feature: Save your favorite pickup locations"

# 7. Monitor for issues
eas update:view --branch production

# Done! Feature live for everyone in 30 minutes 🎉
```

**Timeline:**
- Monday 2pm: Feature complete
- Monday 2:15pm: Published to preview
- Monday 2:30pm: Team tests
- Monday 4pm: Published to production
- Monday 4:30pm: All users have new feature

---

### Workflow 3: Multiple Small Updates (Continuous Improvement)

**Scenario:** Fixed 3 bugs today, want to push them all at once

```bash
# Morning: Fixed bug #1
# Afternoon: Fixed bug #2  
# Evening: Fixed bug #3

# Test all fixes
npx expo start

# Push all at once
eas update --branch production --message "Bug fixes: Profile crash, map loading, payment flow"

# Monitor
eas update:view --branch production
```

---

### Workflow 4: Emergency Rollback

**Scenario:** Just pushed an update and users are reporting crashes!

```bash
# OH NO! The update broke something

# 1. Immediately rollback to previous version
eas update:rollback --branch production

# 2. Verify rollback
eas update:view --branch production

# Users now have the previous working version! ✅

# 3. Fix the bug locally
# Fix the issue

# 4. Test thoroughly
npx expo start

# 5. Push the fix
eas update --branch production --message "Fixed issue from previous update"

# Crisis averted! 🎉
```

**Timeline:**
- 2pm: Published bad update
- 2:15pm: Users reporting crashes
- 2:16pm: Rolled back
- 2:20pm: Users have working version again
- 3pm: Fixed and re-published

---

### Workflow 5: Staged Rollout (Cautious Approach)

**Scenario:** Major feature, want to release to small group first

```bash
# 1. Build major feature
# Code your feature

# 2. Test extensively locally
npx expo start

# 3. Push to 10% of users first
eas update --branch production --message "New trip scheduling feature" --rollout-percentage 10

# 4. Monitor for 2 hours
# Check Firebase Crashlytics, user feedback

# 5. All good? Increase to 50%
eas update:republish --branch production --rollout-percentage 50

# 6. Still good? Push to everyone
eas update:republish --branch production --rollout-percentage 100

# Done! Safely rolled out to all users 🎉
```

---

## 🎯 WEEKLY ROUTINE

### Monday Morning Ritual

```bash
# Check what's currently live
eas update:view --branch production

# See update history
eas update:list --branch production --limit 10

# Check any issues over weekend
# Review Firebase Crashlytics
# Check support emails

# Plan week's updates
```

### Friday Afternoon Deploy

```bash
# Week's work complete
# Test everything

# Push weekly update
eas update --branch production --message "Week of Dec 2: Map improvements, payment flow updates, bug fixes"

# Monitor over weekend
# Check Crashlytics Saturday morning
```

---

## 📅 MONTHLY PROCESS

### When You Need Play Store Update (Native Changes)

**Scenario:** Added new native package (like push notifications)

```bash
# 1. Install native package
npm install @react-native-firebase/messaging

# 2. Update version numbers in app.config.js
# Change:
# version: "1.0.0" → "1.1.0"
# android.versionCode: 1 → 2

# 3. Build new binary for Play Store
eas build --platform android --profile production

# 4. Wait for build (15-30 minutes)

# 5. Download AAB
# Get link from terminal or expo.dev

# 6. Upload to Play Console
# Go to play.google.com/console
# Create new release
# Upload AAB

# 7. Wait for Google approval (1-3 days)

# 8. After approved, users download from Play Store

# 9. THEN go back to using EAS Update for JavaScript changes
eas update --branch production --message "Bug fixes"

# Back to instant updates! 🎉
```

**When do you need Play Store update?**
- ❌ New native dependencies (push notifications, camera packages)
- ❌ Permission changes (new location, camera permissions)
- ❌ Google Services updates
- ❌ SDK version upgrades

**What can you update with EAS Update?**
- ✅ All JavaScript/TypeScript code (99% of changes)
- ✅ UI changes, new screens, styling
- ✅ Bug fixes
- ✅ Business logic
- ✅ Images, fonts, assets

---

## 🔍 MONITORING COMMANDS

### Check Current Status

```bash
# What's live on production?
eas update:view --branch production

# What's live on preview?
eas update:view --branch preview

# Show as JSON for parsing
eas update:view --branch production --json
```

### View Update History

```bash
# Last 10 updates
eas update:list --branch production --limit 10

# Last 20 updates
eas update:list --branch production --limit 20

# All updates
eas update:list --branch production

# Export to file
eas update:list --branch production --json > updates.json
```

### Check Update Adoption

```bash
# See how many users on each version
eas update:view --branch production

# This shows:
# - Update ID
# - Created date
# - Message
# - Rollout percentage
```

---

## 🎨 MESSAGE BEST PRACTICES

### Good Messages (Clear, Specific)

```bash
✅ eas update --branch production --message "Fixed map loading on slow connections"
✅ eas update --branch production --message "New feature: Save favorite addresses"
✅ eas update --branch production --message "Improved payment flow, fixed profile crash"
✅ eas update --branch production --message "Week of Dec 2: Bug fixes and performance improvements"
```

### Bad Messages (Vague, Unclear)

```bash
❌ eas update --branch production --message "update"
❌ eas update --branch production --message "fixes"
❌ eas update --branch production --message "stuff"
❌ eas update --branch production --message "test"
```

**Why it matters:**
- You'll want to know what each update did
- Helps debug when something breaks
- Good for team communication
- Shows in analytics

---

## 🚨 TROUBLESHOOTING

### Issue: "Update not applying to users"

**Check 1: Runtime version matches**
```bash
# Check your app.config.js version
cat app.config.js | grep version

# Check update's runtime version
eas update:view --branch production

# They should match!
```

**Check 2: Channel matches**
```bash
# Check your eas.json channel
cat eas.json | grep channel

# Should match branch you're publishing to
```

**Fix:**
```bash
# Rebuild with correct channel
eas build --platform android --profile production

# Then publish update
eas update --branch production --message "Fix"
```

---

### Issue: "Users see old version"

**Causes:**
- User hasn't opened app since update
- User has no internet connection
- Update check hasn't run yet

**Solution:**
```bash
# 1. Verify update is published
eas update:view --branch production

# 2. Ask user to:
# - Close app completely
# - Ensure internet connection
# - Open app again
# - Wait 10-20 seconds

# 3. If still not working, check their app version matches
```

---

### Issue: "Can't publish update"

**Error:** "No project ID found"

**Fix:**
```bash
# Configure EAS Update
eas update:configure

# Verify project ID in app.config.js
cat app.config.js | grep projectId
```

---

## 📊 DRIFT-SPECIFIC EXAMPLES

### Common Drift Updates

**Map Improvements:**
```bash
eas update --branch production --message "Improved Google Maps loading speed and reliability"
```

**Payment Updates:**
```bash
eas update --branch production --message "Enhanced Stripe checkout flow with better error handling"
```

**Driver Features:**
```bash
eas update --branch production --message "Driver app: Improved navigation accuracy and turn-by-turn guidance"
```

**Rider Features:**
```bash
eas update --branch production --message "Rider app: Added trip history filtering and search"
```

**Bug Fixes:**
```bash
eas update --branch production --message "Fixed: Profile screen crash on Android 13, map not loading on startup"
```

**Legal Updates:**
```bash
eas update --branch production --message "Updated privacy policy and terms of service"
```

---

## 🎯 BEST PRACTICES CHECKLIST

### Before Every Production Update

- [ ] Tested locally with `npx expo start`
- [ ] Tested on physical device
- [ ] Committed to git
- [ ] Wrote clear update message
- [ ] Checked no breaking changes
- [ ] Ready to monitor for issues

### After Every Production Update

- [ ] Ran `eas update:view --branch production` to verify
- [ ] Checked Firebase Crashlytics (after 15 min)
- [ ] Monitored support emails
- [ ] Ready to rollback if needed

### Weekly Review

- [ ] Review all updates from past week
- [ ] Check crash rates in Firebase
- [ ] Review user feedback
- [ ] Plan next week's updates

---

## 🔐 SECURITY BEST PRACTICES

### Never Push Sensitive Data

```bash
# ❌ DON'T include in updates:
# - API keys in code (use env variables)
# - Passwords or secrets
# - User data or PII
# - Internal URLs or endpoints

# ✅ DO use environment variables:
# - In app.config.js
# - Set in eas.json
# - Never hardcode
```

### Use Branches Properly

```bash
# ✅ DO:
# - Test in preview first
# - Use production for stable releases
# - Keep development for local testing

# ❌ DON'T:
# - Push untested code to production
# - Skip testing in preview
# - Use production for experiments
```

---

## 📈 TRACKING YOUR UPDATES

### Keep a Log

Create `UPDATES.md` in your project:

```markdown
# Drift Update Log

## 2024-12-02
- 2:30pm: Published fix for map loading (production)
- Status: ✅ Success, no issues

## 2024-12-01
- 9am: New favorite locations feature (preview)
- 2pm: Promoted to production
- Status: ✅ Success, positive feedback

## 2024-11-30
- 10am: Payment flow improvements (production)
- 11am: Rolled back due to crashes
- 2pm: Fixed and republished
- Status: ✅ Success after rollback
```

### Use Git Tags

```bash
# Tag each production update
git tag -a v1.0.1 -m "Fixed map loading"
git push --tags

# View tags
git tag -l
```

---

## 🎉 SUCCESS METRICS

### You're Doing It Right When:

- ✅ Fixing bugs in < 1 hour from report to users
- ✅ Publishing 2-3 updates per week
- ✅ Zero rollbacks (or quick recovery when needed)
- ✅ Users don't notice updates happening
- ✅ Crash rates stay low
- ✅ Positive user feedback on quick fixes

### Red Flags:

- 🚨 Publishing to production without testing
- 🚨 Multiple rollbacks per week
- 🚨 Crash rate increasing after updates
- 🚨 Users reporting "app keeps breaking"
- 🚨 Not monitoring after updates

---

## 📞 QUICK COMMAND REFERENCE

```bash
# MOST COMMON
eas update --branch production --message "..."    # Push to all users
eas update:view --branch production               # See what's live
eas update:list --branch production               # View history
eas update:rollback --branch production           # Emergency rollback

# TESTING
eas update --branch preview --message "..."       # Push to test group
eas update --branch development --message "..."   # Local testing

# MONITORING
eas update:view --branch production --json        # JSON output
eas update:list --branch production --limit 10    # Last 10 updates

# STAGED ROLLOUTS
eas update --branch production --message "..." --rollout-percentage 10
eas update:republish --branch production --rollout-percentage 50
eas update:republish --branch production --rollout-percentage 100

# CONFIGURATION
eas update:configure                              # Setup/verify config
eas project:info                                  # View project info
```

---

## 🎯 YOUR CHRISTMAS 2025 LAUNCH SCHEDULE

### December 2024 - Pre-Launch

**Week 1-2:** Polish app, fix all critical bugs
```bash
# Daily updates as you fix issues
eas update --branch production --message "Bug fixes"
```

**Week 3:** Freeze features, bug fixes only
```bash
# Only critical fixes
eas update --branch production --message "Critical: Fixed payment processing"
```

**Week 4:** Final testing
```bash
# No updates unless emergency
```

### Christmas 2025 - Launch Week

**Launch Day:**
```bash
# Final update before launch
eas update --branch production --message "Christmas 2025 launch! Welcome to Drift 🎉"
```

**Post-Launch:**
```bash
# Monitor closely, fix issues immediately
# Update 2-3 times per day if needed
eas update --branch production --message "Hotfix: [issue]"
```

### January 2025 - Post-Launch

**Week 1:** Rapid iteration
```bash
# Daily updates based on user feedback
```

**Week 2+:** Stable release schedule
```bash
# 2-3 updates per week
# Every Monday: Feature updates
# As needed: Bug fixes
```

---

## 💡 PRO TIPS

### Tip 1: Update During Low-Traffic Hours
```bash
# Update at 3am local time (when fewest users active)
eas update --branch production --message "..."

# Users get it when they wake up
```

### Tip 2: Use Git Commit Messages
```bash
# Use your commit message
git commit -m "Fixed map loading issue"
eas update --branch production --message "$(git log -1 --pretty=%B)"
```

### Tip 3: Create Update Aliases
```bash
# Add to your .bashrc or .zshrc
alias drift-prod='eas update --branch production --message'
alias drift-prev='eas update --branch preview --message'

# Usage:
drift-prod "Bug fixes"
drift-prev "Testing new feature"
```

### Tip 4: Monitor After Every Update
```bash
# Set a 15-minute timer
# Check Firebase Crashlytics
# Check support emails
# Check Play Store reviews
```

---

## 🎓 LEARNING CURVE

### Week 1: Getting Comfortable
- Publish 1-2 test updates
- Practice rollback
- Learn monitoring

### Week 2: Daily Updates
- Fix bugs as reported
- Build confidence
- Establish routine

### Week 3: Advanced Usage
- Staged rollouts
- Preview testing
- Update scheduling

### Week 4: Expert
- Multiple updates per day
- Quick bug fixes
- Confident in process

---

## 🏆 GOAL

By Christmas 2025:
- ✅ Fixing bugs in < 30 minutes
- ✅ Publishing 3-5 updates per week
- ✅ Zero user-facing issues from updates
- ✅ Users love the fast improvements
- ✅ Drift is the most responsive app on Cayman

---

## 📚 ADDITIONAL RESOURCES

**Full Guides:**
- EAS_UPDATE_AUTOMATIC_UPDATES_GUIDE.md
- EAS_UPDATE_COMMANDS.md
- EAS_UPDATE_IMPLEMENTATION.md

**Official Docs:**
- https://docs.expo.dev/eas-update/

**Support:**
- support@drift-global.com
- Expo Forums: https://forums.expo.dev

---

**Save this document and reference it daily!** 📌

**Your app just became 100x more maintainable!** 🚀🎉
