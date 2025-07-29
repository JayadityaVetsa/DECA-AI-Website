"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUniqueQuestionForUser = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();
exports.getUniqueQuestionForUser = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
    }
    const uid = context.auth.uid;
    const event = data.event;
    if (!event) {
        throw new functions.https.HttpsError("invalid-argument", "Event is required.");
    }
    // 1. Get all seen question IDs for this user/event
    const seenSnap = await db.collection(`users/${uid}/seenQuestions`)
        .where("event", "==", event)
        .get();
    const seenIds = seenSnap.docs.map((doc) => doc.data().questionId);
    // 2. Find an unseen question for this event
    let questionSnap = await db.collection("questions")
        .where("event", "==", event)
        .get();
    let unseenQuestion = questionSnap.docs.find((doc) => !seenIds.includes(doc.id));
    // 3. If none, generate a new question (replace with your AI logic)
    if (!unseenQuestion) {
        // TODO: Replace this with your AI question generation logic
        const newQuestion = {
            text: `Sample AI-generated question for ${event} at ${new Date().toISOString()}`,
            event,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            aiGenerated: true,
        };
        const newDocRef = await db.collection("questions").add(newQuestion);
        const newDocSnap = await newDocRef.get();
        unseenQuestion = newDocSnap;
    }
    // Ensure unseenQuestion is not undefined
    if (!unseenQuestion) {
        throw new functions.https.HttpsError("internal", "Failed to get or create a question.");
    }
    // 4. Mark as seen for this user
    await db.collection(`users/${uid}/seenQuestions`).add({
        questionId: unseenQuestion.id,
        event,
        seenAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    // 5. Return the question
    return {
        id: unseenQuestion.id,
        ...unseenQuestion.data(),
    };
});
//# sourceMappingURL=index.js.map