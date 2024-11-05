'use client'
import React from "react";
import Link from "next/link";
import { usePathname } from 'next/navigation';
import { FaChartSimple } from "react-icons/fa6";
import { IoIosLogOut, IoIosMenu, IoIosPerson } from "react-icons/io";
import { TbCategoryPlus } from "react-icons/tb";
import { IoIosSettings } from "react-icons/io";
import { MdOutlineProductionQuantityLimits } from "react-icons/md";



import { useAuth } from "@/app/auth";

export default function Nave() {
    const pathname = usePathname();
    const { logout } = useAuth();

    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    const handleSidebarToggle = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="dashboard">
            <button className="sidebar-toggle" onClick={handleSidebarToggle}>
                {isSidebarOpen ? <IoIosMenu /> : <IoIosMenu />}
            </button>

            <nav className={`dashboard-nav ${isSidebarOpen ? 'open' : ''}`}>
                <div className="dash-logo">
                    <img src="/logo4.png" />
                </div>

                <div className="dash-links">
                    <div className={pathname === '/dashboard/pages' ? 'dash-link active' : 'dash-link'}>
                        <Link href={'/dashboard/pages'} ><FaChartSimple className={pathname === '/dashboard/pages' ? 'icon act' : 'icon'} />صفحات </Link>
                    </div>

                    <div className={pathname === '/dashboard/users' ? 'dash-link active' : 'dash-link'}>
                        <Link href={'/dashboard/users'} ><IoIosPerson className={pathname === '/dashboard/users' ? 'icon act' : 'icon'} />المستخدمين </Link>
                    </div>
                    <div className={pathname === '/dashboard/category' ? 'dash-link active' : 'dash-link'}>
                        <Link href={'/dashboard/category'} ><TbCategoryPlus className={pathname === '/dashboard/category' ? 'icon act' : 'icon'} />التصنيفات </Link>
                    </div>
                    <div className={pathname === '/dashboard/product' ? 'dash-link active' : 'dash-link'}>
                        <Link href={'/dashboard/product'} ><MdOutlineProductionQuantityLimits className={pathname === '/dashboard/product' ? 'icon act' : 'icon'} />المنتج </Link>
                    </div>
                    <div className={pathname === '/dashboard/settings' ? 'dash-link active' : 'dash-link'}>
                        <Link href={'/dashboard/settings'} ><IoIosSettings className={pathname === '/dashboard/settings' ? 'icon act' : 'icon'} />الاعدادات </Link>
                    </div>


                    <div className={'dash-link'} >
                        <IoIosLogOut className={'icon'} />
                        <a href="" onClick={handleLogout}>تسجيل خروج</a>
                    </div>
                </div>
            </nav>
        </div>
    );
}
