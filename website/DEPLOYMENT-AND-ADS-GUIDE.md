# Drift Landing Page - Deployment & Google Ads Guide

## Quick Start

### Files Created
```
website/
├── index.html          # Main landing page (SEO-optimized)
├── styles.css          # Styling with Drift branding
├── script.js           # Interactivity and animations
├── images/             # Add your images here
└── DEPLOYMENT-AND-ADS-GUIDE.md
```

---

## Part 1: Deploying to Hostinger (Drift-Global.com)

### Step 1: Prepare Your Images
Add these images to the `website/images/` folder:

| File | Size | Description |
|------|------|-------------|
| `drift-logo.png` | 200x50px | Main logo |
| `drift-logo-white.png` | 200x50px | White version for dark backgrounds |
| `favicon.png` | 32x32px | Browser tab icon |
| `apple-touch-icon.png` | 180x180px | iOS bookmark icon |
| `drift-og-image.png` | 1200x630px | Social sharing image (shows when shared on FB, Twitter) |
| `google-play-badge.png` | 646x250px | [Download from Google](https://play.google.com/intl/en_us/badges/) |
| `app-store-badge.png` | 646x250px | [Download from Apple](https://developer.apple.com/app-store/marketing/guidelines/) |
| `app-mockup.png` | 400x800px | Phone mockup with app screenshot |
| `phone-hand.png` | 500x500px | Hand holding phone |
| `driver-hero.png` | 600x400px | Happy driver image |

### Step 2: Upload to Hostinger

1. **Log in to Hostinger** → Go to hPanel
2. **Navigate to**: Files → File Manager
3. **Open**: `public_html` folder
4. **Upload** all files from the `website/` folder:
   - index.html
   - styles.css
   - script.js
   - images/ folder with all images

### Step 3: Enable SSL (HTTPS)

1. In hPanel → Security → SSL
2. Enable free SSL for drift-global.com
3. Force HTTPS redirect

### Step 4: Verify the Site

Visit https://drift-global.com and check:
- [ ] Logo displays correctly
- [ ] All images load
- [ ] Google Play button works
- [ ] Mobile responsive works
- [ ] All links work

---

## Part 2: Google Ads Campaign Strategy

### Campaign Structure

Create **3 separate campaigns** for best results:

---

### CAMPAIGN 1: Transportation Searches (High Intent)

**Campaign Name**: Drift - Cayman Transportation
**Daily Budget**: $20-50/day
**Bidding**: Maximize Conversions (app installs)

#### Ad Group 1: General Transportation
**Keywords** (Phrase Match):
```
"transportation cayman islands"
"transportation grand cayman"
"how to get around cayman islands"
"getting around grand cayman"
"cayman islands transportation options"
"grand cayman travel options"
```

**Ad Copy 1**:
```
Headline 1: Transportation in Cayman Islands
Headline 2: Download the Drift App Today
Headline 3: Safe, Affordable, Local Drivers
Description 1: Need a ride in Grand Cayman? Drift connects you with verified local drivers instantly. No cash needed.
Description 2: The easiest way to get around the Cayman Islands. Download free on Google Play!
```

**Ad Copy 2**:
```
Headline 1: Get Around Grand Cayman Easily
Headline 2: Drift Ride App - Download Now
Headline 3: Upfront Pricing, 24/7 Service
Description 1: Tourists & locals trust Drift for safe rides across Grand Cayman. Try it free today!
Description 2: From the airport to Seven Mile Beach - Drift takes you anywhere on the island.
```

#### Ad Group 2: Taxi Alternative
**Keywords**:
```
"taxi cayman islands"
"taxi grand cayman"
"grand cayman taxi app"
"cayman taxi service"
"taxi from airport cayman"
"seven mile beach taxi"
"george town taxi"
```

**Ad Copy**:
```
Headline 1: Better Than a Taxi - Drift App
Headline 2: Transparent Pricing in Cayman
Headline 3: No Cash, No Surprises
Description 1: Skip the taxi hassle. Drift shows you the fare before you book. Cashless, safe, reliable.
Description 2: Grand Cayman's modern ride-sharing app. Local drivers who know the island.
```

#### Ad Group 3: Uber/Lyft Alternative
**Keywords**:
```
"uber cayman islands"
"lyft cayman islands"
"is there uber in cayman"
"ride share cayman islands"
"uber alternative grand cayman"
"rideshare app cayman"
```

**Ad Copy**:
```
Headline 1: No Uber in Cayman? Use Drift!
Headline 2: Cayman's Own Ride-Share App
Headline 3: Same Convenience, Local Service
Description 1: Uber & Lyft don't operate in Cayman Islands. Drift is the local alternative - same great experience!
Description 2: Book rides instantly, track your driver, pay through the app. Download Drift today.
```

---

### CAMPAIGN 2: Tourist Arrivals (Airport & Hotels)

**Campaign Name**: Drift - Tourist Arrivals
**Daily Budget**: $15-30/day
**Location Targeting**: Show to people IN Cayman Islands + people searching FROM USA, UK, Canada

#### Ad Group 1: Airport Transfers
**Keywords**:
```
"owen roberts airport transfer"
"grand cayman airport transportation"
"airport to hotel grand cayman"
"cayman airport taxi"
"how to get from airport grand cayman"
"airport pickup cayman"
```

**Ad Copy**:
```
Headline 1: Grand Cayman Airport Pickup
Headline 2: Drift App - Book Before You Land
Headline 3: Smooth Airport Transfer
Description 1: Landing at Owen Roberts Airport? Have a Drift ride ready. Book in seconds, pay cashless.
Description 2: Your driver will be waiting. Get to Seven Mile Beach or your hotel hassle-free.
```

#### Ad Group 2: Hotel & Resort Areas
**Keywords**:
```
"seven mile beach transportation"
"seven mile beach shuttle"
"grand cayman resort transportation"
"how to get to seven mile beach"
"george town to seven mile beach"
```

**Ad Copy**:
```
Headline 1: Seven Mile Beach Rides
Headline 2: Drift - Your Cayman Driver
Headline 3: Beach, Town, Anywhere
Description 1: Exploring Seven Mile Beach? Drift gets you to restaurants, bars, and attractions easily.
Description 2: Verified local drivers. Safe rides. Download the Drift app free.
```

---

### CAMPAIGN 3: Brand Awareness (Broad Reach)

**Campaign Name**: Drift - Cayman Brand
**Daily Budget**: $10-20/day
**Bidding**: Maximize Clicks

#### Ad Group: Cayman Travel Interest
**Keywords**:
```
"cayman islands vacation"
"grand cayman travel tips"
"things to do grand cayman"
"visiting cayman islands"
"cayman islands tourism"
"stingray city tour"
"rum point cayman"
```

**Ad Copy**:
```
Headline 1: Visiting Grand Cayman?
Headline 2: Get the Drift Ride App
Headline 3: Locals' Favorite Transport
Description 1: Explore all of Grand Cayman with ease. Drift connects you with friendly local drivers.
Description 2: From Stingray City to Rum Point - get there safely with Drift. Download free!
```

---

## Google Ads Setup Checklist

### 1. Create Google Ads Account
- Go to: https://ads.google.com
- Create account with drift-global.com email

### 2. Set Up Conversion Tracking
```
Track these conversions:
- Google Play Store clicks (URL contains play.google.com)
- Page scroll > 75%
- Time on site > 30 seconds
```

### 3. Link Google Analytics
- Create Google Analytics 4 property for drift-global.com
- Add tracking code to index.html (uncomment the GA section)
- Link GA4 to Google Ads

### 4. Set Up Extensions

**Sitelink Extensions**:
- Download App → play.google.com link
- How It Works → #how-it-works
- Become a Driver → #drive
- FAQ → #faq

**Callout Extensions**:
- 24/7 Availability
- Cashless Payments
- Verified Drivers
- Upfront Pricing
- Local Drivers

**Call Extension** (if you have a support number):
- +1-345-XXX-XXXX

### 5. Location Settings
- Target: Cayman Islands (primary)
- Target: People searching FOR Cayman Islands from USA, UK, Canada
- Exclude: Locations where app doesn't work

### 6. Device Targeting
- **Mobile**: Primary (80% budget) - these users can download immediately
- **Desktop**: Secondary (20% budget) - for trip planners

### 7. Ad Schedule
- 24/7 OR focus on:
  - Peak travel booking times (evenings, weekends)
  - Arrival times (afternoon/evening local time)

---

## Estimated Budget & Results

### Conservative Budget: $30/day ($900/month)
- Expected clicks: 150-300/day
- Expected installs: 10-30/day
- Cost per install: $1-3

### Moderate Budget: $75/day ($2,250/month)
- Expected clicks: 400-800/day
- Expected installs: 30-80/day
- Cost per install: $0.80-2.50

### Aggressive Budget: $150/day ($4,500/month)
- Expected clicks: 800-1500/day
- Expected installs: 80-200/day
- Cost per install: $0.70-2.00

---

## SEO Tips for Organic Traffic

### Quick Wins

1. **Google My Business**
   - Create listing for "Drift - Cayman Islands Ride App"
   - Add photos, hours (24/7), and link to website

2. **Submit to Search Engines**
   - Google Search Console: https://search.google.com/search-console
   - Bing Webmaster Tools: https://www.bing.com/webmasters

3. **Create Backlinks**
   - List on Cayman tourism websites
   - Partner with hotels/resorts for mentions
   - Local Cayman news/blog mentions

4. **Content Marketing**
   - Add a `/blog` section with articles like:
     - "10 Best Things to Do in Grand Cayman"
     - "How to Get From the Airport to Seven Mile Beach"
     - "Cayman Islands Transportation Guide 2024"

### Long-term SEO

- Target 1-2 new keywords monthly with blog content
- Build partnerships with Cayman tourism sites
- Encourage users to review on Google Play (better rankings)

---

## Support

Questions? The landing page is built with:
- Pure HTML/CSS/JS (no frameworks)
- Fully responsive design
- SEO-optimized meta tags and schema markup
- Fast loading (optimized for Core Web Vitals)

Made for Drift - Cayman Islands Ride App
