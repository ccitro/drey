import { Dialog, Transition } from "@headlessui/react";
import React, { Fragment } from "react";

interface DialogProps {
    open?: boolean | undefined;
    onClose(value: boolean): void;
    initialFocus?: React.MutableRefObject<HTMLElement | null> | undefined;
}

export default function DreyDialog(props: React.PropsWithChildren<DialogProps>) {
    return (
        <Transition appear show={props.open} as={Fragment}>
            <Dialog as="div" initialFocus={props.initialFocus} className="relative z-10" onClose={props.onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                                {props.children}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
