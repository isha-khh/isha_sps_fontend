import { useEffect, useRef, useState } from "react";
import { useLocation, Link } from 'react-router-dom';
import SimpleBarCore from "simplebar-core";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";

import { Logo } from "../Logo";
import { useConfig } from "../../contexts/config";

import {type ISidebarMenuItem, SidebarMenuItem } from "./SidebarMenuItem";
import { getActivatedItemParentKeys } from "./helpers";
import {useAuthStore} from "@/stores/auth-store.ts";



const DEFAULT_AVATAR = "/assets/avatars/1.png";
export const Sidebar = ({ menuItems }: { menuItems: ISidebarMenuItem[] }) => {
    const { pathname } = useLocation();

    const { calculatedSidebarTheme } = useConfig();
    const scrollRef = useRef<SimpleBarCore | null>(null);
    const hasMounted = useRef(false);
    const {user} = useAuthStore();
    const [activatedParents, setActivatedParents] = useState<Set<string>>(new Set());
    const avatarUrl = user?.avatarUrl || DEFAULT_AVATAR;
    useEffect(() => {
        setActivatedParents(getActivatedItemParentKeys(menuItems, pathname));
    }, [menuItems, pathname]);

    const onToggleActivated = (key: string) => {
        if (activatedParents.has(key)) {
            activatedParents.delete(key);
        } else {
            activatedParents.add(key);
        }
        setActivatedParents(new Set(activatedParents));
    };

    useEffect(() => {
        setTimeout(() => {
            const contentElement = scrollRef.current?.getContentElement();
            const scrollElement = scrollRef.current?.getScrollElement();
            if (contentElement) {
                const activatedItem = contentElement.querySelector<HTMLElement>(".active");
                const top = activatedItem?.getBoundingClientRect().top;
                if (activatedItem && scrollElement && top && top !== 0) {
                    scrollElement.scrollTo({ top: scrollElement.scrollTop + top - 300, behavior: "smooth" });
                }
            }
        }, 100);
    }, [activatedParents, scrollRef]);

    useEffect(() => {
        if (!hasMounted.current) {
            hasMounted.current = true;
            return;
        }
        if (window.innerWidth <= 64 * 16) {
            const sidebarTrigger = document.querySelector<HTMLInputElement>("#layout-sidebar-toggle-trigger");
            if (sidebarTrigger) {
                sidebarTrigger.checked = false;
            }
        }
    }, [pathname]);

    return (
        <>
            <input
                type="checkbox"
                id="layout-sidebar-toggle-trigger"
                className="hidden"
                aria-label="Toggle layout sidebar"
            />
            <input
                type="checkbox"
                id="layout-sidebar-hover-trigger"
                className="hidden"
                aria-label="Dense layout sidebar"
            />
            <div id="layout-sidebar-hover" className="bg-base-300 h-screen w-1"></div>

            <div id="layout-sidebar" className="sidebar-menu flex" data-theme={calculatedSidebarTheme}>
                <div className="flex h-16 min-h-16 items-center justify-between gap-3 ps-5 pe-4">
                    <Link to="/dashboards/ecommerce">
                        <Logo />
                    </Link>
                    <label
                        htmlFor="layout-sidebar-hover-trigger"
                        title="隱藏側邊欄"
                        className="btn btn-circle btn-ghost btn-sm text-base-content/50 relative max-lg:hidden">
                        <span className="iconify lucide--panel-left-close absolute size-4.5 opacity-100 transition-all duration-300 group-has-[[id=layout-sidebar-hover-trigger]:checked]/html:opacity-0" />
                        <span className="iconify lucide--panel-left-dashed absolute size-4.5 opacity-0 transition-all duration-300 group-has-[[id=layout-sidebar-hover-trigger]:checked]/html:opacity-100" />
                    </label>
                </div>
                <div className="relative min-h-0 grow">
                    <SimpleBar ref={scrollRef} className="size-full">
                        <div className="mb-3 space-y-0.5 px-2.5">
                            {menuItems.map((item, index) => (
                                <SidebarMenuItem
                                    {...item}
                                    key={index}
                                    activated={activatedParents}
                                    onToggleActivated={onToggleActivated}
                                />
                            ))}
                        </div>
                    </SimpleBar>
                    <div className="from-base-100/60 pointer-events-none absolute start-0 end-0 bottom-0 h-7 bg-linear-to-t to-transparent"></div>
                </div>

                <div className="mb-2">

                    <hr className="border-base-300 my-2 border-dashed" />
                    <div className="dropdown dropdown-top dropdown-end w-full">
                        <div
                            tabIndex={0}
                            role="button"
                            className="bg-base-200 hover:bg-base-300 rounded-box mx-2 mt-0 flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-all">
                            <div className="avatar">
                                <div className="bg-base-200 mask mask-squircle w-8">
                                    <img src={avatarUrl} alt="Avatar" />
                                </div>
                            </div>
                            <div className="grow -space-y-0.5">
                                <p className="text-sm font-medium">{user?.name}</p>
                                <p className="text-base-content/60 text-xs">{user?.roles?.[0]?.name}</p>
                            </div>
                            <span className="iconify lucide--chevrons-up-down text-base-content/60 size-4" />
                        </div>
                        <ul
                            role="menu"
                            tabIndex={0}
                            className="dropdown-content menu bg-base-100 rounded-box shadow-base-content/4 mb-1 w-48 p-1 shadow-[0px_-10px_40px_0px]">
                            <li>
                                <Link to="/profile">
                                    <span className="iconify lucide--user size-4" />
                                    <span>個人資料</span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/system/appearance">
                                    <span className="iconify lucide--palette size-4" />
                                    <span>外觀設定</span>
                                </Link>
                            </li>

                        </ul>
                    </div>
                </div>
            </div>

            <label htmlFor="layout-sidebar-toggle-trigger" id="layout-sidebar-backdrop"></label>
        </>
    );
};
