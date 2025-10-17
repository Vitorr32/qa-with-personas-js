import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { Provider } from "react-redux"
import { store } from "./store/store"
import "./main.css"

import { routeTree } from './routeTree.gen'
import { createRouter, RouterProvider } from "@tanstack/react-router"
import { ToastContainer } from "react-toastify"


const router = createRouter({ routeTree })
// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const container = document.getElementById("root")


if (container) {
  const root = createRoot(container)


  root.render(
    <StrictMode>
      <Provider store={store}>
        <RouterProvider router={router} />
        <ToastContainer />
      </Provider>
    </StrictMode>,
  )
} else {
  throw new Error(
    "Root element with ID 'root' was not found in the document. Ensure there is a corresponding HTML element with the ID 'root' in your HTML file.",
  )
}
