const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.setUserRole = functions.firestore
  .document("users/{uid}")
  .onWrite(async (change, context) => {
    const data = change.after.data();
    
    // If document was deleted, we might want to clear claims, but for now let's stick to the requested logic
    if (!data) return;

    const role = data.role?.toLowerCase(); // make uniform (admin, sales, designer etc)

    if (!role) {
      console.log(`No role found for user ${context.params.uid}`);
      return;
    }

    try {
      await admin.auth().setCustomUserClaims(context.params.uid, { role });
      console.log(`Role '${role}' applied to user ${context.params.uid}`);
    } catch (error) {
      console.error("Error setting custom claims:", error);
    }
  });
