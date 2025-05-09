"use server";

import { revalidatePath } from "next/cache";
import { auth, signIn, signOut } from "./auth";

import {
  getBookings,
  updateGuest as updateBookingBackendAPI,
  deleteBooking as deleteBookingBackendAPI,
  getBooking,
  updateBooking,
  createBooking,
} from "./data-service";
import { redirect } from "next/navigation";

export async function signInAction() {
  await signIn("google", { redirectTo: "/account" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function updateGuest(formData) {
  const session = await auth();
  if (!session) throw new Error("You must be logged in to the app");

  const nationalId = formData.get("nationalId");
  const [nationality, countryFlag] = formData.get("nationality").split("%");

  if (!/^[a-zA-Z0-9]{6,12}$/.test(nationalId)) {
    throw new Error("Please provide a valid national ID");
  }

  const dataToBeSentToDb = { nationalId, nationality, countryFlag };

  await updateBookingBackendAPI(session.user.guestId, dataToBeSentToDb);

  revalidatePath("/account/profile");
}

export async function deleteBooking(id) {
  const session = await auth();
  if (!session) throw new Error("You must be logged in to the app");

  const guestBookings = await getBookings(session.user.guestId);
  const guestBookingIds = guestBookings.map((booking) => booking.id);

  if (!guestBookingIds.includes(id)) {
    throw new Error("You are not allowed to delete this booking.");
  }

  await deleteBookingBackendAPI(id);
  revalidatePath("/account/reservations");
}

export async function updateReservation(formData) {
  const session = await auth();
  if (!session) throw new Error("You must be logged in to the app");

  const bookingId = Number(formData.get("bookingId"));
  const guestBookings = await getBookings(session.user.guestId);
  const guestBookingIds = guestBookings.map((booking) => booking.id);

  if (!guestBookingIds.includes(bookingId)) {
    throw new Error("You are not allowed to delete this booking.");
  }

  const numGuests = formData.get("numGuests");
  const observations = formData.get("observations").slice(0, 1000);

  const booking = await getBooking(bookingId);

  let final_observations = observations;

  if (observations === "" && booking.observations.length > 0) {
    final_observations = booking.observations;
  }

  const dataToBeSentToDb = { numGuests, observations: final_observations };

  await updateBooking(bookingId, dataToBeSentToDb);

  revalidatePath(`/account/reservations/edit/${bookingId}`);
  redirect("/account/reservations");
}

export async function createReservation(bookingData, formData) {
  const session = await auth();
  if (!session) throw new Error("You must be logged in to the app");

  const newBooking = {
    ...bookingData,
    guestId: session.user.guestId,
    numGuests: Number(formData.get("numGuests")),
    observations: formData.get("observations").slice(0, 1000),
    extrasPrice: 0,
    totalPrice: bookingData.cabinPrice,
    isPaid: false,
    hasBreakfast: false,
    status: "unconfirmed",
  };

  await createBooking(newBooking);

  revalidatePath(`/cabins/${bookingData.cabinId}`);

  redirect("/cabins/thankyou");
}
