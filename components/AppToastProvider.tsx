"use client";

import { Slide, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/** Single app-wide toast container. */
export function AppToastProvider() {
  return (
    <ToastContainer
      className="impostor-toastify"
      toastClassName="impostor-toast"
      icon={false}
      position="bottom-right"
      autoClose={3000}
      transition={Slide}
      hideProgressBar
      newestOnTop
      closeOnClick
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="dark"
    />
  );
}
