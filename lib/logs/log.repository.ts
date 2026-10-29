// Repositorio de logs de seguridad (rate limiting, captcha, login)
import { db } from "../firebase-admin";
import { LogEntry, LogEventType } from "./log.types";

const COLLECTION_NAME = "logs";

export interface CreateLogInput {
  type: LogEventType;
  ip: string;
  resource?: string;
  message: string;
  statusCode?: number;
  meta?: Record<string, unknown>;
}

export interface ListLogsOptions {
  limitCount?: number;
  type?: LogEventType;
}

export const LogRepository = {
  async create(entry: CreateLogInput): Promise<void> {
    await db.collection(COLLECTION_NAME).add({
      ...entry,
      createdAt: new Date(),
    });
  },

  async list({ limitCount = 100, type }: ListLogsOptions = {}): Promise<LogEntry[]> {
    let query = db.collection(COLLECTION_NAME).orderBy("createdAt", "desc").limit(limitCount);

    if (type) {
      // Firestore no permite where + orderBy en campos distintos sin índice compuesto,
      // así que para filtrar por tipo ordenamos en memoria tras traer el límite solicitado.
      const snapshot = await db
        .collection(COLLECTION_NAME)
        .where("type", "==", type)
        .limit(limitCount)
        .get();

      return snapshot.docs
        .map(mapLog)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const snapshot = await query.get();
    return snapshot.docs.map(mapLog);
  },
};

function mapLog(doc: FirebaseFirestore.QueryDocumentSnapshot): LogEntry {
  const data = doc.data();
  return {
    id: doc.id,
    type: data.type,
    ip: data.ip,
    resource: data.resource,
    message: data.message,
    statusCode: data.statusCode,
    meta: data.meta,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
  };
}
