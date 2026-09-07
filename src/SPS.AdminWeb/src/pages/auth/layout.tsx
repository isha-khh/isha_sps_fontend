import type {ReactNode} from "react";


const AuthLayout = ({ children }: { children: ReactNode }) => {

    return (
        <div className="grid grid-cols-12 overflow-auto sm:h-screen">
            <div className="relative hidden bg-[#F0F5FF] lg:col-span-7 lg:block xl:col-span-8 2xl:col-span-9 dark:bg-[#14181c]">
                <div className="absolute inset-0 flex items-center justify-center">
                    <img src="/assets/auth/auth-hero2.png" className="object-cover" alt="Auth Image" />
                </div>
                <div className="animate-bounce-2 absolute right-[20%] bottom-[15%]">
                    <div className="card bg-base-100/80 w-64 backdrop-blur-lg">

                    </div>
                </div>
            </div>
            <div className="col-span-12 lg:col-span-5 xl:col-span-4 2xl:col-span-3">{children}</div>
        </div>
    );
};

export default AuthLayout;
