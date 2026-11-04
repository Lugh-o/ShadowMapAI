import { prisma } from "@/lib/db";
import { getPilotRefs } from "@/lib/pilot-ref";

export interface PilotRefRow {
  ref: string;
  reports: number;
  users: number;
  feedbacks: number;
}

export interface PilotData {
  activeUsers: number;
  conversations: number;
  messages: number;
  thumbsUpPercent: number | null;
  averageRating: number | null;
  refs: PilotRefRow[];
}

function countMessages(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

/**
 * Indicadores do piloto para o relatório. Visível apenas para administradores
 * na página do dashboard.
 */
export async function getPilotData(): Promise<PilotData> {
  const [points, conversations, feedback] = await Promise.all([
    prisma.pointFeature.findMany({
      select: { ref: true, submittedBy: true },
    }),
    prisma.assistantConversation.findMany({
      select: { userId: true, ref: true, messages: true },
    }),
    prisma.feedback.findMany({
      select: { userId: true, ref: true, rating: true, targetType: true },
    }),
  ]);

  const activeUsers = new Set<string>();

  for (const point of points) {
    if (point.submittedBy) activeUsers.add(point.submittedBy);
  }

  for (const conversation of conversations) {
    if (conversation.userId) activeUsers.add(conversation.userId);
  }

  for (const item of feedback) {
    if (item.userId) activeUsers.add(item.userId);
  }

  const thumbs = feedback.filter(
    (item) =>
      item.targetType === "assistant_message" &&
      (item.rating === 1 || item.rating === -1),
  );
  const thumbsUp = thumbs.filter((item) => item.rating === 1).length;

  const numericRatings = feedback.filter(
    (item) =>
      item.targetType !== "assistant_message" &&
      item.rating >= 1 &&
      item.rating <= 5,
  );
  const averageRating =
    numericRatings.length > 0
      ? numericRatings.reduce((sum, item) => sum + item.rating, 0) /
        numericRatings.length
      : null;

  const refs = new Set<string>(getPilotRefs());

  for (const point of points) {
    if (point.ref) refs.add(point.ref);
  }

  for (const conversation of conversations) {
    if (conversation.ref) refs.add(conversation.ref);
  }

  for (const item of feedback) {
    if (item.ref) refs.add(item.ref);
  }

  const refRows = [...refs].map((ref) => {
    const refPoints = points.filter((point) => point.ref === ref);
    const refConversations = conversations.filter(
      (conversation) => conversation.ref === ref,
    );
    const refFeedback = feedback.filter((item) => item.ref === ref);
    const users = new Set<string>();

    for (const point of refPoints) {
      if (point.submittedBy) users.add(point.submittedBy);
    }

    for (const conversation of refConversations) {
      if (conversation.userId) users.add(conversation.userId);
    }

    for (const item of refFeedback) {
      if (item.userId) users.add(item.userId);
    }

    return {
      ref,
      reports: refPoints.length,
      users: users.size,
      feedbacks: refFeedback.length,
    };
  });

  return {
    activeUsers: activeUsers.size,
    conversations: conversations.length,
    messages: conversations.reduce(
      (total, conversation) => total + countMessages(conversation.messages),
      0,
    ),
    thumbsUpPercent:
      thumbs.length > 0 ? Math.round((thumbsUp / thumbs.length) * 100) : null,
    averageRating,
    refs: refRows,
  };
}
