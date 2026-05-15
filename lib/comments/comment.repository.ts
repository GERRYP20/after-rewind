import { db } from "../firebase-admin";
import { DocumentSnapshot, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { Comment } from "./comment.types";

const COLLECTION_NAME = "comments";

const mapComment = (doc: DocumentSnapshot | QueryDocumentSnapshot): Comment => {
  const data = doc.data();

  if (!data) {
    throw new Error(`El documento con ID ${doc.id} no contiene datos.`);
  }

  return {
    id: doc.id,
    eventId: data.eventId,
    userName: data.userName,
    text: data.text,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
  } as Comment;
};

export const CommentRepository = {
  async create(data: Omit<Comment, "id">): Promise<string> {
    const docRef = await db.collection(COLLECTION_NAME).add({
      ...data,
      createdAt: new Date(),
    });
    return docRef.id;
  },

  async getByEvent(eventId: string): Promise<Comment[]> {
    const snapshot = await db
      .collection(COLLECTION_NAME)
      .where("eventId", "==", eventId)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map(mapComment);
  },
};