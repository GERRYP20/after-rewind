/**
 * API Route: DELETE /api/user/delete
 * Orquesta el borrado en cascada de todos los datos de un usuario y su cuenta de Auth.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, db } from "@/lib/firebase-admin";
import { InvitationRepository } from "@/lib/invitations/invitation.repository";
import { Invitation } from "@/lib/invitations/invitation.types";
import { EventPhotoRepository } from "@/lib/photos/event-photo.repository";
import { CommentRepository } from "@/lib/comments/comment.repository";
import { EventGuestRepository } from "@/lib/guests/event-guest.repository";
import { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { deleteFromCloudinary } from "@/lib/cloudinary-utils";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "session";

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "No hay sesión activa" }, { status: 401 });
    }

    // 1. Identificar al usuario que solicita el borrado total de su cuenta
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, false);
    const userId = decodedToken.uid;

    console.log(`Iniciando borrado en cascada para el usuario: ${userId}`);

    // --- FASE A: Borrar eventos creados por el usuario y todos sus datos dependientes ---
    let userEvents: Invitation[] = [];
    try {
      console.log(`Buscando eventos creados por el usuario ${userId}...`);
      // Intentamos obtener la lista de eventos propiedad del usuario
      userEvents = await InvitationRepository.getByUser(userId);
    } catch (e) {
      console.error("Error al obtener eventos del usuario (posible falta de índice):", e);
      try {
        console.log("Reintentando búsqueda de eventos sin ordenamiento...");
        // Fallback: búsqueda simplificada en caso de que Firestore no tenga los índices listos
        const snapshot = await db.collection("invitations")
          .where("createdBy", "==", userId)
          .get();
        userEvents = snapshot.docs.map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() } as Invitation));
      } catch (e2) {
        console.error("Error crítico al intentar obtener eventos sin índice:", e2);
      }
    }
    
    console.log(`Se encontraron ${userEvents.length} eventos para eliminar.`);

    for (const event of userEvents) {
      const eventId = event.id;
      if (!eventId) {
        console.warn("Evento sin ID encontrado, saltando...");
        continue;
      }

      console.log(`Eliminando datos del evento: ${eventId}`);
      
      try {
        // Borrado integral del evento: Fotos, Comentarios e Invitados
        const photos = await EventPhotoRepository.getByEventId(eventId).catch(() => []);
        console.log(`- Borrando ${photos.length} fotos del evento ${eventId}`);
        for (const photo of photos) {
          if (photo.id) {
            // Borramos el archivo en Cloudinary y luego el registro en Firestore
            if (photo.url) await deleteFromCloudinary(photo.url).catch(err => console.error(`  Error físico Cloudinary ${photo.id}:`, err));
            await EventPhotoRepository.delete(photo.id).catch(err => console.error(`  Error borrando foto ${photo.id}:`, err));
          }
        }

        const comments = await CommentRepository.getByEvent(eventId).catch(() => []);
        console.log(`- Borrando ${comments.length} comentarios del evento ${eventId}`);
        for (const comment of comments) {
          if (comment.id) await CommentRepository.delete(comment.id).catch(err => console.error(`  Error borrando comentario ${comment.id}:`, err));
        }

        const guests = await EventGuestRepository.getByEventId(eventId).catch(() => []);
        console.log(`- Borrando ${guests.length} invitados del evento ${eventId}`);
        for (const guest of guests) {
          if (guest.id) await EventGuestRepository.rejectGuest(guest.id).catch(err => console.error(`  Error rechazando invitado ${guest.id}:`, err));
        }

        // Eliminamos el documento principal de la invitación
        console.log(`- Eliminando documento principal del evento ${eventId}`);
        await InvitationRepository.delete(eventId);
        console.log(`- Evento ${eventId} eliminado con éxito.`);
      } catch (err) {
        console.error(`Error procesando borrado integral del evento ${eventId}:`, err);
      }
    }

    // --- FASE B: Limpiar la participación del usuario en eventos de terceros ---
    console.log("Limpiando huella del usuario en otros eventos...");
    
    try {
      // 1. Borrar fotos subidas por el usuario en galerías ajenas
      const userPhotos = await EventPhotoRepository.getByUserId(userId);
      for (const photo of userPhotos) {
        if (photo.id) await EventPhotoRepository.delete(photo.id).catch(err => console.error(`Error borrando foto ajena ${photo.id}:`, err));
      }
    } catch (e) { console.error("Error en limpieza de fotos ajenas:", e); }

    try {
      // 2. Borrar comentarios escritos por el usuario en muros ajenos
      const userComments = await CommentRepository.getByUserId(userId);
      for (const comment of userComments) {
        if (comment.id) await CommentRepository.delete(comment.id).catch(err => console.error(`Error borrando comentario ajeno ${comment.id}:`, err));
      }
    } catch (e) { console.error("Error en limpieza de comentarios ajenos:", e); }

    try {
      // 3. Dar de baja su asistencia en otros eventos y actualizar contadores de invitados
      const userGuestRecords = await EventGuestRepository.getByUserId(userId);
      for (const record of userGuestRecords) {
        if (record.id) {
          await EventGuestRepository.removeGuest(record.id, record.eventId).catch(err => {
            console.error(`Error quitando invitado de evento ajeno ${record.id}:`, err);
            // Si el evento ya no existe, simplemente borramos el registro huérfano
            if (record.id) return EventGuestRepository.rejectGuest(record.id);
          });
        }
      }
    } catch (e) { console.error("Error en limpieza de registros de invitado:", e); }

    // --- FASE C: Eliminar la cuenta de usuario de Firebase Authentication ---
    try {
      await adminAuth.deleteUser(userId);
      console.log(`Cuenta de Auth eliminada para el usuario: ${userId}`);
    } catch (e: unknown) {
      console.error("Error al borrar usuario de Firebase Auth:", e);
      const firebaseError = e as { code?: string };
      // Si el usuario ya fue borrado de Auth (o no se encuentra), ignoramos el error
      if (firebaseError.code !== 'auth/user-not-found') {
        throw e;
      }
    }

    // --- FASE D: Cerrar sesión en el servidor y limpiar cookies ---
    const response = NextResponse.json({ 
      success: true, 
      message: "Cuenta y datos eliminados correctamente" 
    });

    response.cookies.set(COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0, 
      path: "/",
    });

    return response;

  } catch (error: unknown) {
    console.error("Error crítico durante la eliminación de cuenta:", error);
    return NextResponse.json({ 
      error: "Hubo un error al intentar eliminar tu cuenta por completo" 
    }, { status: 500 });
  }
}