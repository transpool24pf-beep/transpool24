import { redirect } from "next/navigation";

/** Inhaltsverwaltung wurde nach /website verschoben (eigenes Passwort, keine Aufträge). */
export default function AdminContentRedirectPage() {
  redirect("/website");
}
