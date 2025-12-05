/**
 * DRIFT DRIVER FAQ DATA
 * 
 * Comprehensive FAQ for Cayman Islands drivers
 * Categories: Getting Started, Earnings, Rides, Documents, Vehicle, Account, Safety, Technical
 */

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
  helpful?: number;
}

export const driverFAQs: FAQItem[] = [
  // ==================== GETTING STARTED ====================
  {
    id: 'gs-1',
    question: 'How do I become a Drift driver in the Cayman Islands?',
    answer: 'To become a Drift driver, you must: (1) Be at least 21 years old, (2) Have a valid Cayman Islands driver\'s license, (3) Own or lease a vehicle that meets our requirements, (4) Have valid vehicle insurance, and (5) Complete the online registration process. The approval process typically takes 3-5 business days.',
    category: 'Getting Started',
    keywords: ['become driver', 'sign up', 'requirements', 'register', 'join'],
  },
  {
    id: 'gs-2',
    question: 'How long does the application process take?',
    answer: 'The application process typically takes 3-5 business days once you\'ve submitted all required documents. Vehicle inspection scheduling depends on availability but is usually within 1-2 days. You\'ll receive email and app notifications at each stage.',
    category: 'Getting Started',
    keywords: ['application', 'approval', 'how long', 'waiting', 'time'],
  },
  {
    id: 'gs-3',
    question: 'How do I start accepting rides?',
    answer: 'Once your registration is approved: (1) Open the Drift Driver app, (2) Go to your Dashboard, (3) Toggle the "Go Online" switch to start receiving ride requests in your area. When you receive a request, you\'ll have 15 seconds to accept or decline. Make sure you\'re in a safe location when going online.',
    category: 'Getting Started',
    keywords: ['start driving', 'go online', 'accept rides', 'begin'],
  },
  {
    id: 'gs-4',
    question: 'What hours can I drive?',
    answer: 'You can drive whenever you want - Drift operates 24/7 in the Cayman Islands. However, peak demand hours are typically: (1) Weekday mornings 7:00-9:00 AM, (2) Weekday evenings 5:00-7:00 PM, (3) Friday and Saturday nights 9:00 PM-2:00 AM, and (4) Cruise ship days near the port. You can set your preferred schedule in Settings > Schedule.',
    category: 'Getting Started',
    keywords: ['hours', 'schedule', 'when', 'time', 'availability'],
  },
  {
    id: 'gs-5',
    question: 'Can I drive part-time?',
    answer: 'Yes! Drift is perfect for part-time work. Most drivers work 10-20 hours per week around their other commitments. There are no minimum hour requirements. You can go online and offline whenever you want. Many drivers work only during peak hours or on weekends to maximize earnings.',
    category: 'Getting Started',
    keywords: ['part time', 'flexible', 'hours', 'casual'],
  },

  // ==================== EARNINGS & PAYMENTS ====================
  {
    id: 'earn-1',
    question: 'How much can I earn driving for Drift?',
    answer: 'Earnings vary based on when and how much you drive. On average, Drift drivers in the Cayman Islands earn CI$15-25 per hour after expenses. Peak times (mornings, evenings, weekends) can earn CI$25-35 per hour. Cruise ship days can be especially profitable. Your earnings depend on: trip distance, time, surge pricing, and tips. Track your earnings in real-time in the app.',
    category: 'Earnings',
    keywords: ['how much', 'earn', 'money', 'income', 'pay'],
  },
  {
    id: 'earn-2',
    question: 'When do I get paid?',
    answer: 'Drift pays drivers weekly every Tuesday for the previous week\'s trips (Monday-Sunday). Payments are automatically deposited to your registered bank account. The minimum payout is CI$25.00. If you earn less than CI$25 in a week, your earnings roll over to the next week. You can view your payment history in Wallet > Payout History.',
    category: 'Earnings',
    keywords: ['payment', 'when paid', 'payout', 'deposit', 'weekly'],
  },
  {
    id: 'earn-3',
    question: 'How is the cost-sharing contribution calculated?',
    answer: 'The platform suggests cost-sharing contributions based on: (1) Distance traveled, (2) Estimated time, (3) Current fuel costs. A 19% platform service fee is deducted (4% for transaction processing + 15% for platform maintenance), so you receive 81% of each contribution. Tips go 100% to you.',
    category: 'Earnings',
    keywords: ['fare', 'calculate', 'pricing', 'rate', 'commission'],
  },
  {
    id: 'earn-4',
    question: 'What is surge pricing and how does it work?',
    answer: 'Surge pricing (or "high demand pricing") increases fares during busy times when rider demand exceeds driver supply. Common surge times: cruise ship arrivals, rush hour, bad weather, special events. Surge multipliers range from 1.2x to 2.5x. You\'ll see the surge multiplier before accepting a ride. Your earnings increase proportionally with the surge.',
    category: 'Earnings',
    keywords: ['surge', 'high demand', 'peak', 'multiplier', 'busy'],
  },
  {
    id: 'earn-5',
    question: 'Do I keep all of my tips?',
    answer: 'Yes! You keep 100% of all tips. Tips are added to your earnings within 24 hours and paid out with your weekly earnings. Riders can tip in the app after the trip or in cash. Cash tips are yours to keep immediately. Always thank riders who tip - it encourages great service!',
    category: 'Earnings',
    keywords: ['tips', 'gratuity', 'keep', '100%', 'tipping'],
  },
  {
    id: 'earn-6',
    question: 'What expenses should I expect as a driver?',
    answer: 'Common expenses include: (1) Fuel: ~CI$40-80/week for active drivers, (2) Vehicle maintenance: oil changes every 3 months, tire rotation, (3) Insurance: ensure your policy covers ride-sharing, (4) Vehicle cleaning: keep it clean for passengers, (5) Annual inspection: CI$30-50. The 19% platform service fee (deducted from rider contributions) covers payment processing (4%), platform maintenance, APIs, servers, and customer support (15%).',
    category: 'Earnings',
    keywords: ['expenses', 'costs', 'fuel', 'maintenance', 'gas'],
  },
  {
    id: 'earn-7',
    question: 'Can I see my earnings before accepting a ride?',
    answer: 'Yes! Before accepting any ride request, you\'ll see: (1) Estimated earnings (including any surge), (2) Pickup location and distance, (3) Drop-off destination, (4) Estimated trip time and distance. This helps you make informed decisions about which rides to accept based on your earnings goals.',
    category: 'Earnings',
    keywords: ['estimate', 'see earnings', 'before accept', 'preview'],
  },
 

  // ==================== ACCEPTING & COMPLETING RIDES ====================
  {
    id: 'rides-1',
    question: 'How do ride requests work?',
    answer: 'When you\'re online, you\'ll receive ride requests based on your location. Each request shows: rider name and rating, pickup location and distance, destination, estimated earnings, and trip details. You have 15 seconds to accept or decline. If you don\'t respond, the request goes to another driver. Try to maintain an 85%+ acceptance rate for best results.',
    category: 'Rides',
    keywords: ['request', 'how it works', 'accept', 'receive'],
  },
  {
    id: 'rides-2',
    question: 'Can I decline ride requests?',
    answer: 'Yes, you can decline any ride request. However, your acceptance rate affects your standing. Try to maintain at least 85% acceptance rate. Valid reasons to decline: unsafe pickup location, rider has low rating (below 4.0), pickup is too far away, or you\'re about to go offline. Frequent declines may temporarily reduce your access to ride requests.',
    category: 'Rides',
    keywords: ['decline', 'reject', 'refuse', 'acceptance rate'],
  },
  {
    id: 'rides-3',
    question: 'What if the rider doesn\'t show up?',
    answer: 'If you arrive at the pickup location and the rider doesn\'t appear: (1) Tap "I\'ve Arrived" in the app, (2) Wait 5 minutes at the location, (3) Try calling or texting the rider, (4) After 5 minutes, you can mark "Rider No-Show" and receive a CI$5.00 cancellation fee. The wait timer starts when you tap "I\'ve Arrived".',
    category: 'Rides',
    keywords: ['no show', 'wait', 'cancel', 'rider absent', 'not there'],
  },
  {
    id: 'rides-4',
    question: 'Can I cancel a ride after accepting?',
    answer: 'Yes, but frequent cancellations hurt your rating. Valid cancellation reasons: (1) Rider requests to cancel, (2) Rider is taking too long (5+ minutes), (3) Safety concerns, (4) Vehicle emergency. To cancel: tap "Cancel Ride" button and select a reason. Cancellations after 2 minutes may result in a CI$3.00 fee charged to the rider. Your cancellation rate should stay below 5%.',
    category: 'Rides',
    keywords: ['cancel', 'cancellation', 'back out', 'undo'],
  },
  {
    id: 'rides-5',
    question: 'What if the rider wants to make a stop?',
    answer: 'Riders can request stops during the trip. You can: (1) Accept the stop request in the app (you\'ll earn for the extra time and distance), (2) The rider has 3 minutes at each stop, (3) Meter keeps running during stops, (4) You can have up to 2 stops per trip. If the rider takes too long, you can contact support or end the trip. You\'re not required to accept stop requests that seem unsafe.',
    category: 'Rides',
    keywords: ['stop', 'additional stop', 'detour', 'extra stop'],
  },
  {
    id: 'rides-6',
    question: 'What if a rider asks to pay cash instead of through the app?',
    answer: 'All Drift trips must be paid through the app - never accept cash for the fare. This protects both you and the rider. If a rider offers to pay cash: (1) Politely explain all payments go through the app, (2) If they insist, you can cancel the trip, (3) Report the incident to support. However, riders can tip you in cash, and you keep 100% of cash tips.',
    category: 'Rides',
    keywords: ['cash', 'payment', 'off app', 'outside app'],
  },
  {
    id: 'rides-7',
    question: 'Can I drive outside of Grand Cayman?',
    answer: 'Currently, Drift operates only on Grand Cayman. If a rider requests a trip to Cayman Brac or Little Cayman, you should decline as the app doesn\'t support inter-island trips. You can drive anywhere on Grand Cayman including West Bay, Bodden Town, North Side, and East End.',
    category: 'Rides',
    keywords: ['area', 'coverage', 'where', 'location', 'island'],
  },
  {
    id: 'rides-8',
    question: 'What if a rider leaves something in my car?',
    answer: 'If a rider leaves an item: (1) Check "Lost & Found" in the trip details, (2) If the rider reported it, you\'ll see their contact info, (3) Contact them to arrange return (they should tip you for your time), (4) If valuable, you can drop it at the Drift office at 142 Dorcy Drive, George Town, (5) Keep the item secure for up to 48 hours. Don\'t throw away items - riders may claim them later.',
    category: 'Rides',
    keywords: ['lost item', 'left behind', 'forgot', 'found item'],
  },
  {
    id: 'rides-9',
    question: 'Can I have my own passengers in the car while driving?',
    answer: 'No. For safety and insurance reasons, you cannot have personal passengers (friends, family, pets) in your vehicle while you\'re online or during a trip. If you need to transport your own passengers, go offline first. This policy protects you, riders, and maintains Drift\'s insurance coverage.',
    category: 'Rides',
    keywords: ['personal passengers', 'friends', 'family', 'own passenger'],
  },

  // ==================== VEHICLE REQUIREMENTS ====================
  {
    id: 'vehicle-1',
    question: 'What are the vehicle requirements?',
    answer: 'Your vehicle must: (1) Be 2015 or newer, (2) Have 4 doors and seat at least 4 passengers, (3) Pass annual vehicle inspection, (4) Have valid registration and insurance, (5) Be in good condition (no damage, clean interior), (6) Have working AC (essential in Cayman!), (7) Not be a commercial vehicle (taxi, bus). Popular models: Honda Fit, Toyota Corolla, Nissan Versa.',
    category: 'Vehicle',
    keywords: ['vehicle', 'car', 'requirements', 'eligible', 'qualify'],
  },
  {
    id: 'vehicle-2',
    question: 'Can I drive a rental car for Drift?',
    answer: 'No. You must own or lease your vehicle. Rental cars and rental company insurance do not allow ride-sharing services. You need proper insurance coverage that includes ride-sharing or commercial use. Check with your insurance provider about ride-sharing coverage before starting.',
    category: 'Vehicle',
    keywords: ['rental', 'rent', 'lease', 'rental car'],
  },
  {
    id: 'vehicle-3',
    question: 'What insurance do I need?',
    answer: 'You need comprehensive vehicle insurance that covers ride-sharing. Drift provides insurance during active trips (from pickup to drop-off), but you need personal insurance for: (1) When you\'re offline, (2) When you\'re online but haven\'t accepted a ride, (3) While driving to pickup. Contact local insurers like Cayman First, Brittanic, or Atlas for ride-sharing coverage. Expect to pay CI$150-300 extra annually.',
    category: 'Vehicle',
    keywords: ['insurance', 'coverage', 'policy', 'insured'],
  },
  {
    id: 'vehicle-4',
    question: 'How often do I need vehicle inspection?',
    answer: 'Your vehicle must pass a vehicle inspection annually. You\'ll receive a reminder 30 days before your inspection expires. You can get inspections at any certified inspection station in Cayman. Cost is typically CI$30-50. Upload your updated inspection certificate in the app within 7 days of expiry or your account will be suspended until updated.',
    category: 'Vehicle',
    keywords: ['inspection', 'test', 'annual', 'yearly', 'certificate'],
  },
  {
    id: 'vehicle-5',
    question: 'What if my vehicle breaks down during a trip?',
    answer: 'If your vehicle breaks down during a trip: (1) Ensure everyone\'s safety first, (2) Contact the rider and apologize, (3) Call roadside assistance if needed, (4) Cancel the trip in the app and select "Vehicle Issue", (5) The rider won\'t be charged, (6) Contact Drift support for assistance. Consider having roadside assistance coverage (CI$50-100/year) for peace of mind.',
    category: 'Vehicle',
    keywords: ['breakdown', 'break down', 'emergency', 'car problem'],
  },
  {
    id: 'vehicle-6',
    question: 'Can I switch vehicles?',
    answer: 'Yes! To switch vehicles: (1) Go to Profile > Vehicle Details, (2) Tap "Update Vehicle", (3) Upload new registration, insurance, and inspection documents, (4) Submit for approval (takes 1-2 business days). You can\'t drive with the new vehicle until it\'s approved. Both vehicles must meet Drift requirements.',
    category: 'Vehicle',
    keywords: ['change vehicle', 'different car', 'switch car', 'new vehicle'],
  },

  // ==================== DOCUMENTS & VERIFICATION ====================
  {
    id: 'docs-1',
    question: 'What documents do I need to submit?',
    answer: 'Required documents: (1) Valid Cayman Islands driver\'s license, (2) Vehicle registration certificate, (3) Vehicle insurance certificate (with ride-sharing coverage), (4) Vehicle inspection certificate (annual), (5) Proof of address (utility bill within 3 months), (6) Bank account details for payments. All documents must be clear photos or scans showing all information.',
    category: 'Documents',
    keywords: ['documents', 'papers', 'submit', 'upload', 'required'],
  },
  {
    id: 'docs-2',
    question: 'What if my document is about to expire?',
    answer: 'You\'ll receive notifications 30 days, 14 days, and 7 days before any document expires. Update documents before expiry to avoid account suspension: (1) Go to Profile > Documents, (2) Tap the expiring document, (3) Upload the new document, (4) Submit for review (1-2 business days). Your account will be suspended if you drive with expired documents.',
    category: 'Documents',
    keywords: ['expire', 'renewal', 'update', 'expiring', 'renew'],
  },
  {
    id: 'docs-3',
    question: 'How long does document verification take?',
    answer: 'Document verification typically takes 1-2 business days. You\'ll receive a notification when documents are approved or if there are issues. Common rejection reasons: (1) Photo too blurry, (2) Information cut off, (3) Document expired, (4) Wrong document type. If rejected, you can re-upload immediately. Contact support if it takes longer than 3 business days.',
    category: 'Documents',
    keywords: ['verification', 'approval', 'how long', 'pending', 'review'],
  },
  

  // ==================== ACCOUNT & RATINGS ====================
  {
    id: 'account-1',
    question: 'How does the rating system work?',
    answer: 'After each trip, riders rate you 1-5 stars. Your overall rating is the average of your last 100 trips. Maintain 4.7+ stars to stay in good standing. Ratings below 4.5 may result in account review or deactivation. Riders can also leave comments. Tips to maintain high ratings: be polite, keep vehicle clean, drive safely, offer water/mints, arrive on time, help with luggage.',
    category: 'Account',
    keywords: ['rating', 'stars', 'score', 'reviews'],
  },
  {
    id: 'account-2',
    question: 'What if I get a bad rating?',
    answer: 'Everyone gets occasional bad ratings. Don\'t worry about individual low ratings - focus on your overall average. If you receive multiple low ratings: (1) Review recent trips for issues, (2) Check feedback comments for patterns, (3) Contact support if you think a rating was unfair (we can investigate), (4) Improve service: clean vehicle, professional attitude, safe driving. You can also rate riders 1-5 stars.',
    category: 'Account',
    keywords: ['bad rating', 'low rating', 'poor review', 'complaint'],
  },
  {
    id: 'account-3',
    question: 'Can I change my payout bank account?',
    answer: 'Yes! To change your payout account: (1) Go to Settings > Payout Methods, (2) Add your new bank account details, (3) Verify your account (microdeposit verification), (4) Set as default, (5) Delete old account if desired. Changes take effect on the next payout. Make sure the account is in your name and a Cayman Islands bank.',
    category: 'Account',
    keywords: ['bank account', 'payment method', 'change bank', 'payout'],
  },
  {
    id: 'account-4',
    question: 'How do I take a break or go on vacation?',
    answer: 'Simply go offline when you don\'t want to drive - there\'s no penalty for being offline. For extended breaks: (1) Go offline in the app, (2) No need to notify Drift, (3) Your account stays active for up to 6 months of inactivity, (4) Just go back online when ready. If you\'ll be away longer than 6 months, contact support to keep your account active.',
    category: 'Account',
    keywords: ['vacation', 'break', 'pause', 'inactive', 'time off'],
  },
  {
    id: 'account-5',
    question: 'Can my account be deactivated?',
    answer: 'Yes, accounts can be deactivated for: (1) Rating below 4.5, (2) Acceptance rate below 80%, (3) Completion rate below 85%, (4) Serious safety violations, (5) Fraudulent activity, (6) Multiple rider complaints, (7) Expired documents, (8) Failing to maintain insurance. You\'ll receive warnings before deactivation. Contact support if you believe deactivation was in error.',
    category: 'Account',
    keywords: ['deactivated', 'suspended', 'banned', 'account closed'],
  },

  // ==================== SAFETY & SECURITY ====================
  {
    id: 'safety-1',
    question: 'What should I do if I feel unsafe during a trip?',
    answer: 'Your safety is priority #1. If you feel unsafe: (1) Trust your instincts, (2) Tap the Emergency SOS button in the app, (3) Drive to a well-lit, public area if possible, (4) Call 911 if necessary (SOS button includes quick 911 dial), (5) End the trip and ask the rider to exit, (6) Report the incident to Drift support immediately. You have the right to refuse service if you feel unsafe.',
    category: 'Safety',
    keywords: ['unsafe', 'danger', 'emergency', 'scared', 'threatened'],
  },
  {
    id: 'safety-2',
    question: 'What if a rider is intoxicated?',
    answer: 'You can transport riders who have been drinking if they\'re not being disruptive. However, if a rider: (1) Is vomiting or likely to vomit, (2) Can\'t stand or sit properly, (3) Is aggressive or inappropriate, (4) You can refuse the ride or end it early. For vomit cleanup, you can charge a CI$80 cleaning fee - take photos and submit through the app. Many drivers keep plastic bags and paper towels for drunk passengers.',
    category: 'Safety',
    keywords: ['drunk', 'intoxicated', 'alcohol', 'vomit', 'cleanup'],
  },
  {
    id: 'safety-3',
    question: 'What is Drift\'s insurance coverage during trips?',
    answer: 'Drift provides CI$1 million liability insurance that covers you during active trips (from passenger pickup to drop-off). This covers: (1) Injury to riders and others, (2) Property damage, (3) Legal defense. Coverage applies only when you\'re on an active trip with a passenger. You need your own insurance for when you\'re offline or waiting for rides.',
    category: 'Safety',
    keywords: ['insurance', 'coverage', 'accident', 'liability', 'protected'],
  },
  {
    id: 'safety-4',
    question: 'Can I install a dashcam?',
    answer: 'Yes, dashcams are highly recommended! They protect you in case of: (1) Accidents or false claims, (2) Rider disputes, (3) Insurance claims, (4) Proof of events. Requirements: (1) Must inform riders with visible signage, (2) Audio recording may require consent in Cayman, (3) Don\'t record riders in private moments. Many drivers use front and interior-facing cameras. Cost: CI$50-200 for good quality.',
    category: 'Safety',
    keywords: ['dashcam', 'camera', 'recording', 'video'],
  },
  {
    id: 'safety-5',
    question: 'What if I\'m in an accident during a trip?',
    answer: 'If you\'re in an accident during a trip: (1) Check everyone is safe - call 911 if injuries, (2) Call RCIPS if required (345-949-4222), (3) Take photos of damage and exchange information, (4) Use the in-app incident report immediately, (5) Contact Drift support (345-945-7433), (6) Don\'t admit fault, (7) Drift\'s insurance will handle claims. Keep rider safe until help arrives.',
    category: 'Safety',
    keywords: ['accident', 'crash', 'collision', 'hit', 'insurance claim'],
  },
  {
    id: 'safety-6',
    question: 'Can riders bring children or car seats?',
    answer: 'Yes, riders can travel with children. However: (1) Riders must provide their own car seats (by Cayman law), (2) You\'re not required to have car seats, (3) Don\'t install car seats for riders (liability), (4) Children must be properly restrained, (5) If a rider doesn\'t have a proper car seat, you can refuse the trip. Never compromise child safety - cancel if unsafe.',
    category: 'Safety',
    keywords: ['children', 'kids', 'car seat', 'baby', 'child'],
  },

  // ==================== TECHNICAL & APP ====================
  {
    id: 'tech-1',
    question: 'What if the app isn\'t working properly?',
    answer: 'If you experience app issues: (1) Check your internet connection, (2) Close and restart the app, (3) Update to the latest version (App Store/Play Store), (4) Restart your phone, (5) Clear app cache (Settings > Storage), (6) Reinstall the app if problems persist. For urgent issues during a trip, contact support at 345-945-7433. Report bugs through Settings > Help > Report Issue.',
    category: 'Technical',
    keywords: ['app', 'bug', 'not working', 'broken', 'error', 'crash'],
  },
  {
    id: 'tech-2',
    question: 'What if GPS navigation isn\'t accurate?',
    answer: 'GPS accuracy can vary in Cayman, especially in West Bay and rural areas. Tips: (1) Enable "High Accuracy" location in phone settings, (2) Ensure location permissions are "Always Allow", (3) Use Wi-Fi to improve accuracy, (4) If navigation is wrong, use your knowledge of local roads, (5) You can use Google Maps or Waze alongside Drift, (6) Report GPS issues to support so we can improve our maps.',
    category: 'Technical',
    keywords: ['gps', 'navigation', 'location', 'wrong address', 'directions'],
  },
  {
    id: 'tech-3',
    question: 'Can I use the app on multiple phones?',
    answer: 'Your Drift account works on one phone at a time. You can switch phones by: (1) Logging out of the old phone, (2) Logging into your account on the new phone, (3) Allowing location permissions. You can\'t be online on two devices simultaneously. If you change phones, make sure your new phone meets minimum requirements: iPhone 8+/iOS 14+ or Android 8+.',
    category: 'Technical',
    keywords: ['multiple phones', 'switch phone', 'new phone', 'different device'],
  },
  {
    id: 'tech-4',
    question: 'What phone should I use for driving?',
    answer: 'Recommended phones: iPhone 11 or newer, Samsung Galaxy S10 or newer, Google Pixel 4 or newer. Requirements: (1) Good GPS accuracy, (2) Reliable performance, (3) Long battery life, (4) Large screen for easy viewing. Essential accessories: (1) Car phone mount (CI$15-30), (2) Car charger (keep phone charged), (3) Backup battery pack for long shifts. Position mount for easy viewing without blocking windshield.',
    category: 'Technical',
    keywords: ['phone', 'device', 'requirements', 'compatible'],
  },
  {
    id: 'tech-5',
    question: 'How do I report a technical problem?',
    answer: 'To report technical issues: (1) Go to Settings > Help Center > Contact Support, (2) Select "Technical Problem" category, (3) Describe the issue in detail, (4) Include screenshots if possible, (5) Provide phone model and app version. For urgent issues affecting earnings (can\'t go online, trip won\'t complete), call support at 345-945-7433. Response time: urgent issues within 2 hours, general issues within 24 hours.',
    category: 'Technical',
    keywords: ['report', 'problem', 'support', 'help', 'issue'],
  },

  // ==================== TIPS & BEST PRACTICES ====================
  {
    id: 'tips-1',
    question: 'How can I increase my earnings?',
    answer: 'Top strategies to maximize earnings: (1) Drive during peak hours (mornings, evenings, cruise ship days), (2) Position yourself near popular pickup areas (hotels, airport, port), (3) Accept most rides to get more requests, (4) Provide excellent service for better tips, (5) Keep vehicle clean and comfortable, (6) Track your best days/times and repeat. Top earners drive 20-30 hours during peak times.',
    category: 'Tips',
    keywords: ['maximize', 'increase earnings', 'make more', 'earn more'],
  },
  {
    id: 'tips-2',
    question: 'What do top-rated drivers do differently?',
    answer: 'Highly-rated drivers (4.9+ stars): (1) Keep vehicles spotlessly clean inside and out, (2) Are professional and friendly but not overly chatty, (3) Offer amenities: phone chargers, water, mints, (4) Play appropriate music at low volume, (5) Use AC to keep comfortable temperature, (6) Drive smoothly (no harsh braking or acceleration), (7) Know local roads and shortcuts, (8) Are punctual - arrive on time, (9) Help with luggage when appropriate, (10) Dress professionally (polo shirt, clean appearance).',
    category: 'Tips',
    keywords: ['best practices', 'high rating', 'tips', 'advice', 'improve'],
  },
  {
    id: 'tips-3',
    question: 'Should I talk to riders or stay quiet?',
    answer: 'Follow the rider\'s lead. Start with a friendly greeting: "Hi! I\'m [name], heading to [destination]?". Then read the situation: (1) If they\'re chatty, engage in conversation, (2) If they\'re on their phone or wearing headphones, stay quiet, (3) Safe topics: weather, local events, recommendations, (4) Avoid: politics, religion, personal problems, controversial topics. Most riders appreciate friendly but not overly talkative drivers.',
    category: 'Tips',
    keywords: ['conversation', 'talk', 'quiet', 'chat', 'communicate'],
  },
  {
    id: 'tips-4',
    question: 'Where are the best places to wait for rides?',
    answer: 'High-demand pickup zones in Cayman: (1) Owen Roberts Airport (especially evenings and weekends), (2) George Town near cruise ship port (when ships are in), (3) Seven Mile Beach hotels (Ritz, Westin, Kimpton), (4) Camana Bay shopping area, (5) Foster\'s supermarkets, (6) Popular restaurants and bars (evenings), (7) Cayman Islands Hospital (but be respectful of emergency areas). Avoid sitting in private parking lots.',
    category: 'Tips',
    keywords: ['where to wait', 'hotspots', 'best areas', 'high demand'],
  },
  {
    id: 'tips-5',
    question: 'How do I handle difficult riders?',
    answer: 'Stay calm and professional with difficult riders: (1) Set boundaries politely but firmly, (2) If they\'re rude, don\'t engage - stay professional, (3) If they\'re making you uncomfortable, you can end the trip, (4) Never argue or escalate, (5) Document issues with notes after the trip, (6) Rate honestly and report serious issues to support, (7) Don\'t take it personally - some people are just having bad days. You have the right to refuse unsafe or abusive passengers.',
    category: 'Tips',
    keywords: ['difficult', 'rude', 'handle', 'problem rider', 'complaint'],
  },

  // ==================== COVID-19 & HEALTH ====================
  {
    id: 'covid-1',
    question: 'What are the current COVID-19 requirements for drivers?',
    answer: 'Current Cayman Islands health guidelines: (1) Keep vehicle well-ventilated (crack windows or use fresh air AC), (2) Clean high-touch surfaces regularly (door handles, windows, seat belts), (3) Hand sanitizer available for you and riders (optional), (4) If you feel sick, stay home and go offline, (5) Masks are optional for both drivers and riders, (6) Respect riders\' preferences if they prefer to wear masks. Stay updated on local regulations.',
    category: 'Health & Safety',
    keywords: ['covid', 'coronavirus', 'pandemic', 'mask', 'sanitizer'],
  },
  {
    id: 'covid-2',
    question: 'What if a rider coughs or appears sick?',
    answer: 'If a rider appears ill: (1) You can politely ask if they\'re feeling okay, (2) You have the right to refuse service if concerned, (3) Keep windows cracked for ventilation, (4) Sanitize your vehicle thoroughly after the trip, (5) Wash your hands well, (6) If seriously concerned, report to support. You\'re not required to transport anyone who you believe poses a health risk to you.',
    category: 'Health & Safety',
    keywords: ['sick', 'ill', 'coughing', 'sick rider', 'health'],
  },

  // ==================== TAX & LEGAL ====================
  {
    id: 'tax-1',
    question: 'Do I need to pay taxes on my Drift earnings?',
    answer: 'Tax requirements in Cayman Islands: Good news - the Cayman Islands has no income tax! However: (1) You should keep records of your earnings and expenses, (2) If you earn over a certain amount, you may need a trade & business license (check with Dept. of Commerce & Investment), (3) Consult with a local accountant about proper bookkeeping, (4) Keep receipts for vehicle expenses (fuel, maintenance) for your records.',
    category: 'Legal & Tax',
    keywords: ['tax', 'taxes', 'income', 'irs', 'returns'],
  },
  {
    id: 'tax-2',
    question: 'Am I an employee or independent contractor?',
    answer: 'You\'re an independent contractor, not a Drift employee. This means: (1) You set your own schedule, (2) You\'re responsible for vehicle expenses, (3) No benefits or paid time off, (4) You can work for multiple platforms, (5) You maintain your own insurance and taxes, (6) You have flexibility but also responsibility. This gives you maximum flexibility while earning.',
    category: 'Legal & Tax',
    keywords: ['employee', 'contractor', 'status', 'self employed'],
  },
  {
    id: 'tax-3',
    question: 'Do I need a taxi license to drive for Drift?',
    answer: 'No! Drift drivers do NOT need a taxi license in the Cayman Islands. Drift operates under ride-sharing regulations, which are different from traditional taxis. Requirements: (1) Regular driver\'s license (not commercial), (2) Vehicle must meet Drift requirements (not taxi specifications), (3) Trade & Business License may be required if earnings exceed threshold. Contact Dept. of Commerce (345-945-0252) with specific questions.',
    category: 'Legal & Tax',
    keywords: ['taxi license', 'commercial', 'license', 'legal'],
  },
];

// Category counts for easy reference
export const categoryCounts = {
  'Getting Started': 5,
  'Earnings': 8,
  'Rides': 9,
  'Vehicle': 6,
  'Documents': 4,
  'Account': 5,
  'Safety': 6,
  'Technical': 5,
  'Tips': 5,
  'Health & Safety': 2,
  'Legal & Tax': 3,
};

// Quick search function
export function searchFAQs(query: string): FAQItem[] {
  const lowercaseQuery = query.toLowerCase();
  return driverFAQs.filter(
    faq =>
      faq.question.toLowerCase().includes(lowercaseQuery) ||
      faq.answer.toLowerCase().includes(lowercaseQuery) ||
      faq.keywords.some(keyword => keyword.toLowerCase().includes(lowercaseQuery))
  );
}

// Get FAQs by category
export function getFAQsByCategory(category: string): FAQItem[] {
  return driverFAQs.filter(faq => faq.category === category);
}

// Get all unique categories
export function getCategories(): string[] {
  return Array.from(new Set(driverFAQs.map(faq => faq.category)));
}