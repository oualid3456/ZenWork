import { supabase } from "../supabaseClient";
import {
  getAttachmentKind,
  isAllowedPostAttachment,
  isAllowedCommentGif,
  isAttachmentSizeAllowed,
  normalizeRole,
} from "./forumUtils";

const FORUM_BUCKET = "forum-media";

function sanitizeFileName(name = "file") {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.\-]/g, "_")
    .slice(0, 120);
}

function getPublicUrl(path) {
  const { data } = supabase.storage.from(FORUM_BUCKET).getPublicUrl(path);
  return data?.publicUrl ?? null;
}

export function normalizeForumRole(role) {
  return normalizeRole(role);
}

export async function fetchCurrentUserRole(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return normalizeRole(data?.role);
}

export async function fetchProfileById(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nom, prenom, role")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchMembersExcept(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nom, prenom, role")
    .neq("id", userId)
    .order("prenom", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function fetchProfilesByIds(ids = []) {
  if (!ids.length) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nom, prenom, role")
    .in("id", ids);

  if (error) throw error;
  return data ?? [];
}

export async function fetchPostsByMode(mode) {
  const { data, error } = await supabase
    .from("forum_posts")
    .select("*")
    .eq("mode", mode)
    .neq("status", "deleted")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchComments(postId) {
  const { data, error } = await supabase
    .from("forum_comments")
    .select("*")
    .eq("post_id", postId)
    .neq("status", "deleted")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function fetchAttachmentsByTargets(targetType, targetIds = []) {
  if (!targetIds.length) return {};

  const { data, error } = await supabase
    .from("forum_attachments")
    .select("*")
    .eq("target_type", targetType)
    .in("target_id", targetIds)
    .eq("is_rejected", false)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const grouped = {};
  (data ?? []).forEach((item) => {
    const key = String(item.target_id);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push({
      ...item,
      publicUrl: getPublicUrl(item.storage_path),
    });
  });

  return grouped;
}

export async function uploadForumAttachment(file, { targetType, targetId, uploaderId }) {
  if (!file) throw new Error("Fichier manquant.");

  const mimeType = file.type || "";
  const kind = getAttachmentKind(mimeType);

  if (!kind) {
    throw new Error("Type de fichier non pris en charge.");
  }

  if (targetType === "post") {
    if (!isAllowedPostAttachment(mimeType)) {
      throw new Error("Type de fichier non autorisé pour un post.");
    }
  }

  if (targetType === "comment") {
    if (!isAllowedCommentGif(mimeType)) {
      throw new Error("Seul un GIF est autorisé dans un commentaire.");
    }
  }

  if (!isAttachmentSizeAllowed(file)) {
    throw new Error("Le fichier dépasse la taille maximale autorisée.");
  }

  const safeName = sanitizeFileName(file.name);
  const path = `${uploaderId}/${targetType}-${targetId}-${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(FORUM_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: mimeType,
    });

  if (uploadError) throw uploadError;

  const record = {
    target_type: targetType,
    target_id: targetId,
    uploader_id: uploaderId,
    kind,
    storage_path: path,
    file_name: safeName,
    mime_type: mimeType,
    size_bytes: file.size,
    scan_status: "pending",
    is_nsfw: false,
    is_rejected: false,
  };

  const { data, error } = await supabase
    .from("forum_attachments")
    .insert([record])
    .select()
    .single();

  if (error) throw error;

  return {
    ...data,
    publicUrl: getPublicUrl(data.storage_path),
  };
}

export async function deleteAttachment(attachmentId) {
  const { data, error } = await supabase
    .from("forum_attachments")
    .select("id, storage_path")
    .eq("id", attachmentId)
    .single();

  if (error) throw error;

  const { error: storageError } = await supabase.storage
    .from(FORUM_BUCKET)
    .remove([data.storage_path]);

  if (storageError) throw storageError;

  const { error: deleteError } = await supabase
    .from("forum_attachments")
    .delete()
    .eq("id", attachmentId);

  if (deleteError) throw deleteError;

  return true;
}

export async function createPost({ userId, authorName, content, mode, attachments = [] }) {
  const payload = {
    user_id: userId,
    author_name: authorName,
    content,
    mode,
    status: "published",
    has_media: attachments.length > 0,
  };

  const { data, error } = await supabase
    .from("forum_posts")
    .insert([payload])
    .select()
    .single();

  if (error) throw error;

  if (attachments.length) {
    for (const file of attachments) {
      await uploadForumAttachment(file, {
        targetType: "post",
        targetId: data.id,
        uploaderId: userId,
      });
    }
  }

  return data;
}

export async function updatePost({ postId, userId, content }) {
  const { data, error } = await supabase
    .from("forum_posts")
    .update({ content, edited_at: new Date().toISOString() })
    .eq("id", postId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePost(postId) {
  const { error } = await supabase
    .from("forum_posts")
    .update({ status: "deleted" })
    .eq("id", postId);

  if (error) throw error;
  return true;
}

export async function moderateForumPost({ postId, status, moderationReason = null }) {
  const { data, error } = await supabase
    .from("forum_posts")
    .update({
      status,
      moderation_reason: moderationReason,
    })
    .eq("id", postId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function moderateForumComment({
  commentId,
  status,
  moderationReason = null,
}) {
  const { data, error } = await supabase
    .from("forum_comments")
    .update({
      status,
      moderation_reason: moderationReason,
    })
    .eq("id", commentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchLikes(postId) {
  const { data, error } = await supabase
    .from("forum_likes")
    .select("*")
    .eq("post_id", postId);

  if (error) throw error;
  return data ?? [];
}

export async function toggleLike({ postId, userId, hasLiked }) {
  if (hasLiked) {
    const { error } = await supabase
      .from("forum_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);

    if (error) throw error;
    return { liked: false };
  }

  const { error } = await supabase
    .from("forum_likes")
    .insert([{ post_id: postId, user_id: userId }]);

  if (error) throw error;
  return { liked: true };
}

export async function createComment({
  postId,
  userId,
  authorName,
  content,
  parentCommentId = null,
  gifFile = null,
}) {
  const payload = {
    post_id: postId,
    user_id: userId,
    author_name: authorName,
    content,
    parent_comment_id: parentCommentId,
    status: "published",
    has_gif: Boolean(gifFile),
  };

  const { data, error } = await supabase
    .from("forum_comments")
    .insert([payload])
    .select()
    .single();

  if (error) throw error;

  if (gifFile) {
    await uploadForumAttachment(gifFile, {
      targetType: "comment",
      targetId: data.id,
      uploaderId: userId,
    });
  }

  return data;
}

export async function updateComment({ commentId, userId, content }) {
  const { data, error } = await supabase
    .from("forum_comments")
    .update({ content, edited_at: new Date().toISOString() })
    .eq("id", commentId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteComment(commentId) {
  const { error } = await supabase
    .from("forum_comments")
    .update({ status: "deleted" })
    .eq("id", commentId);

  if (error) throw error;
  return true;
}

export async function createForumReport({
  reporterId,
  targetType,
  targetId,
  reason,
  details = "",
}) {
  const { data, error } = await supabase
    .from("forum_reports")
    .insert([
      {
        reporter_id: reporterId,
        target_type: targetType,
        target_id: targetId,
        reason,
        details,
        status: "open",
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchOpenForumReports() {
  const { data, error } = await supabase
    .from("forum_reports")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function reviewForumReport({ reportId, reviewedBy, status = "reviewed" }) {
  const { data, error } = await supabase
    .from("forum_reports")
    .update({
      status,
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", reportId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createForumSanction({
  userId,
  type,
  reason,
  endAt = null,
  issuedBy,
}) {
  const { data, error } = await supabase
    .from("forum_user_sanctions")
    .insert([
      {
        user_id: userId,
        type,
        reason,
        end_at: endAt,
        issued_by: issuedBy,
        is_active: true,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function clearForumSanction(sanctionId) {
  const { data, error } = await supabase
    .from("forum_user_sanctions")
    .update({ is_active: false })
    .eq("id", sanctionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchActiveForumSanction(userId) {
  const { data, error } = await supabase
    .from("forum_user_sanctions")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const now = Date.now();
  const active = (data ?? []).find((item) => {
    if (!item.end_at) return true;
    return new Date(item.end_at).getTime() > now;
  });

  return active ?? null;
}

export async function fetchPrivateMessages(userId, otherUserId) {
  const { data, error } = await supabase
    .from("forum_private_messages")
    .select("*")
    .or(
      `and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`
    )
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function sendPrivateMessage({ senderId, receiverId, content }) {
  const { data, error } = await supabase
    .from("forum_private_messages")
    .insert([
      {
        sender_id: senderId,
        receiver_id: receiverId,
        content,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}
