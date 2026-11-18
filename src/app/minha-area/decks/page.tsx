import { redirect } from "next/navigation";

/** A lista de decks agora fica na aba Decks da Minha área. */
export default function MeusDecks() {
  redirect("/minha-area?aba=decks");
}
