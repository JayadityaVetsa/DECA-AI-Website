import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

export const getUniqueQuestionForUser = functions.https.onCall(async (data: { event: string }, context: functions.https.CallableContext) => {
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
  const seenIds = seenSnap.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => doc.data().questionId);

  // 2. Find an unseen question for this event
  let questionSnap = await db.collection("questions")
    .where("event", "==", event)
    .get();

  let unseenQuestion = questionSnap.docs.find((doc: admin.firestore.QueryDocumentSnapshot) => !seenIds.includes(doc.id));

  // 3. If none, return null - let frontend handle AI generation
  if (!unseenQuestion) {
    // Return null to indicate no unseen questions available
    // Frontend will handle AI generation and saving to global storage
    return null;
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