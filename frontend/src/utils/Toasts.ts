import { Bounce, toast } from "react-toastify";

export function successToast(message: string) {
    toast.success(message, {
        position: "bottom-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        transition: Bounce,
    });
}

export function errorToast(message: string) {
    toast.error(message, {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        transition: Bounce,
    });
}

export function extractMessageFromErrorAndToast(error: any, defaultMsg: string) {
    console.error('Failed to delete personas', error);
    const message = error?.data?.message || error?.message || defaultMsg;
    errorToast(message);
}