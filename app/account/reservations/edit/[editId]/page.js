import UpdateReservationForm from "@/app/_components/UpdateReservationForm";
import { auth } from "@/app/_lib/auth";
import { getBooking, getBookings, getCabin } from "@/app/_lib/data-service";

async function Page({ params }) {
  const session = await auth();
  if (!session) throw new Error("You must be logged in to the app");

  const reservation = await getBooking(params.editId);

  const { id, cabinId } = reservation;

  const cabinInfo = await getCabin(cabinId);

  const { maxCapacity } = cabinInfo;

  return (
    <div>
      <h2 className="font-semibold text-2xl text-accent-400 mb-7">
        Edit Reservation #{id}
      </h2>

      <UpdateReservationForm
        maxCapacity={maxCapacity}
        reservation={reservation}
      />
    </div>
  );
}

export default Page;
