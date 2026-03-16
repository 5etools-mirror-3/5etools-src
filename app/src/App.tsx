import { createHashRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { LandingPage } from "./components/landing/LandingPage";
import { SpellListView } from "./components/spells/SpellListView";

const router = createHashRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/spells", element: <SpellListView /> },
  { path: "/spells/:spellId", element: <SpellListView /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
