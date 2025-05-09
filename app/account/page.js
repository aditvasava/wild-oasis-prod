import { auth } from "../_lib/auth";

export default async function Page() {
  const session = await auth();
  return <div className="text-3xl text-accent-400">{session.user.name}</div>;
}
