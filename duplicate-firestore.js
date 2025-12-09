const admin = require('firebase-admin');
const readline = require('readline');

// Initialize with your project ID
admin.initializeApp({
  projectId: '693488691443'  // Replace with your Firebase project ID
});

const db = admin.firestore();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const prompt = (question) => new Promise((resolve) => rl.question(question, resolve));

(async () => {
  const collection = await prompt('Collection name: ');
  const sourceId = await prompt('Source document ID: ');
  const newId = await prompt('New document ID: ');
  
  const sourceDoc = await db.collection(collection).doc(sourceId).get();
  const data = sourceDoc.data();
  
  console.log('Current data:', JSON.stringify(data, null, 2));
  
  const modify = await prompt('Modify data? (y/n): ');
  
  if (modify === 'y') {
    const field = await prompt('Field to change: ');
    const value = await prompt('New value: ');
    data[field] = value;
  }
  
  await db.collection(collection).doc(newId).set(data);
  console.log('Document duplicated!');
  rl.close();
  process.exit(0);
})();